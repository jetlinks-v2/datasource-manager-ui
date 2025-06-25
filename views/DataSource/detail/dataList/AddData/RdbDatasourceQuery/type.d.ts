export type Key = string | number

export interface ColumnSchema {
  name: string
  type: string
  [key: string]: any
}

export interface TableSchema {
  name: string
  columns: Array<any>
}
