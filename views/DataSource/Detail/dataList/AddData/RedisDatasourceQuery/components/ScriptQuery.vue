<template>
  <div class="redis-script-query-container">
    <!-- 脚本编辑区域 -->
    <div class="section-header">
      <TitleComponent
        data="Lua 脚本"
        class="section-title"
      />
      <a-space>
        <a-popover
          trigger="click"
          placement="left"
        >
          <template #content>
            <div style="width: 400px; height: 300px">
              <LuaScriptEditor
                ref="luaEditorRef"
                v-model="helpContent"
                height="100%"
                :read-only="true"
              />
            </div>
          </template>
          <a-tooltip title="帮助文档">
            <a-button
              type="text"
              ghost
              size="small"
            >
              <template #icon>
                <AIcon
                  type="ReadOutlined"
                  style="color: #1890ff"
                />
              </template>
            </a-button>
          </a-tooltip>
        </a-popover>
        <a-button
          type="primary"
          size="small"
          @click="handleParseVariables"
        >
          <template #icon>
            <AIcon type="ThunderboltOutlined" />
          </template>
          解析
        </a-button>
      </a-space>
    </div>

    <LuaScriptEditor
      ref="luaEditorRef"
      v-model="scriptContent"
      height="300px"
      @variables-change="handleVariablesChange"
    />

    <!-- 变量输入区域 -->
    <div
      v-if="parsedVariables.length > 0"
      class="variables-section"
    >
      <div class="section-header">
        <TitleComponent
          data="变量参数"
          class="section-title"
        />
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
        :loading="executing"
        :disabled="!canExecute"
        @click="handleExecute"
      >
        <template #icon>
          <AIcon type="PlayCircleOutlined" />
        </template>
        发送执行
      </a-button>
    </div>

    <!-- 结果展示区域 -->
    <div
      v-if="hasResult"
      class="result-section"
    >
      <div class="section-header">
        <TitleComponent
          data="执行结果"
          class="section-title"
        />
        <div class="result-info">
          <a-tag :color="executionSuccess ? 'success' : 'error'">
            {{ executionSuccess ? '执行成功' : '执行失败' }}
          </a-tag>
        </div>
      </div>
      <div class="result-content">
        <MonacoEditor
          v-model="resultJson"
          theme="vs"
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
import MonacoEditor from '@/components/MonacoEditor/monacoEditor.vue'

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
const helpContent = ref(`-- Redis Lua 脚本示例

local pattern = \${pattern}
local value = \${value}

-- 设置键值
redis.call('SET', key, \${value})

-- 获取键值
local result = redis.call('GET', key)

return result`)
// 脚本内容
const scriptContent = ref(`-- Redis Lua 脚本示例
local pattern = \${pattern}
local keys = redis.call('KEYS', pattern)
return keys`)

// 变量相关
const parsedVariables = ref<string[]>([])
const variableValues = ref<Record<string, string>>({})

// 执行相关
const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
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
  }
}

// 执行脚本（模拟）
const handleExecute = async () => {
  executing.value = true
  hasResult.value = false

  try {
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

    executionSuccess.value = true
    resultJson.value = JSON.stringify(mockResult, null, 2)
    hasResult.value = true

    onlyMessage('脚本执行成功')
  } catch (error: any) {
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
  padding: 0 16px;
  height: 100%;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;

    .section-title {
      margin: 0;
    }
  }

  .variables-section {
    .variables-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;

      .variable-item {
        display: flex;
        gap: 8px;
        align-items: center;

        .variable-label {
          font-size: 13px;
          color: #595959;
          display: flex;
          align-items: center;
          white-space: nowrap;

          code {
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 3px;
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
    justify-content: flex-end;
    gap: 12px;
    border-radius: 4px;
    padding: 16px 0;
  }

  .result-section {
    .result-content {
      height: 300px;
      border-radius: 4px;
      overflow: hidden;
    }
  }
}
</style>
