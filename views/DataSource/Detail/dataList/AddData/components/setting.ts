import IFloat from './Float.vue'
import IEnum from './Enum.vue'
import IBoolean from './Boolean.vue'
import IDate from './Date.vue'
import IText from './Text.vue'
import IArray from './Array.vue'
import IObject from './Object.vue'
import i18n from '@/locales'

// API数据源类型选项
export const defaultApiDataTypeOptions = [
  { label: 'int', value: 'int' },
  { label: 'long', value: 'long' },
  { label: 'float', value: 'float' },
  { label: 'double', value: 'double' },
  { label: 'text', value: 'string' },
  { label: 'boolean', value: 'boolean' },
  { label: 'date', value: 'date' },
  { label: 'enum', value: 'enum' },
  { label: 'array', value: 'array' },
  { label: 'object', value: 'object' }
]

// 参数配置表默认列
export const defaultParamsColumns = [
  {
    title: i18n.global.t('DataSource.CommandParams.100024-2'),
    dataIndex: 'id',
    key: 'id',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.DataTypeEditor.100038-0'),
    dataIndex: 'dataType',
    key: 'dataType',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.CommandParams.100024-3'),
    dataIndex: 'name',
    key: 'name',
    width: '30%'
  },
  {
    title: i18n.global.t('DataSource.table.100003-8'),
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
    boolean: { trueValue: 'true', trueText: 'true', falseValue: 'false', falseText: 'false' },
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
      return i18n.global.t('DataSource.DataType.100032-0')
    }
    const isTree = mode === 'treeTable'
    const special = ['object', 'array'].includes(record.dataType.type)
    if (!isTree || (isTree && !special)) {
      if (record.dataType.type === 'enum' && !record.dataType.elements) {
        return i18n.global.t('DataSource.Enum.100030-4')
      }
      if (record.dataType.type === 'object' && !record.dataType.properties) {
        return i18n.global.t('DataSource.Object.100031-0')
      }
      if (record.dataType.type === 'array') {
        if (record.dataType.elementType.type === 'object' && !record.dataType.elementType.properties) {
          return i18n.global.t('DataSource.Object.100031-0')
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
