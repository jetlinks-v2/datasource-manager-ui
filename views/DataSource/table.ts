import { typesData } from './components/table'
import i18n from '@/locales'

export const iconMaps = {
  api: 'icon-APIlianjiemingchengA',
  websocket: 'icon-Websocket',
  mysql: 'icon-MySQLlianjiemingcheng',
  mariadb: 'icon-MariaDB',
  postgresql: 'icon-a-PostgreSQL',
  oracle: 'icon-Oracle',
  sqlserver: 'icon-a-SQLServer',
  mongodb: 'icon-MongoDB',
  file: 'icon-Source-File',
  json: 'icon-Json',
  dm: 'icon-damengshujuku',
  redis: 'icon-REdis',
  elasticsearch: 'icon-ES-API'
} as Record<string, string>

const getDataTypeOptions = () => {
  return (
    typesData
      .flatMap((data: any) => data.types)
      // 先过滤掉禁用的类型
      .filter((type: any) => !type.disable)
      // 然后映射剩余的类型到新的对象
      .map((type: any) => ({
        label: type.name,
        value: type.value
      }))
  )
}

export const dataSourceColumns: Array<any> = [
  {
    title: i18n.global.t('DataSource.table.100003-0'),
    dataIndex: 'name',
    key: 'name',
    search: {
      type: 'string',
      componentProps: {
        placeholder: i18n.global.t('DataSource.table.100003-1')
      }
    },
    scopedSlots: true
  },
  {
    title: i18n.global.t('DataSource.table.100003-2'),
    dataIndex: 'id',
    key: 'id',
    search: {
      type: 'string',
      componentProps: {
        placeholder: i18n.global.t('DataSource.table.100003-3')
      }
    },
    scopedSlots: true
  },
  {
    title: i18n.global.t('DataSource.table.100003-4'),
    dataIndex: 'searchCode',
    key: 'searchCode',
    search: {
      type: 'select',
      componentProps: {
        placeholder: i18n.global.t('DataSource.table.100003-5')
      },
      options: getDataTypeOptions()
    },
    scopedSlots: true,
    ellipsis: true
  },
  {
    title: i18n.global.t('DataSource.table.100003-6'),
    dataIndex: 'description',
    key: 'description',
    search: {
      type: 'string',
      componentProps: {
        placeholder: i18n.global.t('DataSource.table.100003-7')
      }
    },
    scopedSlots: true
  },
  {
    title: i18n.global.t('DataSource.table.100003-8'),
    dataIndex: 'action',
    key: 'action',
    ellipsis: true,
    width: '180px',
    scopedSlots: true
  }
]
