type ConnectionMode = 'basic' | 'url'

// 定义组件接口
export interface BaseFormData {
  name: string
  id: string
  group: string | undefined
  description: string
}
export interface RelationData {
  connectionMode: ConnectionMode
  host: string
  port: string
  schema: string
  username: string
  password: string
  serviceName: string
  jdbcHeaders: string
  jdbcUrl: string
  url: string
  dataBase: string
  [key: string]: string | ConnectionMode
}

export interface UniversalData {
  api: string
  protocol: string
  authType: string
  username: string
  password: string
  token: string
  OAuth2: {
    mode: string
    token: string
    request: string
    clientId: string
    clientSecret: string
    scope: string
    headers: any
    params: any
  }
}

export interface WebSocketData {
  handshakeTimeout: number
  reconnectionAttempts: number
  // sslIgnore: boolean
  maxMessageSize: number
  reconnectionIntervals: number
  payloadType: 'STRING' | 'JSON' | 'BINARY'
}

export interface ElasticsearchData {
  uri: string
  pathPrefix: string
  username: string
  password: string
}
