import type { TableColumnType } from 'ant-design-vue'
import i18n from '@/locales'

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
export const getParamColumns = (): TableColumnType<ParamItem>[] => [
  {
    title: i18n.global.t('DataSource.OtherConfig.100033-6'),
    key: 'enable',
    dataIndex: 'enable',
    width: '60px',
    align: 'center'
  },
  {
    title: i18n.global.t('DataSource.Response.100023-3'),
    key: 'key',
    dataIndex: 'key'
  },
  {
    title: i18n.global.t('DataSource.Response.100023-4'),
    key: 'value',
    dataIndex: 'value'
  },
  {
    title: i18n.global.t('DataSource.table.100003-6'),
    key: 'description',
    dataIndex: 'description'
  },
  {
    title: i18n.global.t('DataSource.table.100003-8'),
    key: 'operate',
    dataIndex: 'operate',
    width: '60px',
    align: 'center'
  }
]

// 保持向后兼容
export const paramColumns = getParamColumns()
