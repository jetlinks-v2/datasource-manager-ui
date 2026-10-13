import { defer } from 'rxjs'
import type { CapabilityDirectoryDiagnostic, CapabilityContext, DataCapabilityProvider, DataSourceDefinition, DataSourceRequest, RuntimeContext } from '@jetlinks-web-core/data-capability'
import { commandOutputSchema, inputSchema, isReadQuery, normalizeCommandResult } from './schema'
import { CUSTOM_SOURCE_NAMESPACE, parseSourceCapabilityId, sourceCapabilityId } from './reference'
import { listConnections, listSavedQueries, pathSegment, readCommands, readConnection, readSavedQuery, responseResult, type SourceRequestResolver } from './service'
import type { SavedQuery, SourceCommand, SourceConnection } from './types'

const owner = { moduleId: 'datasource-manager-ui', providerId: 'datasource:saved-queries' }
export interface CustomSourceProviderOptions {
  request: SourceRequestResolver
  enabled: () => boolean
  translate: (key: string) => string
}

export function createCustomSourceProvider(options: CustomSourceProviderOptions): DataCapabilityProvider {
  const definition = (query: SavedQuery, command: SourceCommand, connection?: SourceConnection): DataSourceDefinition => {
    const readonly = isReadQuery(query, command)
    const enabled = !!connection && connection.state?.value !== 'disabled'
    const available = options.enabled() && readonly && enabled
    return {
      id: sourceCapabilityId({ queryId: query.id, commandId: command.id }), kind: 'data-source', version: 1,
      name: `${query.name} · ${command.i18nName || command.name || command.id}`,
      description: query.description || command.description,
      owner, tags: ['custom-datasource'], facets: { category: 'custom-datasource', mappingPolicy: 'manual', connectionName: connection?.name },
      modes: ['snapshot', 'poll'], querySchema: inputSchema(command, query), outputSchema: commandOutputSchema(query, command),
      availability: () => ({ discoverable: true, configurable: available, executable: available,
        reason: available ? undefined : options.translate(enabled ? 'DataSource.binding.readOnlyRequired' : 'DataSource.binding.disabled') }),
      create: () => ({
        query<T>(request: DataSourceRequest, context: RuntimeContext) {
          return defer(async () => {
            const client = options.request(context)
            const result = responseResult(await client.post(
              `/datasource/${pathSegment(query.dataSourceId)}/${pathSegment(query.support)}/${pathSegment(command.id)}/execute`,
              request.query || {}, { signal: request.signal || context.signal },
            ))
            return normalizeCommandResult<T>(result, query, command)
          })
        },
      }),
    }
  }
  return {
    id: owner.providerId, owner, capabilityIds: [],
    dynamicSources: {
      namespace: CUSTOM_SOURCE_NAMESPACE,
      async discover(context: CapabilityContext) {
        if (!options.enabled()) return { sources: [] }
        const request = options.request(context)
        const connections = await listConnections(request)
        const queries = await listSavedQueries(request, connections)
        const sources: DataSourceDefinition[] = []
        const diagnostics: CapabilityDirectoryDiagnostic[] = []
        // Bounded concurrency avoids one request burst per connection on large deployments.
        for (let index = 0; index < queries.length; index += 8) {
          const batch = await Promise.allSettled(queries.slice(index, index + 8).map(async query => {
            const connection = connections.find(item => item.id === query.dataSourceId)
            const commands = await readCommands(request, query)
            return commands.map(command => definition(query, command, connection))
          }))
          for (const result of batch) {
            if (result.status === 'fulfilled') sources.push(...result.value)
            else diagnostics.push({ code: 'datasource.metadata_unavailable', capabilityIds: [], retryable: true,
              message: options.translate('DataSource.binding.partialCatalog') })
          }
        }
        return { sources, diagnostics }
      },
      async resolve(id, context) {
        if (!options.enabled()) return undefined
        const reference = parseSourceCapabilityId(id)
        if (!reference) return undefined
        const request = options.request(context)
        const query = await readSavedQuery(request, reference.queryId)
        if (!query || query.id !== reference.queryId) return undefined
        const [commands, connection] = await Promise.all([
          readCommands(request, query), readConnection(request, query.dataSourceId),
        ])
        if (!connection || connection.id !== query.dataSourceId) return undefined
        const command = commands.find(item => item.id === reference.commandId)
        return command ? definition(query, command, connection) : undefined
      },
    },
  }
}
