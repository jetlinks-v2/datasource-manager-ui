import IFloat from './DataType/Float.vue'
import IEnum from './DataType/Enum.vue'
import IBoolean from './DataType/Boolean.vue'
import IDate from './DataType/Date.vue'
import IText from './DataType/Text.vue'
import IArray from './DataType/Array.vue'
import IObject from './DataType/Object.vue'
import i18n from '@/locales'

// API数据源类型选项
export const defaultApiDataTypeOptions = [
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-0'), value: 'int' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-1'), value: 'long' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-2'), value: 'float' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-3'), value: 'double' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-4'), value: 'string' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-5'), value: 'boolean' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-6'), value: 'date' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-7'), value: 'enum' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-8'), value: 'array' },
  { label: i18n.global.t('DataSource.CommandParams.Setting.100091-9'), value: 'object' }
]

// 参数配置表默认列
export const defaultParamsColumns = [
  {
    title: i18n.global.t('DataSource.CommandParams.Setting.100091-10'),
    dataIndex: 'id',
    key: 'id',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.CommandParams.Setting.100091-11'),
    dataIndex: 'dataType',
    key: 'dataType',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.CommandParams.Setting.100091-12'),
    dataIndex: 'name',
    key: 'name',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.CommandParams.Setting.100091-13'),
    dataIndex: 'operate',
    key: 'operate',
    align: 'center',
    fixed: 'right'
  }
]

export function useDataTypeManagement() {
  // 数据类型组件映射
  const dataTypeComponents = {
    float: IFloat,
    double: IFloat,
    boolean: IBoolean,
    date: IDate,
    string: IText,
    enum: IEnum,
    array: IArray,
    object: IObject
  }

  // 数据类型默认配置
  const typeDefaults = {
    float: { scale: 0 },
    double: { scale: 0 },
    boolean: { trueValue: 'true', trueText: i18n.global.t('DataSource.CommandParams.Setting.100091-14'), falseValue: 'false', falseText: i18n.global.t('DataSource.CommandParams.Setting.100091-15') },
    date: { format: 'yyyy-MM-dd HH:mm:ss' },
    string: { expands: { maxLength: 1 } },
    enum: { elements: [], type: 'enum' },
    array: { elementType: { type: 'int' } },
    object: { properties: [] }
  }

  // 获取数据类型组件
  const getDataTypeComponent = (type: string) => {
    return dataTypeComponents[type as keyof typeof dataTypeComponents]
  }

  // 判断是否可编辑的数据类型
  const isEditableDataType = (type: string, mode: 'treeTable' | 'defaultTable' = 'defaultTable') => {
    const editableTypes = ['float', 'double', 'string', 'boolean', 'date', 'enum', 'array', 'object']
    const treeTableEditableTypes = ['float', 'double', 'string', 'boolean', 'date', 'enum']

    if (mode === 'defaultTable') {
      return editableTypes.includes(type)
    } else {
      return treeTableEditableTypes.includes(type)
    }
  }

  // 验证数据类型
  const validateDataType = (record: any, mode: 'treeTable' | 'defaultTable' = 'defaultTable'): string => {
    if (!record.dataType?.type) {
      return i18n.global.t('DataSource.CommandParams.Setting.100091-16')
    }
    const isTree = mode === 'treeTable'
    const special = ['object', 'array'].includes(record.dataType.type)
    if (!isTree || (isTree && !special)) {
      if (record.dataType.type === 'enum' && !record.dataType.elements?.length) {
        return i18n.global.t('DataSource.CommandParams.Setting.100091-17')
      }
      if (record.dataType.type === 'object' && !record.dataType.properties?.length) {
        return i18n.global.t('DataSource.CommandParams.Setting.100091-18')
      }
      if (record.dataType.type === 'array') {
        if (record.dataType.elementType.type === 'object' && !record.dataType.elementType.properties?.length) {
          return i18n.global.t('DataSource.CommandParams.Setting.100091-19')
        }
      }
    }
    return ''
  }

  // 获取数据类型默认配置
  const getDefaultConfig = (type: string) => {
    return typeDefaults[type as keyof typeof typeDefaults] || {}
  }

  // 判断是否有效数据类型
  const isValidDataType = (type: string) => {
    return Object.keys(dataTypeComponents).includes(type)
  }

  return {
    dataTypeOptions: defaultApiDataTypeOptions,
    dataTypeComponents,
    typeDefaults,
    getDataTypeComponent,
    isEditableDataType,
    isValidDataType,
    getDefaultConfig,
    validateDataType
  }
}
