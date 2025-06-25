type ConnectionMode = 'basic' | 'url'
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
