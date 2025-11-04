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
      </a-space>
    </div>

    <LuaScriptEditor
      ref="luaEditorRef"
      v-model="scriptContent"
      height="300px"
      @blur="handleVariablesChange"
    />

    <!-- 动态参数组件 -->
    <div
      v-if="parsedVariables.length > 0"
      class="variables-section"
    >
      <CheckTest
        ref="checkTestRef"
        :query-params="queryParams"
        :history-params="historyParams"
        @update:data="handleParamsUpdate"
      >
        <template #sendOutButton>
          <a-space>
            <a-select
              v-model:value="outputType"
              :options="outputTypeEnum"
              style="width: 180px"
            />
            <a-button
              type="primary"
              :loading="executing"
              @click="handleExecute"
            >
              <template #icon>
                <AIcon type="PlayCircleOutlined" />
              </template>
              执行
            </a-button>
          </a-space>
        </template>
      </CheckTest>
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
import CheckTest from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/CheckTest/index.vue'
import { convertParamsToObject } from '../../components/utils'

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

const emit = defineEmits(['update:expression'])

const luaEditorRef = ref<InstanceType<typeof LuaScriptEditor>>()
const checkTestRef = ref<InstanceType<typeof CheckTest>>()

const outputTypeEnum = ref([
  { value: 'BOOLEAN', label: '布尔值 (BOOLEAN)' },
  { value: 'INTEGER', label: '整数 (INTEGER)' },
  { value: 'MULTI', label: '多项 (MULTI)' },
  { value: 'STATUS', label: '状态 (STATUS)' },
  { value: 'VALUE', label: '值 (VALUE)' },
  { value: 'OBJECT', label: '对象 (OBJECT)' }
])

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
const dynamicParams = ref<any>([])

// CheckTest 组件所需的参数
const outputType = ref('MULTI')
const queryParams = ref<Record<string, any>>({
  query: []
})
const historyParams = ref<Record<string, string>>({})

// 执行相关
const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
const resultJson = ref('')

// 变量自动提取（实时）
const handleVariablesChange = (variables: string[]) => {
  // 保留已有的变量值，添加新变量
  const newValues: Record<string, string> = {}
  variables.forEach((v) => {
    newValues[v] = variableValues.value[v] || ''
  })
  variableValues.value = newValues
  handleParseVariables()
}

// 处理动态参数更新
const handleParamsUpdate = (params: Array<{ name: string; value: string }>) => {
  dynamicParams.value = params
}

// 手动解析变量
const handleParseVariables = () => {
  if (!luaEditorRef.value) return
  const variables = luaEditorRef.value.extractVariables()
  parsedVariables.value = variables

  // 初始化变量值
  const newValues: Record<string, string> = {}
  const queryParamsArray: Array<{ key: string }> = []

  variables.forEach((v: any) => {
    newValues[v] = variableValues.value[v] || ''
    queryParamsArray.push({ key: v })
  })

  variableValues.value = newValues

  // 更新 queryParams 以匹配 CheckTest 组件的期望格式
  queryParams.value = {
    query: queryParamsArray
  }

  // 更新历史参数
  historyParams.value = { ...newValues }
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
  }
}

// 验证
const validateAll = async () => {
  if (!scriptContent.value.trim()) {
    onlyMessage('请输入 Lua 脚本', 'error')
    return false
  }

  emit(
    'update:expression',
    {
      script: scriptContent.value,
      outputType: outputType.value,
      provider: 'script'
    },
    JSON.parse(resultJson.value || '{}'),
    convertParamsToObject(dynamicParams.value)
  )
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

        // 初始化 queryParams 和 historyParams
        if (variables.length > 0) {
          const queryParamsArray: Array<{ key: string }> = []
          variables.forEach((v: any) => {
            queryParamsArray.push({ key: v })
          })
          queryParams.value = {
            query: queryParamsArray
          }
          historyParams.value = { ...variableValues.value }
        }
      }
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
    margin-top: 16px;
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
