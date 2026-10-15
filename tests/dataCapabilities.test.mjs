import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import test from 'node:test'
import { build, transformSync } from 'esbuild'
import { firstValueFrom } from 'rxjs'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '../dataCapabilities')

test('公共 Provider 清单仅在私有化环境装配，SaaS 和 cloud 不加载数据源', async () => {
  for (const environment of ['', 'saas', 'cloud']) {
    const output = await build({
      entryPoints: [resolve(root, 'manifest.ts')], bundle: true, write: false, format: 'esm',
      define: { 'import.meta.env.VITE_APP_ENVIRONMENT': JSON.stringify(environment) },
      alias: { '@jetlinks-web-core': resolve(root, '../../../jetlinks-web-core/src') },
      plugins: [{ name: 'provider-boundary', setup(api) {
        api.onResolve({ filter: /^\.\/index$/ }, () => ({ path: './index', external: true }))
      } }],
    })
    const { default: manifest } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`)
    assert.deepEqual(Object.keys(manifest), environment ? [] : ['savedQueries'])
    if (!environment) {
      assert.equal(manifest.savedQueries.dynamicSourceNamespace, 'datasource.saved-query')
      assert.deepEqual(manifest.savedQueries.capabilityIds, [])
      assert.equal(typeof manifest.savedQueries.loader, 'function')
    }
  }
})

const cache = new Map()
// Execute the real Provider, codecs and service with only the HTTP transport supplied by each test.
function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports
  const module = { exports: {} }
  cache.set(filename, module)
  const { code } = transformSync(readFileSync(filename, 'utf8'), { loader: 'ts', format: 'cjs' })
  new Function('require', 'module', 'exports', code)(id => id.startsWith('.')
    ? load(resolve(dirname(filename), `${id}.ts`)) : require(id), module, module.exports)
  return module.exports
}
const { createCustomSourceProvider } = load(resolve(root, 'provider.ts'))
const { sourceCapabilityId, parseSourceCapabilityId } = load(resolve(root, 'reference.ts'))
const { inputSchema, isReadQuery, normalizeCommandResult } = load(resolve(root, 'schema.ts'))
const { listConnections, listSavedQueries } = load(resolve(root, 'service.ts'))
const query = { id: 'saved/查询', dataSourceId: 'database/1', dataSourceTypeId: 'pgsql', support: 'rows', name: 'Records' }
const connection = { id: query.dataSourceId, name: 'Database', typeId: 'rdb', state: { value: 'enabled' } }
const command = { id: 'QueryList', inputs: [{ id: 'terms', type: 'array', elementType: { type: 'object' } }], output: { type: 'object', properties: [{ id: 'name', type: 'string' }] } }
const ok = result => ({ success: true, status: 200, result })
const provider = (enabled = true) => createCustomSourceProvider({ enabled: () => enabled, request: context => context.request, translate: key => key })
function client(overrides = {}) {
  const calls = []
  return {
    calls,
    async get(url, params) {
      calls.push({ method: 'get', url, params })
      if (url.startsWith('/datasource/config/')) return ok(overrides.connection || connection)
      if (url.endsWith('/commands')) return ok(overrides.commands || [command])
      return ok(overrides.query || query)
    },
    async post(url, body, config) {
      calls.push({ method: 'post', url, body, config })
      if (url === '/datasource/config/_query') return ok({ data: [overrides.connection || connection], total: 1 })
      if (url === '/datasource/_query/no-paging') return ok([overrides.query || query])
      return overrides.response || ok([{ name: 'first' }])
    },
  }
}
const id = sourceCapabilityId({ queryId: query.id, commandId: command.id })

test('flat function entries use command names and descriptions while preserving saved-query provenance', async () => {
  const saved = { ...query, description: 'Saved function description' }
  const commands = [
    { ...command, name: 'List', i18nName: '列表查询', description: 'Command description' },
    { ...command, id: 'Count', name: 'Count' },
    { ...command, id: 'QueryPager' },
  ]
  const result = await provider().dynamicSources.discover({ request: client({ query: saved, commands }) })
  assert.deepEqual(result.sources.map(source => source.name), ['列表查询', 'Count', 'QueryPager'])
  assert.equal(new Set(result.sources.map(source => source.id)).size, commands.length)
  assert.deepEqual(result.sources.map(source => source.description), ['Command description', saved.description, saved.description])
  assert.ok(result.sources.every(source => source.facets.connectionName === connection.name))
  assert.ok(result.sources.every(source => source.facets.queryName === saved.name))
  const restored = await provider().dynamicSources.resolve(id, { request: client({ query: saved, commands }) })
  assert.equal(restored.name, '列表查询')
  assert.equal(restored.description, 'Command description')
  assert.equal(restored.id, id)
  const fallback = await provider().dynamicSources.resolve(id, { request: client({ commands }) })
  assert.equal(fallback.description, 'Command description')
})

test('stable capability references round trip Unicode and path separators', () => {
  assert.deepEqual(parseSourceCapabilityId(id), { queryId: query.id, commandId: command.id })
  assert.match(id, /^datasource\.saved-query\.[0-9a-f]+$/)
})
test('invalid, foreign and oversized references are rejected', () => {
  for (const value of ['other.00', 'datasource.saved-query.f', 'datasource.saved-query.ff', 'datasource.saved-query.' + '00'.repeat(4097)]) {
    assert.equal(parseSourceCapabilityId(value), undefined)
  }
})
test('private deployment disablement prevents both discovery and restoration requests', async () => {
  const request = client(), p = provider(false)
  assert.deepEqual(await p.dynamicSources.discover({ request }), { sources: [] })
  assert.equal(await p.dynamicSources.resolve(id, { request }), undefined)
  assert.equal(request.calls.length, 0)
})
test('discovery preserves the caller identity and disables write or disabled-source definitions', async () => {
  const request = client({ connection: { ...connection, state: { value: 'disabled' } }, commands: [command, { id: 'Update', expands: { forAction: true } }] })
  const result = await provider().dynamicSources.discover({ request })
  assert.equal(result.sources.length, 2)
  assert.ok(result.sources.every(source => !source.availability().executable))
  assert.ok(request.calls.some(call => call.params?.support === query.support))
})
test('saved references recheck connection availability without relying on prior discovery', async () => {
  const request = client({ connection: { ...connection, state: { value: 'disabled' } } })
  const source = await provider().dynamicSources.resolve(id, { request })
  assert.equal(source.availability().executable, false)
  assert.ok(request.calls.some(call => call.url === '/datasource/config/database%2F1'))
})
test('restoration uses the active request identity and keeps definition snapshots isolated', async () => {
  const p = provider(), first = client(), second = client({ query: { ...query, name: 'Other user records' },
    commands: [{ ...command, name: 'Other user list' }] })
  const left = await p.dynamicSources.resolve(id, { request: first })
  const right = await p.dynamicSources.resolve(id, { request: second })
  assert.notEqual(left.name, right.name)
  assert.equal(left.name, 'QueryList')
  assert.equal(right.name, 'Other user list')
  assert.equal(left.facets.queryName, 'Records')
  assert.equal(right.facets.queryName, 'Other user records')
  assert.ok(first.calls.length > 0 && second.calls.length > 0)
})
test('unknown or removed commands never recover a different saved definition', async () => {
  const p = provider(), request = client({ commands: [{ id: 'Other' }] })
  assert.equal(await p.dynamicSources.resolve(id, { request }), undefined)
  assert.equal(await p.dynamicSources.resolve('unrelated.00', { request }), undefined)
})
test('query execution inherits runtime identity, cancellation and encodes only path segments', async () => {
  const metadata = client(), runtime = client(), controller = new AbortController()
  const source = await provider().dynamicSources.resolve(id, { request: metadata })
  const terms = { terms: [{ column: 'name', termType: 'in', value: ['first'] }] }
  const result = await firstValueFrom(source.create().query({ query: terms, signal: controller.signal }, { runtimeId: 'one', request: runtime }))
  assert.deepEqual(result.data, [{ name: 'first' }])
  assert.equal(runtime.calls[0].url, '/datasource/database%2F1/rows/QueryList/execute')
  assert.deepEqual(runtime.calls[0].body, terms)
  assert.equal(runtime.calls[0].config.signal, controller.signal)
  assert.equal(metadata.calls.filter(call => call.method === 'post').length, 0)
})
test('application-level execution errors remain failures', async () => {
  const request = client({ response: { success: false, status: 500, message: 'query failed', result: [] } })
  const source = await provider().dynamicSources.resolve(id, { request })
  await assert.rejects(firstValueFrom(source.create().query({}, { runtimeId: 'one', request })), /query failed/)
})
test('one unavailable command catalog produces diagnostics without losing healthy entries', async () => {
  const request = client(), originalGet = request.get
  request.post = async url => url === '/datasource/config/_query' ? ok({ data: [connection], total: 1 }) : ok([query, { ...query, id: 'second', support: 'broken' }])
  request.get = (url, params) => params?.support === 'broken' ? Promise.reject(new Error('missing')) : originalGet(url, params)
  const result = await provider().dynamicSources.discover({ request })
  assert.equal(result.sources.length, 1)
  assert.equal(result.diagnostics[0].code, 'datasource.metadata_unavailable')
})
test('catalog requests paginate connections and chunk saved queries by one hundred', async () => {
  const connections = Array.from({ length: 201 }, (_, i) => ({ ...connection, id: String(i) })), sizes = []
  const request = { post: async (url, body) => url.includes('/config/')
    ? ok({ data: connections.slice(body.pageIndex * 100, body.pageIndex * 100 + 100), total: connections.length })
    : (sizes.push(body.terms[0].value.length), ok([])) }
  assert.equal((await listConnections(request)).length, 201)
  await listSavedQueries(request, connections)
  assert.deepEqual(sizes, [100, 100, 1])
})
test('read contracts reject actions and subscriptions while allowing only known legacy queries', () => {
  assert.equal(isReadQuery(query, command), true)
  for (const candidate of [{ id: 'Update' }, { ...command, expands: { forAction: true } }, { ...command, expands: { forSubscribe: true } }, { ...command, expands: { unbounded: true } }]) assert.equal(isReadQuery(query, candidate), false)
  assert.equal(isReadQuery({ ...query, dataSourceTypeId: 'api', configuration: { expression: { method: 'POST' } } }, { id: 'request' }), false)
})
test('only explicitly declared root terms protocols enable a query editor', () => {
  const schema = inputSchema({ ...command, expands: { isTermsQuery: true, formComponent: { component: 'query', fields: [{ id: 'name', type: 'string' }] } } }, query)
  assert.equal(schema.queryEditor.fields.name.type, 'string')
  assert.deepEqual(schema.default, {})
  assert.equal(inputSchema(command, query).queryEditor, undefined)
  assert.equal(inputSchema({ ...command, expands: { isTermsQuery: true, formComponent: { component: 'query', key: 'params' } } }, query).queryEditor, undefined)
})
test('pager rows normalize and arbitrary API result/body fields stay untouched', () => {
  const pager = { id: 'QueryPager', output: { type: 'object', properties: [{ id: 'data', type: 'array', elementType: { type: 'object' } }] } }
  assert.deepEqual(normalizeCommandResult({ data: [{ name: 'first' }], total: 1 }, query, pager).data, [{ name: 'first' }])
  const apiBody = { result: { body: [1] }, body: [2] }
  assert.deepEqual(normalizeCommandResult(apiBody, { ...query, dataSourceTypeId: 'api' }, { id: 'GET', output: { type: 'object' } }).data, apiBody)
})
