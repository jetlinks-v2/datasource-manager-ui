/**
 * MongoDB 聚合管道解析和验证工具
 *
 * 支持的数据类型规则：
 * 1. 数组 (Array)
 *    - $unset: 可接受字符串数组
 *    - $documents: 文档数组（将字符串作为输入）
 *
 * 2. 表达式（字符串路径 或 对象表达式）
 *    - $sortByCount: 接受一个表达式
 *    - $replaceWith: 接受一个替换为的文档表达式
 *
 * 3. 数字 (Number)
 *    - $limit: 正整数
 *    - $skip: 非负整数
 *
 * 4. 字符串 (String)
 *    - $count: 输出字段名
 *    - $unwind: （简写）字段路径径
 *    - $out: （简写）目标集合名
 *    - $unionWith: （简写）要合并的集合名
 *    - $redact: 系统变量字符串（少用）
 *
 * 注：$out、$unionWith 也都有对象写法（带选项↓项），这里列的是非对象的简写形式。
 */

import { randomString } from '@jetlinks-web/utils'

/**
 * 管道阶段接口
 */
export interface PipelineStage {
  id: string
  type: string
  body: string
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  errorIndex: number
  errorMessage: string
}

/**
 * 阶段类型配置
 */
interface StageTypeConfig {
  label: string
  // 期望的数据类型：'object' | 'array' | 'number' | 'string' | 'expression'
  expectedType: 'object' | 'array' | 'number' | 'string' | 'expression'
  // 是否允许动态变量
  allowVariables?: boolean
}

/**
 * 阶段类型配置映射
 */
const STAGE_TYPE_CONFIG: Record<string, StageTypeConfig> = {
  // 对象类型
  $match: { label: '条件过滤', expectedType: 'object', allowVariables: true },
  $project: { label: '字段投影/计算', expectedType: 'object', allowVariables: true },
  $group: { label: '分组聚合', expectedType: 'object', allowVariables: true },
  $sort: { label: '排序', expectedType: 'object', allowVariables: true },
  $lookup: { label: '关联集合', expectedType: 'object', allowVariables: true },
  $addFields: { label: '添加计算字段', expectedType: 'object', allowVariables: true },
  $facet: { label: '多路子管道', expectedType: 'object', allowVariables: true },
  $sample: { label: '随机采样', expectedType: 'object', allowVariables: true },

  // 数组类型
  $unset: { label: '移除字段', expectedType: 'array', allowVariables: true },
  $documents: { label: '文档数组', expectedType: 'array', allowVariables: true },

  // 表达式类型（字符串路径 或 对象表达式）
  $sortByCount: { label: '按计数排序', expectedType: 'expression', allowVariables: true },
  $replaceWith: { label: '替换文档', expectedType: 'expression', allowVariables: true },

  // 数字类型
  $limit: { label: '限制条数', expectedType: 'number', allowVariables: true },
  $skip: { label: '跳过条数', expectedType: 'number', allowVariables: true },

  // 字符串类型
  $count: { label: '计数', expectedType: 'string', allowVariables: true },
  $unwind: { label: '拆分数组', expectedType: 'string', allowVariables: true },
  $out: { label: '目标集合', expectedType: 'string', allowVariables: true },
  $unionWith: { label: '合并集合', expectedType: 'string', allowVariables: true },
  $redact: { label: '系统变量字符串', expectedType: 'string', allowVariables: true },

  // 特殊类型（$replaceRoot 也接受对象）
  $replaceRoot: { label: '替换根文档', expectedType: 'object', allowVariables: true }
}

/**
 * 获取阶段类型选项列表
 */
export function getStageTypeOptions() {
  return Object.entries(STAGE_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: `${value} - ${config.label}`
  }))
}

/**
 * 从字符串中提取动态参数变量
 * 匹配模式：${variableName}
 */
export function extractVariablesFromBody(body: string): string[] {
  const variablePattern = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g
  const variables = new Set<string>()
  let match
  while ((match = variablePattern.exec(body)) !== null) {
    variables.add(match[1])
  }
  return Array.from(variables)
}

/**
 * 从所有阶段中收集动态参数
 */
export function collectAllVariables(stages: PipelineStage[]): string[] {
  const allVariables = new Set<string>()

  stages.forEach((stage) => {
    if (stage.body) {
      const variables = extractVariablesFromBody(stage.body)
      variables.forEach((v) => allVariables.add(v))
    }
  })

  return Array.from(allVariables)
}

/**
 * 检查动态参数是否用于非字符串类型的位置
 * 返回需要高级模式的原因
 */
export function checkAdvancedModeRequired(stages: PipelineStage[]): {
  required: boolean
  reason: string
} {
  for (const stage of stages) {
    if (!stage.body) continue

    const config = STAGE_TYPE_CONFIG[stage.type]
    if (!config) continue

    // 检查是否包含动态参数
    const hasDynamicVariables = /\$\{[A-Za-z_][A-Za-z0-9_]*\}/.test(stage.body)
    if (!hasDynamicVariables) continue

    // 如果阶段类型期望的是数字、数组、对象（非字符串类型）
    // 并且包含动态参数，则需要高级模式
    switch (config.expectedType) {
      case 'number':
        return {
          required: true,
          reason: `阶段 ${stage.type} 需要数字类型参数，普通模式只支持字符串输入`
        }
      case 'array':
        return {
          required: true,
          reason: `阶段 ${stage.type} 需要数组类型参数，普通模式只支持字符串输入`
        }
      case 'object':
        // 检查动态参数是否在对象的值位置，且该值不是字符串
        // 这需要更复杂的解析，简化处理：如果对象中有动态参数，提示可能需要高级模式
        try {
          const replaced = replaceDynamicVariables(stage.body)
          const parsed = JSON.parse(replaced)
          // 如果替换后的占位值不是字符串，说明需要高级模式
          const bodyStr = JSON.stringify(parsed)
          if (bodyStr.includes('"__PLACEHOLDER__"') && stage.body.match(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/)) {
            // 检查原始 body 中动态参数的上下文
            const varMatches = stage.body.matchAll(/:\s*\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)
            for (const match of varMatches) {
              // 如果动态参数前面没有引号，说明期望非字符串类型
              const beforeVar = stage.body.substring(0, match.index!)
              if (!beforeVar.endsWith('"')) {
                return {
                  required: true,
                  reason: `阶段 ${stage.type} 中的参数 \${${match[1]}} 可能需要非字符串类型，建议使用高级模式`
                }
              }
            }
          }
        } catch {
          // 解析失败，跳过
        }
        break
      case 'expression':
        // 表达式可以是字符串或对象，如果是对象则可能需要高级模式
        try {
          const replaced = replaceDynamicVariables(stage.body)
          const parsed = JSON.parse(replaced)
          if (typeof parsed === 'object' && parsed !== null) {
            return {
              required: true,
              reason: `阶段 ${stage.type} 使用对象表达式且包含动态参数，可能需要高级模式`
            }
          }
        } catch {
          // 解析失败，跳过
        }
        break
    }
  }

  return { required: false, reason: '' }
}

/**
 * 替换动态参数为占位值，用于验证 JSON 格式
 */
function replaceDynamicVariables(str: string): string {
  // 将 ${variableName} 替换为对应类型的占位值
  return str.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, varName) => {
    // 尝试推断变量类型
    // 如果变量名包含 size、count、limit、skip、age 等，推断为数字
    const numberKeywords = ['size', 'count', 'limit', 'skip', 'age', 'offset', 'page', 'num', 'index']
    const isNumber = numberKeywords.some((keyword) => varName.toLowerCase().includes(keyword))

    if (isNumber) {
      return '0'
    }

    // 默认替换为字符串
    return '"__PLACEHOLDER__"'
  })
}

/**
 * 判断字符串是否为有效的 JSON（支持动态参数）
 */
function isValidJSON(str: string): boolean {
  try {
    // 先替换动态参数，再验证 JSON
    const replaced = replaceDynamicVariables(str)
    JSON.parse(replaced)
    return true
  } catch {
    return false
  }
}

/**
 * 获取 JSON 值的类型（支持动态参数）
 */
function getJSONType(value: any): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * 解析 JSON（支持动态参数）
 */
function parseJSONWithVariables(str: string): any {
  const replaced = replaceDynamicVariables(str)
  return JSON.parse(replaced)
}

/**
 * 验证阶段内容的数据类型是否符合规则
 */
function validateStageDataType(
  stageType: string,
  body: string,
  config: StageTypeConfig
): { valid: boolean; message?: string } {
  // 如果内容为空
  if (!body || !body.trim()) {
    return { valid: false, message: '阶段内容不能为空' }
  }

  // 先检查是否为有效的 JSON（替换动态参数后）
  if (!isValidJSON(body)) {
    return { valid: false, message: 'JSON 格式错误' }
  }

  const parsedValue = parseJSONWithVariables(body)
  const actualType = getJSONType(parsedValue)

  // 检查是否包含动态参数
  const hasDynamicVariables = /\$\{[A-Za-z_][A-Za-z0-9_]*\}/.test(body)

  // 根据期望类型进行验证
  switch (config.expectedType) {
    case 'object':
      if (actualType !== 'object' || Array.isArray(parsedValue)) {
        return {
          valid: false,
          message: `${stageType} 期望对象类型，但实际是 ${actualType}`
        }
      }
      break

    case 'array':
      if (!Array.isArray(parsedValue)) {
        return {
          valid: false,
          message: `${stageType} 期望数组类型，但实际是 ${actualType}`
        }
      }
      break

    case 'number':
      if (actualType !== 'number') {
        return {
          valid: false,
          message: `${stageType} 期望数字类型，但实际是 ${actualType}`
        }
      }
      // 如果包含动态参数，跳过数值范围验证
      if (!hasDynamicVariables) {
        // 特殊验证：$limit 必须是正整数，$skip 必须是非负整数
        if (stageType === '$limit' && parsedValue <= 0) {
          return { valid: false, message: '$limit 必须是正整数' }
        }
        if (stageType === '$skip' && parsedValue < 0) {
          return { valid: false, message: '$skip 必须是非负整数' }
        }
      }
      break

    case 'string':
      if (actualType !== 'string') {
        return {
          valid: false,
          message: `${stageType} 期望字符串类型，但实际是 ${actualType}`
        }
      }
      break

    case 'expression':
      // 表达式可以是字符串路径（如 "$city"）或对象表达式
      if (actualType !== 'string' && actualType !== 'object') {
        return {
          valid: false,
          message: `${stageType} 期望字符串路径或对象表达式，但实际是 ${actualType}`
        }
      }
      break

    default:
      return { valid: false, message: `未知的期望类型: ${config.expectedType}` }
  }

  return { valid: true }
}

/**
 * 验证所有阶段的内容
 */
export function validateStagesContent(stages: PipelineStage[]): ValidationResult {
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i]
    const body = stage.body?.trim()

    // 检查内容是否为空
    if (!body) {
      return {
        valid: false,
        errorIndex: i,
        errorMessage: `阶段 ${i + 1} (${stage.type}) 的内容不能为空`
      }
    }

    // 获取阶段类型配置
    const config = STAGE_TYPE_CONFIG[stage.type]
    if (!config) {
      return {
        valid: false,
        errorIndex: i,
        errorMessage: `阶段 ${i + 1} 的类型 ${stage.type} 不支持`
      }
    }

    // 验证数据类型
    const typeValidation = validateStageDataType(stage.type, body, config)
    if (!typeValidation.valid) {
      return {
        valid: false,
        errorIndex: i,
        errorMessage: `阶段 ${i + 1} (${stage.type}): ${typeValidation.message}`
      }
    }
  }

  return { valid: true, errorIndex: -1, errorMessage: '' }
}

/**
 * 解析 pipeline 字符串为阶段数组
 * 处理 body 为原始字符串的情况
 */
export function parsePipelineString(pipelineStr: string): PipelineStage[] {
  const stages: PipelineStage[] = []

  // 移除外层数组括号
  const content = pipelineStr.trim().slice(1, -1)

  let depth = 0
  let start = 0

  // 按顶层逗号分割各个 stage
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (char === '{') depth++
    else if (char === '}') depth--
    else if (char === ',' && depth === 0) {
      const stageStr = content.slice(start, i).trim()
      if (stageStr) {
        const parsed = parseStageString(stageStr)
        if (parsed) stages.push(parsed)
      }
      start = i + 1
    }
  }

  // 处理最后一个 stage
  const lastStageStr = content.slice(start).trim()
  if (lastStageStr) {
    const parsed = parseStageString(lastStageStr)
    if (parsed) stages.push(parsed)
  }

  return stages
}

/**
 * 解析单个 stage 字符串
 * 例如：{"$match":{...}}
 */
function parseStageString(stageStr: string): PipelineStage | null {
  // 匹配 {"$xxx": 后面的内容
  const match = stageStr.match(/^\s*\{\s*"(\$\w+)"\s*:\s*/)
  if (!match) return null

  const stageType = match[1]
  const bodyStart = match[0].length
  // body 是从 stageType 后的冒号到最后一个 } 之前的内容
  const body = stageStr.slice(bodyStart, -1).trim()

  return {
    id: randomString(8),
    type: stageType,
    body
  }
}

/**
 * 构建 pipeline 字符串
 */
export function buildPipelineString(stages: PipelineStage[]): string {
  return `[${stages
    .map((stage) => {
      // 对于数字类型和字符串类型，body 本身已经是完整的值
      // 对于对象和数组类型，body 也是完整的 JSON
      // 所以直接拼接即可
      return `{"${stage.type}":${stage.body}}`
    })
    .join(',')}]`
}

/**
 * 创建默认阶段
 */
export function createDefaultStage(type: string = '$match'): PipelineStage {
  const config = STAGE_TYPE_CONFIG[type]
  let defaultBody = '{}'

  // 根据类型设置默认值
  if (config) {
    switch (config.expectedType) {
      case 'array':
        defaultBody = '[]'
        break
      case 'number':
        defaultBody = type === '$limit' ? '10' : '0'
        break
      case 'string':
        defaultBody = '""'
        break
      case 'expression':
        defaultBody = '""'
        break
      default:
        defaultBody = '{}'
    }
  }

  return {
    id: randomString(8),
    type,
    body: defaultBody
  }
}
