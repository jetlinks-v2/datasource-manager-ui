export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type WebSocketProtocol = 'ws://' | 'wss://'
export type ParamType = 'fixed' | 'dynamic'

export interface ParamsSpec {
  id: string
  name: string
  dataType: {
    maxLength?: number
    type: string
  }
  paramType: ParamType
  defaultValue?: unknown
  required?: boolean
  enable?: boolean
  sort?: number
  isSpecialRow?: boolean
}

export interface QueryParam {
  key: string | { value: string }
  value: string | { value: string }
  enable?: boolean
}

export interface Header {
  key: string | { value: string }
  value: string | { value: string }
  enable?: boolean
}

export interface ExpressionConfig {
  uri: { url: string }
  method?: ApiMethod
  body?: { contentType: string; content: string }
  queryParams: QueryParam[]
  headers: Header[]
  message?: Record<string, unknown>
}

export interface OutputConfig {
  name: string
  id: string
  type: 'array' | 'object'
  elementType?: {
    type: string
    properties: unknown[]
  }
  properties?: unknown[]
}

export interface InputConfig {
  id: string
  name: string
  dataType: {
    type: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface FormData {
  id?: string
  dataSourceId: string
  support: string
  name: string
  dataSourceTypeId: string
  description: string
  configuration: {
    commandId?: string
    commandName?: string
    output?: OutputConfig | unknown
    input?: InputConfig[] | unknown[]
    param?: Record<string, unknown>
    expression?: ExpressionConfig
    rdbDefinition?: Record<string, unknown>
    elasticsearchConfig?: Record<string, unknown>
    pattern?: string
    provider?: string
    description?: string
    [key: string]: unknown
  }
}
