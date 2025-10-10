import {isArray} from 'lodash-es'

interface ParamItem {
  key: string
  value: string
}

const DYNAMIC_PARAM_REGEX = /{{\s*(.*?)\s*}}/g

/**
 * 格式化输出对象
 * @param {string} paramName - 提取到的参数名 (例如：'id', 'name')
 * @returns {object} - 符合要求格式的对象
 */
export const formatParamOutput = (paramName: string): ParamItem => ({
  key: paramName, // 参数名
  value: '' // 值固定为空字符串
})

/**
 * 从字符串中提取所有动态参数 {{xxx}}
 * @param {string} text - 需要搜索的字符串
 * @returns {Set<string>} - 包含所有唯一参数名的 Set 集合
 */
export const extractUniqueParamsFromString = (text: string): Set<string> => {
  const paramNames = new Set<string>() // 使用 Set 自动处理重复项
  let match
  // 使用全局正则表达式循环查找所有匹配项
  // 每次循环后，正则表达式的 lastIndex 会更新，所以需要重置它
  DYNAMIC_PARAM_REGEX.lastIndex = 0 // 重置正则表达式的状态
  while ((match = DYNAMIC_PARAM_REGEX.exec(text)) !== null) {
    // match[1] 包含捕获组的内容，即 {{}} 中间的参数名
    paramNames.add(match[1].trim()) // trim() 去除可能存在的前后空格
  }
  return paramNames
}

/**
 * 查找 queryParams 数组中的动态参数
 * @param {Array<object>} queryParams - apiDefinition 中的 queryParams 数组
 * @returns {Array<object>} - 包含动态参数的格式化对象数组
 */
export const findQueryParams = (queryParams: any[]): Array<object> => {
  const allParamNames = new Set<string>() // 用于收集所有唯一的参数名

  if (!isArray(queryParams)) {
    console.warn('queryParams 不是一个有效的数组')
    return []
  }

  queryParams.forEach((param) => {
    if (!param.enable) return
    // 检查 key 字段
    extractUniqueParamsFromString(param.key).forEach((name) => allParamNames.add(name))
    // 检查 value 字段
    extractUniqueParamsFromString(param.value).forEach((name) => allParamNames.add(name))
  })

  // 将 Set 转换为目标格式的对象数组
  return Array.from(allParamNames).map((name) => formatParamOutput(name as string))
}

/**
 * 查找 body 字符串中的动态参数
 * @param {string} bodyString - apiDefinition 中的 body 字符串
 * @returns {Array<object>} - 包含动态参数的格式化对象数组
 */
export const findBodyJsonParams = (bodyString: string): Array<object> => {
  const paramNames = extractUniqueParamsFromString(bodyString)
  return Array.from(paramNames).map((name) => formatParamOutput(name as string))
}

/**
 * 查找 uri 字符串中的动态参数 (包括路径和查询部分)
 * @param {string} uriString - apiDefinition 中的 uri 字符串
 * @returns {Array<object>} - 包含动态参数的格式化对象数组
 */
export const findUriParams = (uriString: string): Array<object> => {
  const paramNames = extractUniqueParamsFromString(uriString.replace(/\?.*$/, ''))
  return Array.from(paramNames).map((name) => formatParamOutput(name as string))
}

/**
 * 将数组中的每个对象转换为包含 key 和 value 的对象
 * @param {Array<object>} originalArray - 原始数组
 * @returns {Array<object>} - 转换后的数组
 */
export const transformArray = (originalArray: any[]): Array<object> => {
  return (
    originalArray?.map((item) => ({
      key: {
        value: item.key
      },
      value: {
        value: item.value
      },
      enable: item.enable,
      description: item.description || ''
    })) || []
  )
}

/**
 * 将动态参数数组转换为键值对对象
 * @param {Array<{name: string, value: string}>} params - 动态参数数组
 * @returns {Record<string, string>} - 转换后的键值对对象
 */
export const convertParamsToObject = (params: any[]): Record<string, string> => {
  return params.reduce((acc: Record<string, string>, item: any) => {
    acc[item.name || item.key] = item.value
    return acc
  }, {} as Record<string, string>)
}
