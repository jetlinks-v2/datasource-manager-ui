import type { CapabilitySchema, DataSourceResult } from '@jetlinks-web-core/data-capability'
import type { CommandSchema, SavedQuery, SourceCommand } from './types'

export function metadataSchema(metadata?: CommandSchema): CapabilitySchema | undefined {
  if (!metadata) return undefined
  const value = metadata.valueType || metadata
  const type = value.type
  const schemaType: CapabilitySchema['type'] | undefined = type === 'array' || type === 'object' || type === 'boolean'
    ? type : ['int', 'long', 'integer'].includes(type || '') ? 'integer'
      : ['float', 'double', 'number', 'decimal'].includes(type || '') ? 'number'
        : type === 'null' ? 'null' : type === 'date' ? 'number'
          : ['string', 'enum', 'password', 'text'].includes(type || '') ? 'string' : undefined
  if (!schemaType) return undefined
  const schema: CapabilitySchema = {
    type: schemaType, title: metadata.i18nName || metadata.name, description: metadata.description,
  }
  if (metadata.defaultValue !== undefined) schema.default = metadata.defaultValue
  if (type === 'date') schema.format = 'date-time'
  if (type === 'password') schema.sensitive = true
  if (value.elements?.length) schema.enum = value.elements.map(item => item.value)
  if (schemaType === 'array') schema.items = metadataSchema(value.elementType)
  if (schemaType === 'object') {
    schema.properties = Object.fromEntries((value.properties || []).flatMap(item => {
      const property = metadataSchema(item)
      return item.id && property ? [[item.id, property]] : []
    }))
    schema.required = (value.properties || []).filter(item => item.required || item.expands?.required === true)
      .map(item => item.id).filter((id): id is string => !!id)
  }
  return schema
}

export function inputSchema(command: SourceCommand, query: SavedQuery): CapabilitySchema {
  const schema = metadataSchema({ type: 'object', properties: command.inputs || [] })!
  const defaults = { ...query.configuration?.defaultParams, ...command.expands?.defaultParams }
  for (const [key, value] of Object.entries(defaults)) {
    if (schema.properties?.[key]) schema.properties[key].default = value
  }
  const form = command.expands?.formComponent
  // Only the declared root query protocol may opt in; API parameters named terms/filter are ordinary inputs.
  if (command.expands?.isTermsQuery && form?.component === 'query' && !form.key && !form.property
    && schema.properties?.terms?.type === 'array') {
    const fields = metadataSchema({ type: 'object', properties: form.fields || [] })?.properties || {}
    schema.queryEditor = {
      type: 'jetlinks-terms', fields, termsKey: 'terms',
      ...(schema.properties.filter?.type === 'object' ? { simpleKey: 'filter' } : {}),
      ...(schema.properties.sorts?.type === 'array' ? { sortsKey: 'sorts' } : {}),
    }
  }
  // A datasource's missing optional container is not an empty query supplied by the user.
  // Root defaults stop generic form initialization from inventing filter={}, terms=[] or sorts=[].
  const declaredDefaults = (field: CapabilitySchema): unknown => {
    if (field.default !== undefined) return field.default
    if (field.const !== undefined) return field.const
    if (field.type !== 'object') return undefined
    const entries = Object.entries(field.properties || {}).map(([key, child]) => [key, declaredDefaults(child)] as const)
      .filter(([, value]) => value !== undefined)
    return entries.length ? Object.fromEntries(entries) : undefined
  }
  schema.default = declaredDefaults(schema) || {}
  return schema
}

const relationalTypes = new Set(['rdb', 'mysql', 'pgsql', 'sqlserver', 'dm', 'mariadb', 'oracle', 'elasticsearch', 'es'])
export function isReadQuery(query: SavedQuery, command: SourceCommand): boolean {
  if (command.expands?.forAction || command.expands?.unbounded || command.expands?.forSubscribe) return false
  if (command.expands?.forQuery === false) return false
  if (command.expands?.forQuery === true) return true
  // Legacy datasource commands do not expose forQuery. Only known read contracts may poll automatically.
  if (relationalTypes.has(query.dataSourceTypeId)) return ['QueryList', 'QueryPager', 'Count'].includes(command.id)
  if (query.dataSourceTypeId === 'api') return ['GET', 'HEAD'].includes(query.configuration?.expression?.method || '')
  return false
}

export function commandOutputSchema(query: SavedQuery, command: SourceCommand): CapabilitySchema | undefined {
  const schema = metadataSchema(command.output)
  if (command.id === 'QueryPager' && schema?.properties?.data?.type === 'array') return schema.properties.data
  const rowStream = command.expands?.responseFlux
    || (relationalTypes.has(query.dataSourceTypeId) && command.id === 'QueryList')
  return rowStream && schema && schema.type !== 'array' ? { type: 'array', items: schema } : schema
}

export function normalizeCommandResult<T>(value: unknown, query: SavedQuery, command: SourceCommand): DataSourceResult<T> {
  const schema = commandOutputSchema(query, command)
  // Saved API support commands already return their response body. Never unwrap arbitrary body/result keys.
  if (command.id === 'QueryPager' && schema?.type === 'array'
    && value && typeof value === 'object' && 'data' in value) {
    const page = value as { data: unknown; total?: number; pageIndex?: number; pageSize?: number }
    if (!Array.isArray(page.data)) throw new Error('Invalid datasource page result')
    return { data: page.data as T, total: page.total, pageIndex: page.pageIndex, pageSize: page.pageSize, outputSchema: schema }
  }
  return { data: value as T, outputSchema: schema }
}
