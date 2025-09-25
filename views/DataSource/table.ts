import { typesData } from './components/table'

export const iconMaps = {
  api: 'icon-APIlianjiemingchengA',
  websocket: 'icon-Websocket',
  mysql: 'icon-MySQLlianjiemingcheng',
  mariadb: 'icon-MariaDB',
  postgresql: 'icon-a-PostgreSQL',
  oracle: 'icon-Oracle',
  sqlserver: 'icon-a-SQLServer',
  mongodb: 'icon-MongoDB',
  excel: 'icon-Excel',
  json: 'icon-Json',
  dm: 'icon-damengshujuku',
  redis: 'icon-REdis',
  es_api: 'icon-ES-API'
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
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    search: {
      type: 'string',
      componentProps: {
        placeholder: '请输入名称'
      }
    },
    scopedSlots: true
  },
  {
    title: '标识',
    dataIndex: 'id',
    key: 'id',
    search: {
      type: 'string',
      componentProps: {
        placeholder: '请输入标识'
      }
    },
    scopedSlots: true
  },
  {
    title: '类型',
    dataIndex: 'searchCode',
    key: 'searchCode',
    search: {
      type: 'select',
      componentProps: {
        placeholder: '请选择数据源类型'
      },
      options: getDataTypeOptions()
    },
    scopedSlots: true,
    ellipsis: true
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
    search: {
      type: 'string',
      componentProps: {
        placeholder: '请输入说明'
      }
    },
    scopedSlots: true
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    ellipsis: true,
    width: '180px',
    scopedSlots: true
  }
]
