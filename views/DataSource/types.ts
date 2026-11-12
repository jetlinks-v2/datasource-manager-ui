import type { typesData } from './components/table'

export interface DataSourceCategory {
  id: string
  name: string
}

export interface DataSourceCategoryState {
  items: DataSourceCategory[]
  selected: Partial<DataSourceCategory>
  keyword: string
  loading: boolean
  error: boolean
  editor: { open: boolean; id?: string; name: string; saving: boolean }
}

export interface DataSourceRecord {
  id: string
  name: string
  typeId: string
  searchCode: string
  description?: string
  group?: string
  [key: string]: unknown
}

export type DataSourceTypeSelection = Partial<(typeof typesData)[number]> & {
  group?: Partial<DataSourceCategory>
}

export interface DataSourcePage {
  data: DataSourceRecord[]
  total: number
  pageIndex: number
  pageSize: number
}
