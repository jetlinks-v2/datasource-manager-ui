import type { CapabilityContext, DataCapabilityRequest } from '@jetlinks-web-core/data-capability'
import type { SavedQuery, SourceCommand, SourceConnection } from './types'

export type SourceRequestResolver = (context: CapabilityContext) => DataCapabilityRequest
export const pathSegment = (value: string) => encodeURIComponent(value)
export function responseResult<T>(response: { success?: boolean; status?: number; result: T; message?: string }): T {
  if (response.success === false || (response.status !== undefined && response.status >= 400)) {
    throw new Error(response.message || 'Datasource request failed')
  }
  return response.result
}

/** Fetch complete catalogs in bounded pages. Query definitions are never saved in a shared cache. */
export async function listConnections(request: DataCapabilityRequest): Promise<SourceConnection[]> {
  const result: SourceConnection[] = []
  for (let pageIndex = 0; ; pageIndex++) {
    const page = responseResult(await request.post<{ data: SourceConnection[]; total: number }>('/datasource/config/_query', {
      pageIndex, pageSize: 100, sorts: [{ name: 'id', order: 'asc' }],
    }))
    result.push(...page.data)
    if (!page.data.length || result.length >= page.total) return result
  }
}
export async function listSavedQueries(request: DataCapabilityRequest, connections: SourceConnection[]): Promise<SavedQuery[]> {
  const queries: SavedQuery[] = []
  for (let index = 0; index < connections.length; index += 100) {
    const result = responseResult(await request.post<SavedQuery[]>('/datasource/_query/no-paging', {
      terms: [{ column: 'dataSourceId', termType: 'in', value: connections.slice(index, index + 100).map(item => item.id) }],
    }))
    queries.push(...result)
  }
  return queries
}
export async function readSavedQuery(request: DataCapabilityRequest, id: string): Promise<SavedQuery> {
  return responseResult(await request.get<SavedQuery>(`/datasource/${pathSegment(id)}`))
}
/** Restore saved bindings against the current connection state under the caller's identity. */
export async function readConnection(request: DataCapabilityRequest, id: string): Promise<SourceConnection> {
  return responseResult(await request.get<SourceConnection>(`/datasource/config/${pathSegment(id)}`))
}
export async function readCommands(request: DataCapabilityRequest, query: SavedQuery): Promise<SourceCommand[]> {
  return responseResult(await request.get<SourceCommand[]>(`/datasource/${pathSegment(query.dataSourceId)}/commands`, { support: query.support }))
}
