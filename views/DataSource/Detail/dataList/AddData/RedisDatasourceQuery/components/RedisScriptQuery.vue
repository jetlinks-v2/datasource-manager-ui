<template>
  <div class="redis-script-query-container">
    <!-- 脚本编辑区域 -->
    <div class="script-section">
      <div class="section-header">
        <span class="section-title">Lua 脚本</span>
        <a-button
          type="primary"
          size="small"
          @click="handleParseVariables"
        >
          <template #icon>
            <AIcon type="ThunderboltOutlined" />
          </template>
          解析变量
        </a-button>
      </div>
      <div class="editor-container">
        <LuaScriptEditor
          ref="luaEditorRef"
          v-model="scriptContent"
          height="300px"
          @variables-change="handleVariablesChange"
        />
      </div>
    </div>

    <!-- 变量输入区域 -->
    <div
      v-if="parsedVariables.length > 0"
      class="variables-section"
    >
      <div class="section-header">
        <span class="section-title">变量参数</span>
        <a-tag color="blue">共 {{ parsedVariables.length }} 个变量</a-tag>
      </div>
      <div class="variables-list">
        <div
          v-for="variable in parsedVariables"
          :key="variable"
          class="variable-item"
        >
          <div class="variable-label">
            <code>${{ variable }}</code>
          </div>
          <a-input
            v-model:value="variableValues[variable]"
            placeholder="请输入变量值"
            allow-clear
          />
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <a-button
        type="primary"
        size="large"
        :loading="executing"
        :disabled="!canExecute"
        @click="handleExecute"
      >
        <template #icon>
          <AIcon type="PlayCircleOutlined" />
        </template>
        发送执行
      </a-button>
      <a-button
        size="large"
        @click="handleReset"
      >
        <template #icon>
          <AIcon type="ReloadOutlined" />
        </template>
        重置
      </a-button>
    </div>

    <!-- 结果展示区域 -->
    <div
      v-if="hasResult"
      class="result-section"
    >
      <div class="section-header">
        <span class="section-title">执行结果</span>
        <div class="result-info">
          <a-tag :color="executionSuccess ? 'success' : 'error'">
            {{ executionSuccess ? '执行成功' : '执行失败' }}
          </a-tag>
          <a-tag color="default">耗时: {{ executionTime }}ms</a-tag>
        </div>
      </div>
      <div class="result-content">
        <JsonEditor
          v-model="resultJson"
          height="300px"
          :read-only="true"
          :show-format-btn="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RedisScriptQuery">
import { onlyMessage } from '@jetlinks-web/utils'
import LuaScriptEditor from './LuaScriptEditor.vue'
import JsonEditor from '../../dataList/AddData/components/JsonEditor.vue'

interface Props {
  data?: {
    script?: string
    variables?: Record<string, string>
    [key: string]: any
  }
  isEdit?: boolean
  formRef?: any
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
  isEdit: false,
  formRef: null
})

const emit = defineEmits(['update:configuration'])

const luaEditorRef = ref<InstanceType<typeof LuaScriptEditor>>()

// 脚本内容
const scriptContent = ref(`-- Redis Lua 脚本示例
-- 使用 \${变量名} 定义变量

local key = KEYS[1]
local value = ARGV[1]

-- 设置键值
redis.call('SET', key, value)

-- 获取键值
local result = redis.call('GET', key)

return result`)

// 变量相关
const parsedVariables = ref<string[]>([])
const variableValues = ref<Record<string, string>>({})

// 执行相关
const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
const executionTime = ref(0)
const resultJson = ref('')

// 是否可以执行
const canExecute = computed(() => {
  if (!scriptContent.value.trim()) return false
  if (parsedVariables.value.length === 0) return true
  return parsedVariables.value.every((v) => variableValues.value[v]?.trim())
})

// 变量自动提取（实时）
const handleVariablesChange = (variables: string[]) => {
  // 保留已有的变量值，添加新变量
  const newValues: Record<string, string> = {}
  variables.forEach((v) => {
    newValues[v] = variableValues.value[v] || ''
  })
  variableValues.value = newValues
}

// 手动解析变量
const handleParseVariables = () => {
  if (!luaEditorRef.value) return
  const variables = luaEditorRef.value.extractVariables()
  parsedVariables.value = variables

  // 初始化变量值
  const newValues: Record<string, string> = {}
  variables.forEach((v: any) => {
    newValues[v] = variableValues.value[v] || ''
  })
  variableValues.value = newValues

  if (variables.length > 0) {
    onlyMessage(`成功解析 ${variables.length} 个变量`)
  } else {
    onlyMessage('未发现变量，请在脚本中使用 ${变量名} 格式定义变量', 'error')
  }
}

// 执行脚本（模拟）
const handleExecute = async () => {
  executing.value = true
  hasResult.value = false

  const startTime = Date.now()

  try {
    // 模拟网络请求延迟
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400))

    // 替换脚本中的变量
    let processedScript = scriptContent.value
    Object.entries(variableValues.value).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      processedScript = processedScript.replace(regex, value)
    })

    // 模拟执行结果
    const mockResult = {
      success: true,
      message: '脚本执行成功',
      data: {
        script: processedScript,
        variables: variableValues.value,
        keys: ['test:key:1', 'test:key:2'],
        argv: Object.values(variableValues.value),
        result: 'OK',
        affectedKeys: Math.floor(Math.random() * 10) + 1,
        returnValue: Math.random() > 0.5 ? 'SUCCESS' : { status: 'ok', count: 42 },
        executedAt: new Date().toISOString()
      },
      timestamp: Date.now()
    }

    executionTime.value = Date.now() - startTime
    executionSuccess.value = true
    resultJson.value = JSON.stringify(mockResult, null, 2)
    hasResult.value = true

    onlyMessage('脚本执行成功')
  } catch (error: any) {
    executionTime.value = Date.now() - startTime
    executionSuccess.value = false
    resultJson.value = JSON.stringify(
      {
        success: false,
        error: error.message || '脚本执行失败',
        timestamp: Date.now()
      },
      null,
      2
    )
    hasResult.value = true

    onlyMessage('脚本执行失败', 'error')
  } finally {
    executing.value = false
    updateConfiguration()
  }
}

// 重置
const handleReset = () => {
  scriptContent.value = `-- Redis Lua 脚本示例
-- 使用 \${变量名} 定义变量

local key = KEYS[1]
local value = ARGV[1]

-- 设置键值
redis.call('SET', key, value)

-- 获取键值
local result = redis.call('GET', key)

return result`

  parsedVariables.value = []
  variableValues.value = {}
  hasResult.value = false
  executionSuccess.value = false
  executionTime.value = 0
  resultJson.value = ''
}

// 更新配置
const updateConfiguration = () => {
  const config = {
    script: scriptContent.value,
    variables: variableValues.value,
    provider: 'script',
    description: ''
  }
  emit('update:configuration', config)
}

// 验证
const validateAll = async () => {
  if (!scriptContent.value.trim()) {
    onlyMessage('请输入 Lua 脚本', 'error')
    return false
  }
  return true
}

// 初始化
onMounted(() => {
  nextTick(() => {
    try {
      if (props.data?.script) {
        scriptContent.value = props.data.script
      }
      if (props.data?.variables) {
        variableValues.value = props.data.variables
      }
      // 解析变量
      if (luaEditorRef.value) {
        const variables = luaEditorRef.value.extractVariables()
        parsedVariables.value = variables
      }
      updateConfiguration()
    } catch (error) {
      console.error('初始化数据失败', error)
    }
  })
})

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.redis-script-query-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #262626;
      display: flex;
      align-items: center;
      gap: 8px;

      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 14px;
        background: #1890ff;
        border-radius: 2px;
      }
    }

    .result-info {
      display: flex;
      gap: 8px;
    }
  }

  .script-section {
    .editor-container {
      background: #fafafa;
      border-radius: 4px;
      padding: 8px;
    }
  }

  .variables-section {
    .variables-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;

      .variable-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .variable-label {
          font-size: 13px;
          color: #595959;
          display: flex;
          align-items: center;

          code {
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
            font-size: 12px;
            color: #4ec9b0;
            font-weight: 600;
          }
        }
      }
    }
  }

  .action-section {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border-radius: 4px;
    justify-content: center;
  }

  .result-section {
    .result-content {
      border-radius: 4px;
      padding: 8px;
      overflow: hidden;
    }
  }
}
</style>
