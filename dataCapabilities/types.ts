export interface CommandSchema {
  id?: string
  name?: string
  i18nName?: string
  description?: string
  type?: string
  valueType?: CommandSchema
  properties?: CommandSchema[]
  elementType?: CommandSchema
  elements?: Array<{ value: unknown; text?: string; label?: string }>
  required?: boolean
  defaultValue?: unknown
  expands?: Record<string, unknown>
}
export interface SavedQuery {
  id: string
  dataSourceId: string
  dataSourceTypeId: string
  support: string
  name: string
  description?: string
  configuration?: {
    provider?: string
    expression?: { method?: string }
    defaultParams?: Record<string, unknown>
  }
}
export interface SourceConnection {
  id: string
  name: string
  typeId: string
  state?: { value: string }
}
export interface SourceCommand {
  id: string
  name?: string
  i18nName?: string
  description?: string
  inputs?: CommandSchema[]
  output?: CommandSchema
  expands?: {
    isTermsQuery?: boolean
    formComponent?: { component?: string; fields?: CommandSchema[]; key?: string; property?: string }
    forQuery?: boolean
    forAction?: boolean
    responseFlux?: boolean
    unbounded?: boolean
    forSubscribe?: boolean
    defaultParams?: Record<string, unknown>
  }
}
export interface SavedQueryReference { queryId: string; commandId: string }
