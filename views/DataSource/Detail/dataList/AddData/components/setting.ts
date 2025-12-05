import type { TableColumnType } from 'ant-design-vue'
import i18n from '@jetlinks-web-core/locales'

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
    title: i18n.global.t('DataSource.Setting.100081-0'),
    key: 'enable',
    dataIndex: 'enable',
    width: '80px',
    align: 'center'
  },
  {
    title: i18n.global.t('DataSource.Setting.100081-1'),
    key: 'key',
    dataIndex: 'key'
  },
  {
    title: i18n.global.t('DataSource.Setting.100081-2'),
    key: 'value',
    dataIndex: 'value'
  },
  {
    title: i18n.global.t('DataSource.Setting.100081-3'),
    key: 'description',
    dataIndex: 'description'
  },
  {
    title: i18n.global.t('DataSource.Setting.100081-4'),
    key: 'operate',
    dataIndex: 'operate',
    width: '80px',
    align: 'center'
  }
]
