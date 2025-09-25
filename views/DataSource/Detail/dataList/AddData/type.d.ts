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
