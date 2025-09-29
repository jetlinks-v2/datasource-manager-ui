export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type WebSocketProtocol = 'ws://' | 'wss://'
export type PayloadType = 'STRING' | 'JSON' | 'BINARY'
export type ParamType = 'fixed' | 'dynamic'

interface ParamsSpec {
  id: string
  name: string
  dataType: {
    maxLength?: number
    type: string
  }
  paramType: ParamType
  defaultValue?: any
  required?: boolean
  enable?: boolean
  sort?: number
  isSpecialRow?: boolean
}

interface FormData {
  id?: string
  dataSourceId: string
  support: string
  name: string
  dataSourceTypeId: string
  description: string
  configuration: {
    commandId: string
    commandName: string
    output: any
    input: any[]
    expression: {
      uri: { url: string }
      method?: string
      body?: { contentType: string; content: string }
      queryParams: any[]
      headers: any[]
      message?: any
    }
    rdbDefinition?: any
    provider?: string
  }
}
