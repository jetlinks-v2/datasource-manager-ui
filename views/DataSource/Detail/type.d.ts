type ConnectionMode = 'basic' | 'url'
type TypeId = 'rdb' | 'api' | 'websocket'
export interface SourceDataInfo {
  id: string
  name: string
  description: string
  type: string
  createTime: string
  updateTime: string
  typeId: TypeId
  group: {
    text: string
    value: string
  }
  shareConfig: {
    type: string
    password: string
    username: string
    url: string
    schema: string
    other: {
      connectionMode: ConnectionMode
    }
  }
  searchCode: string
}
