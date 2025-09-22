import IFloat from './Float.vue'
import IEnum from './Enum.vue'
import IBoolean from './Boolean.vue'
import IDate from './Date.vue'
import IText from './Text.vue'
import IArray from './Array.vue'
import IObject from './Object.vue'
// API数据源类型选项
export const defaultApiDataTypeOptions = [
  { label: 'int(整数型)', value: 'int' },
  {
    label: 'long(长整数型)',
    value: 'long'
  },
  { label: 'float(单精度浮点型)', value: 'float' },
  { label: 'double(双精度浮点型)', value: 'double' },
  { label: 'text(字符串)', value: 'string' },
  { label: 'boolean(布尔型)', value: 'boolean' },
  { label: 'date(时间型)', value: 'date' },
  { label: 'enum(枚举型)', value: 'enum' },
  { label: 'array(数组)', value: 'array' },
  { label: 'object(结构体)', value: 'object' }
]

// 参数配置表默认列
export const defaultParamsColumns = [
  {
    title: '参数标识',
    dataIndex: 'id',
    key: 'id',
    width: '30%'
  },
  {
    title: '数据类型',
    dataIndex: 'dataType',
    key: 'dataType',
    width: '30%'
  },
  {
    title: '参数名',
    dataIndex: 'name',
    key: 'name',
    width: '30%'
  },
  {
    title: '操作',
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
    boolean: { trueValue: 'true', trueText: '是', falseValue: 'false', falseText: '否' },
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
      return '请选择数据类型'
    }
    const isTree = mode === 'treeTable'
    const special = ['object', 'array'].includes(record.dataType.type)
    if (!isTree || (isTree && !special)) {
      if (record.dataType.type === 'enum' && !record.dataType.elements) {
        return '请配置枚举项'
      }
      if (record.dataType.type === 'object' && !record.dataType.properties) {
        return '请配置对象'
      }
      if (record.dataType.type === 'array') {
        if (record.dataType.elementType.type === 'object' && !record.dataType.elementType.properties) {
          return '请配置数组元素'
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
