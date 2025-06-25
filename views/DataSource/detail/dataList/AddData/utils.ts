import { cloneDeep, isArray, isObject } from 'lodash-es'
import { randomString } from '@jetlinks-web/utils'

/**
 * 获取值的类型
 * @param value
 */
export const getValueType = (value: any) => {
  if (Number.isInteger(value)) {
    return 'int'
  } else if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      return value.toString().includes('.') ? 'float' : 'double'
    }
  } else if (typeof value === 'string') {
    return 'string'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else if (Array.isArray(value)) {
    return 'array'
  } else if (typeof value === 'object' && value !== null) {
    return 'object'
  } else {
    return 'string'
  }
}

/**
 * 数据转换成树形表格支持结构
 * @param {Object} data
 */
export const convertToTableTreeData = (data: Object): any => {
  let _data = {} as any
  if (isArray(data)) {
    _data = { ...data[0] }
  } else {
    // 单值类型
    if (!isObject(data)) {
      return []
    }
    _data = { ...data }
  }
  return Object.keys(_data).map((k) => {
    const value = _data[k]

    const type = getValueType(value)
    if (typeof value === 'object' && value !== null) {
      return {
        key: randomString(5),
        id: k,
        name: k,
        dataType: {
          type,
          ...(isArray(value)
            ? {
                elementType: {
                  type: getValueType(value[0]),
                  properties: convertToTableTreeData(cloneDeep(value))
                }
              }
            : {
                properties: convertToTableTreeData(cloneDeep(value))
              })
        },
        children: convertToTableTreeData(cloneDeep(value))
      }
    } else {
      return {
        key: randomString(5),
        id: k,
        name: k,
        dataType: { type }
      }
    }
  })
}

export function metadataConvertToTableTree(data: any, typeKey = 'valueType') {
  const result = data.map((node: any) => {
    let { id, name, description, valueType } = node

    let children = []

    // 处理对象类型的子节点
    if (valueType?.type === 'object' && valueType.properties) {
      children = metadataConvertToTableTree(valueType.properties, typeKey)
      valueType = {
        ...valueType,
        properties: children
      }
    }

    // 处理数组类型的子节点
    if (valueType?.type === 'array' && valueType?.elementType?.type === 'object' && valueType.elementType?.properties) {
      children = metadataConvertToTableTree(valueType.elementType.properties, typeKey)
      valueType = {
        ...valueType,
        elementType: {
          ...valueType.elementType,
          properties: children
        }
      }
    }

    const obj = {
      key: randomString(5),
      name,
      id,
      description,
      [typeKey]: { ...valueType }
    }
    if (children.length > 0) {
      obj['children'] = children
    }

    return obj
  })
  return result
}

/**
 * 将响应结果转换为后台格式
 * @param {any[]} input
 * @param typeKey
 */
export function parseTableTreeToMetadata(input: any[], typeKey = 'dataType') {
  function processItem(item: any) {
    function hasChildWithName(item: any) {
      if (item.name) {
        return true
      }

      // 则递归检查每个子节点
      if (item.children && item.children.length > 0) {
        return item.children.some((child: any) => hasChildWithName(child))
      }
      return false
    }

    if (hasChildWithName(item)) {
      if (!item.name) item.name = item.id
    }

    // 如果 `name` 仍然为空，返回 null 表示跳过该节点
    if (!item.name) {
      return null
    }

    const result: any = {
      id: item.id,
      name: item.name,
      description: item.description,
      expands: {}
    }

    const valueType = item[typeKey]
    // 处理对象类型
    if (valueType.type === 'object') {
      result.valueType = {
        type: 'object',
        expands: {},
        properties: (item.children || []).map((child: any) => processItem(child)).filter((child: any) => child !== null) // 过滤掉 null 的子节点
      }
    }

    // 处理数组类型
    else if (valueType.type === 'array') {
      let elementType: any

      if (valueType.elementType.type === 'object') {
        elementType = {
          type: 'object',
          expands: {},
          properties: (item.children || [])
            .map((child: any) => processItem(child))
            .filter((child: any) => child !== null) // 过滤掉 null 的子节点
        }
      } else {
        elementType = {
          ...valueType.elementType
        }
      }

      result.valueType = {
        type: 'array',
        expands: {},
        elementType
      }
    }
    // 处理其他数据类型
    else {
      result.valueType = { ...valueType }
    }

    return result
  }
  return input.map((item) => processItem(item)).filter((item) => item !== null)
}

/**
 * 数组对象替换
 * @param target
 * @param source
 */
export function replaceMatchingObjects(target: any[], source: any[]) {
  if (!target?.length) {
    return []
  }
  if (!source?.length) {
    return target
  }

  const sourceMap = new Map(source.map((item) => [item.id, item]))

  return target.map((item) => {
    let newItem = item

    if (sourceMap.has(item.id)) {
      newItem = sourceMap.get(item.id)
    }

    if (item.children) {
      newItem.children = replaceMatchingObjects(item.children, newItem.children || [])
    }

    return newItem
  })
}

/*
 * 解析url
 */
export function useAllParams(url: string) {
  // 只提取查询参数
  const queryParams = computed(() => {
    const params: { key: string; value: string; enable: boolean; edit: boolean }[] = []
    const query = url.split('?')[1] || ''

    query.split('&').forEach((pair) => {
      const [key, value = ''] = pair.split('=')
      if (key) {
        params.push({
          key,
          value,
          enable: true,
          edit: true
        })
      }
    })

    return params
  })

  return {
    queryParams
  }
}
