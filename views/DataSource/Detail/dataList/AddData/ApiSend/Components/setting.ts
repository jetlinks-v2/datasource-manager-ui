import type { TableColumnType } from 'ant-design-vue'

export interface ParamItem {
  key: string
  value: string
  enable: boolean
  description?: string
}

export const DEFAULT_PARAM_ITEM: ParamItem = {
  key: '',
  value: '',
  enable: false
}

// 请求参数表格列
export const paramColumns: TableColumnType<ParamItem>[] = [
  {
    title: '启用',
    key: 'enable',
    dataIndex: 'enable',
    width: '60px',
    align: 'center'
  },
  {
    title: '键名',
    key: 'key',
    dataIndex: 'key'
  },
  {
    title: '值',
    key: 'value',
    dataIndex: 'value'
  },
  {
    title: '说明',
    key: 'description',
    dataIndex: 'description'
  },
  {
    title: '操作',
    key: 'operate',
    dataIndex: 'operate',
    width: '60px',
    align: 'center'
  }
]
