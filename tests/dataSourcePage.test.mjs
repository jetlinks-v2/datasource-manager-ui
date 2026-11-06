import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import test from 'node:test'
import { buildSync, transformSync } from 'esbuild'
import * as Vue from 'vue'

const require = createRequire(import.meta.url)
const root = resolve(import.meta.dirname, '../views/DataSource')
const ok = result => ({ success: true, status: 200, result })
// 单独装载真实树过滤函数，避免 Node 测试加载工具包入口中的浏览器加密依赖。
const treeUtility = { exports: {} }
const treeUtilityCode = buildSync({
  stdin: { contents: "export { filterTreeNodes } from '@jetlinks-web/utils/src/util.ts'", resolveDir: import.meta.dirname },
  bundle: true, format: 'cjs', platform: 'node', external: ['ant-design-vue'], write: false, logLevel: 'silent',
}).outputFiles[0].text
new Function('require', 'module', 'exports', 'localStorage', treeUtilityCode)(
  id => id === 'ant-design-vue' ? {} : require(id), treeUtility, treeUtility.exports, { getItem: () => null },
)
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function session(file, api = {}) {
  const lifecycle = { mounted: [], unmounted: [] }
  const provided = new Map()
  const calls = { messages: [], navigation: [], confirmations: [], reload: 0, cleared: 0 }
  const translate = key => key === 'DataSource.index.100001-12' ? '全部' : key
  const imports = {
    vue: { ...Vue, onMounted: fn => lifecycle.mounted.push(fn), onBeforeUnmount: fn => lifecycle.unmounted.push(fn), provide: (key, value) => provided.set(key, value) },
    'vue-i18n': { useI18n: () => ({ t: translate }) },
    'ant-design-vue': { Modal: { confirm: options => calls.confirmations.push(options) } },
    '@jetlinks-web/utils': { filterTreeNodes: treeUtility.exports.filterTreeNodes, onlyMessage: (...args) => calls.messages.push(args) },
    '@jetlinks-web-core/store': { useMenuStore: () => ({ jumpPage: (...args) => calls.navigation.push(args) }) },
    '@datasource-manager-ui/api/data': api,
    '@datasource-manager-ui/api/data/datasource': api,
    '@datasource-manager-ui/utils/const': { DEFAULT_CATEGORY_ID: '@@default' },
    '@datasource-manager-ui/utils/utils': { spaceValidator: async (_, value) => { if (/^\s|\s$/.test(value)) throw new Error('whitespace') } },
    '../components/table': { typesData: [{ value: 'api', formType: 'api', name: 'API' }] },
    '../sourceDetail': { useSourceDetailStore: () => ({ clearCache: () => ++calls.cleared }) },
  }
  const module = { exports: {} }
  const code = transformSync(readFileSync(resolve(root, 'composables', file), 'utf8'), { loader: 'ts', format: 'cjs' }).code
  new Function('require', 'module', 'exports', code)(id => imports[id] || require(id), module, module.exports)
  const scope = Vue.effectScope()
  return {
    ...module.exports, calls, provided, lifecycle,
    run: fn => scope.run(fn),
    stop() { lifecycle.unmounted.forEach(fn => fn()); scope.stop() },
  }
}

test('分类刷新只采用最新响应，过期响应不能覆盖分类缓存', async () => {
  const requests = []
  const s = session('useDataSourceCategories.ts', { getDataSourceGroup: query => { const d = deferred(); requests.push({ ...d, query }); return d.promise } })
  const page = s.run(() => s.useDataSourceCategories())
  const first = page.loadCategories()
  requests[0].resolve(ok([{ id: 'a', name: '业务库' }, { id: 'b', name: '归档库' }]))
  await first
  assert.equal(page.state.selected.id, '@@default')
  assert.deepEqual(page.treeData.value[0].children.map(item => item.key), ['a', 'b'])
  const slow = page.loadCategories()
  const fast = page.loadCategories()
  requests[2].resolve(ok([{ id: 'b', name: '归档库' }]))
  await fast
  requests[1].resolve(ok([{ id: 'a', name: '业务库' }]))
  await slow
  assert.equal(page.state.selected.id, '@@default')
  assert.deepEqual(s.provided.get('CATEGORY_LIST').value.map(item => item.id), ['@@default', 'b'])
  assert.deepEqual(requests[2].query.terms, [])
  s.stop()
})

test('简单搜索只过滤分类树，保留路径、完整缓存和选中项，清空恢复全部', async () => {
  const requests = []
  const s = session('useDataSourceCategories.ts', {
    getDataSourceGroup: async query => { requests.push(query); return ok([{ id: 'a', name: '业务库' }, { id: 'b', name: '归档库' }]) },
  })
  const page = s.run(() => s.useDataSourceCategories())
  await page.loadCategories()
  page.selectCategory({ id: 'a', name: '业务库' })
  page.searchCategories(' 归档 ')
  assert.equal(page.treeData.value[0].id, '@@default')
  assert.deepEqual(page.treeData.value[0].children.map(item => item.id), ['b'])
  assert.equal(page.state.selected.id, 'a')
  assert.equal(page.state.items.length, 3)
  assert.equal(s.provided.get('CATEGORY_LIST').value.length, 3)
  page.searchCategories('不存在')
  assert.deepEqual(page.treeData.value, [])
  page.searchCategories('')
  assert.deepEqual(page.treeData.value[0].children.map(item => item.id), ['a', 'b'])
  assert.equal(page.state.selected.id, 'a')
  assert.equal(requests.length, 1)
  page.searchCategories('业务')
  await page.refreshCategories()
  assert.equal(requests.length, 2)
  assert.equal(page.state.keyword, '')
  assert.equal(page.state.selected.id, '@@default')
  s.stop()
})

test('新增分类检查全部分类重名，编辑允许原名，全部项禁止编辑和删除', async () => {
  const s = session('useDataSourceCategories.ts', { getDataSourceGroup: async () => ok([{ id: 'a', name: '业务库' }]) })
  const page = s.run(() => s.useDataSourceCategories())
  await page.loadCategories()
  page.openEditor()
  const validate = name => page.nameRules.value.at(-1).validator({}, name)
  await assert.rejects(validate('业务库'))
  await assert.rejects(validate('全部'))
  page.openEditor({ id: 'a', name: '业务库' })
  await validate('业务库')
  page.closeEditor()
  page.openEditor({ id: '@@default', name: '全部' })
  page.removeCategory('@@default')
  assert.equal(page.state.editor.open, false)
  assert.equal(s.calls.confirmations.length, 0)
  s.stop()
})

test('分类保存失败保留输入，重试成功后关闭并刷新；加载失败可重试', async () => {
  let fail = true
  const saved = []
  const s = session('useDataSourceCategories.ts', {
    getDataSourceGroup: async () => { if (fail) throw new Error('offline'); return ok([]) },
    addDataSourceGroup: async body => { saved.push(body); if (fail) throw new Error('offline'); return ok(body) },
  })
  const page = s.run(() => s.useDataSourceCategories())
  await page.loadCategories()
  assert.equal(page.state.error, true)
  page.openEditor()
  page.state.editor.name = '新分类'
  await page.saveCategory()
  assert.equal(page.state.editor.open, true)
  assert.equal(page.state.editor.name, '新分类')
  assert.equal(page.state.editor.saving, false)
  fail = false
  await page.saveCategory()
  assert.equal(page.state.editor.open, false)
  assert.equal(page.state.error, false)
  assert.deepEqual(saved, [{ name: '新分类' }, { name: '新分类' }])
  s.stop()
})

test('分类删除继续使用原接口，确认文案与当前分类数据数对应', async () => {
  const removed = []
  const s = session('useDataSourceCategories.ts', { deleteDataSourceGroup: async id => { removed.push(id); return ok({}) }, getDataSourceGroup: async () => ok([]) })
  const page = s.run(() => s.useDataSourceCategories())
  page.listLength.value = 3
  page.removeCategory('a')
  assert.equal(s.calls.confirmations[0].content, 'DataSource.index.100001-9')
  assert.deepEqual(removed, [])
  await s.calls.confirmations[0].onOk()
  assert.deepEqual(removed, ['a'])
  s.stop()
})

test('列表组合条件与分类范围保持原协议，分页只使用表格入参', async () => {
  const requests = []
  const s = session('useDataSourceList.ts', { getDataSourceList: async query => { requests.push(query); return ok({ data: [{ id: '1' }], total: 25, pageIndex: query.pageIndex, pageSize: query.pageSize }) } })
  const category = Vue.ref({ id: 'a', name: '业务库' })
  const counts = []
  const page = s.run(() => s.useDataSourceList(category, count => counts.push(count)))
  const terms = [{ column: 'name', termType: 'like', value: '%订单%' }, { column: 'searchCode', termType: 'eq', value: 'mysql', type: 'or' }]
  page.onSearch({ terms: [{ terms }] })
  await page.handleSearch({ pageIndex: 1, pageSize: 24 })
  assert.deepEqual(requests[0], { sorts: [{ name: 'createTime', order: 'desc' }], terms: [{ terms }, { column: 'group', termType: 'eq', value: 'a' }], pageIndex: 1, pageSize: 24 })
  assert.deepEqual(counts, [1])
  category.value = { id: '@@default', name: '全部' }
  await Vue.nextTick()
  assert.deepEqual(page.queryParams.value.terms, [])
  assert.deepEqual(page.filterModel.value, [])
  page.onSearch({ terms: [{ terms: [] }] })
  assert.deepEqual(page.searchTerms.value, [])
  s.stop()
})

test('未选分类返回空分页；列表请求失败退出加载并允许重试', async () => {
  let fail = true
  const counts = []
  const s = session('useDataSourceList.ts', { getDataSourceList: async () => { if (fail) throw new Error('offline'); return ok({ data: [], total: 0, pageIndex: 0, pageSize: 12 }) } })
  const category = Vue.ref({})
  const page = s.run(() => s.useDataSourceList(category, count => counts.push(count)))
  assert.equal((await page.handleSearch({})).result.total, 0)
  category.value = { id: 'a', name: '业务库' }
  await Vue.nextTick()
  await assert.rejects(page.handleSearch({}), /offline/)
  assert.equal(page.loadError.value, true)
  fail = false
  await page.handleSearch({})
  assert.equal(page.loadError.value, false)
  s.stop()
})

test('行操作权限和详情路由不变，删除先禁用再删除并刷新', async () => {
  const commands = []
  const s = session('useDataSourceList.ts', {
    disableDataSource: async id => { commands.push(['disable', id]); return ok({}) },
    deleteDataSource: async id => { commands.push(['delete', id]); return ok({}) },
  })
  const category = Vue.ref({ id: 'a', name: '业务库' })
  const page = s.run(() => s.useDataSourceList(category, () => {}))
  page.tableRef.value = { reload: () => ++s.calls.reload }
  // 模拟表格对查询参数的监听，避免手动刷新与参数变化各触发一次请求。
  s.run(() => Vue.watch(page.queryParams, () => ++s.calls.reload))
  const row = { id: 'db', name: '订单库', typeId: 'rdb', searchCode: 'mysql' }
  const actions = page.getActions(row)
  assert.deepEqual(actions.map(action => action.permission), ['update', 'update', 'delete'])
  actions[0].onClick()
  assert.equal(page.editData.value.id, row.id)
  assert.equal(page.showSourceAdd.value, true)
  actions[1].onClick()
  assert.deepEqual(s.calls.navigation, [['system/DataSource/Detail', { params: { id: 'db' }, query: { typeId: 'rdb' } }]])
  await actions[2].popConfirm.onConfirm()
  await Vue.nextTick()
  assert.deepEqual(commands, [['disable', 'db'], ['delete', 'db']])
  assert.equal(s.calls.reload, 1)
  const filter = { column: 'name', termType: 'like', value: '%订单%' }
  page.filterModel.value = [filter]
  page.onSearch({ terms: [{ terms: [filter] }] })
  await Vue.nextTick()
  s.calls.reload = 0
  await actions[2].popConfirm.onConfirm()
  await Vue.nextTick()
  assert.deepEqual(page.filterModel.value, [])
  assert.deepEqual(page.searchTerms.value, [])
  assert.equal(s.calls.reload, 1)
  s.stop()
})

test('新增、返回类型选择、取消与缓存释放保持原流程', async () => {
  const s = session('useDataSourceList.ts')
  const category = Vue.ref({ id: 'a', name: '业务库' })
  const page = s.run(() => s.useDataSourceList(category, () => {}))
  page.handleAdd()
  assert.equal(page.showTypeAdd.value, true)
  assert.equal(page.activeKey.value.group.id, 'a')
  const selected = { value: 'mysql', group: category.value }
  page.handleClickNext(selected)
  assert.equal(page.showSourceAdd.value, true)
  page.handleShowTypeAdd(selected)
  assert.equal(page.showSourceAdd.value, false)
  assert.equal(page.showTypeAdd.value, true)
  page.handleClickNext()
  assert.equal(page.showTypeAdd.value, false)
  page.handleClose()
  assert.deepEqual(page.editData.value, {})
  assert.equal(s.provided.get('CLICK_ITEM'), category)
  s.stop()
  assert.equal(s.calls.cleared, 1)
})
