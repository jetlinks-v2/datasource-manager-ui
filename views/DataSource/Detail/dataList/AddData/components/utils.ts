import { isArray } from 'lodash-es'

interface ParamItem {
  key: string
  value: string
}

// 有效的动态参数正则：{{变量名}}，变量名必须是有效的标识符（字母、数字、下划线、连字符，不能为空）
const DYNAMIC_PARAM_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_-]*)}}/g

// 检测格式错误的变量语法
const INVALID_PATTERNS = [
  { pattern: /\{\{\s*}}/g, message: 'DataSource.utils.100036-1' }, // {{}} 或 {{  }}
  { pattern: /\{\{\s+[^}\s]/g, message: 'DataSource.utils.100036-2' }, // {{ test}} 变量名前有空格
  { pattern: /[^{\s]\s+}}/g, message: 'DataSource.utils.100036-3' }, // {{test }} 变量名后有空格
  { pattern: /\{\{\{+/g, message: 'DataSource.utils.100036-4' }, // {{{ 或更多
  { pattern: /}}}+/g, message: 'DataSource.utils.100036-4' }, // }}} 或更多
  { pattern: /\{\{[^}]*\{/g, message: 'DataSource.utils.100036-5' }, // {{ 内部有 {
  { pattern: /}[^{]*}}/g, message: 'DataSource.utils.100036-5' } // }} 前有额外的 }
]

// URL 中不允许的特殊字符（排除常见的 URL 合法字符和变量占位符）
const URL_INVALID_CHARS = /[<>"\s\\|^`\[\]]/

export interface ValidationResult {
  valid: boolean
  errors: Array<{ text: string; message: string; index: number }>
}

/**
 * 验证字符串中的动态参数格式是否正确
 * @param {string} text - 需要验证的字符串
 * @returns {ValidationResult} - 验证结果
 */
export const validateDynamicParams = (text: string): ValidationResult => {
  const errors: Array<{ text: string; message: string; index: number }> = []

  for (const { pattern, message } of INVALID_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      errors.push({
        text: match[0],
        message,
        index: match.index
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证 URL 中是否包含非法特殊字符
 * @param {string} url - 需要验证的 URL
 * @returns {ValidationResult} - 验证结果
 */
export const validateUrlChars = (url: string): ValidationResult => {
  const errors: Array<{ text: string; message: string; index: number }> = []

  // 先移除变量占位符再检查特殊字符
  const urlWithoutVars = url.replace(/\{\{[^}]*}}/g, '')

  for (let i = 0; i < urlWithoutVars.length; i++) {
    const char = urlWithoutVars[i]
    if (URL_INVALID_CHARS.test(char)) {
      errors.push({
        text: char,
        message: 'DataSource.utils.100036-6',
        index: i
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

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
    const paramName = match[1].trim()
    // 只添加非空的有效参数名
    if (paramName) {
      paramNames.add(paramName)
    }
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
