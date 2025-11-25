export type Key = string | number

export interface EsField {
  id: string
  name: string
  valueType: {
    type: string
    name: string
    [key: string]: any
  }
  [key: string]: any
}
