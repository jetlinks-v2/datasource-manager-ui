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
    <div class="variables-section">
      <CheckTest
        ref="checkTestRef"
        :query-params="queryParams"
        :history-params="historyParams"
        :advanced-mode="isAdvancedMode"
        @update:data="handleParamsUpdate"
        @update:advanced-mode="handleAdvancedModeChange"
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
              :disabled="!scriptContent.length"
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
import MonacoEditor from '@jetlinks-web-core/components/MonacoEditor/monacoEditor.vue'
import CheckTest from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/CheckTest/index.vue'
import { convertParamsToObject } from '../../components/utils'
import { convertToTableTreeData, parseTableTreeToMetadata } from '../../utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'

interface Props {
  data?: {
    script?: string
    variables?: Record<string, string>
    outputType?: string
    argsValue?: Record<string, string>
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
const route = useRoute()
const typeId = route.query.typeId as string
const datasourceId = route.params.id as string

const luaEditorRef = ref<any>()
const checkTestRef = ref<any>()

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
const scriptContent = ref('')

// 变量相关
const parsedVariables = ref<string[]>([])
const dynamicParams = ref<any>([])
const inputParams = ref<any>([])

// CheckTest 组件所需的参数
const outputType = ref('MULTI')
const queryParams = ref<Record<string, any>>({
  query: []
})
const historyParams = ref<Record<string, string>>({})
const isAdvancedMode = ref(false)

// 执行相关
const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
const resultJson = ref('')

// 变量自动提取
const handleVariablesChange = (variables: string[]) => {
  parsedVariables.value = variables

  const queryParamsArray: Array<{ key: string }> = []

  variables.map((v: any) => {
    queryParamsArray.push({ key: v })
  })

  queryParams.value = {
    query: queryParamsArray
  }
}

// 处理动态参数更新
const handleParamsUpdate = (params: Array<{ name: string; value: string }>) => {
  dynamicParams.value = params
}

// 更新高级模式状态
const handleAdvancedModeChange = (value: boolean) => {
  isAdvancedMode.value = value
}

// 执行脚本
const handleExecute = async () => {
  executing.value = true
  hasResult.value = false

  inputParams.value = convertParamsToObject(dynamicParams.value || [])
  const input = parseTableTreeToMetadata(convertToTableTreeData(inputParams.value))

  try {
    const res = await queryDataSource(typeId, datasourceId, 'ExecuteScript', {
      script: scriptContent.value,
      outputType: outputType.value,
      executeType: 'DYNAMIC',
      input,
      argsValue: inputParams.value
    })

    if (res.success) {
      executionSuccess.value = true
      resultJson.value = JSON.stringify(res.result, null, 2)
      hasResult.value = true
    } else {
      executionSuccess.value = false
      resultJson.value = JSON.stringify(res.result, null, 2)
      hasResult.value = true
    }

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

    nextTick(() => {
      const modalBody = document.querySelector('.ant-modal-body')
      if (modalBody) {
        modalBody.scrollTop = modalBody.scrollHeight
      }
    })
  }
}

// 验证
const validateAll = async () => {
  if (!scriptContent.value.trim()) {
    onlyMessage('请输入 Lua 脚本', 'error')
    return false
  }

  if (!checkTestRef.value?.validateAll()) {
    onlyMessage('请检查动态参数', 'error')
    return false
  }

  emit(
    'update:expression',
    {
      script: scriptContent.value,
      outputType: outputType.value,
      provider: 'script',
      others: {
        isAdvancedMode: isAdvancedMode.value
      }
    },
    JSON.parse(resultJson.value || '{}'),
    convertParamsToObject(dynamicParams.value || [])
  )
  return true
}

watch(
  () => props.data?.outputType,
  (value) => {
    if (!value) return
    outputType.value = value
  },
  { immediate: true }
)

watch(
  () => props.data?.argsValue,
  (value) => {
    if (!value) return
    historyParams.value = value
  },
  { immediate: true, deep: true }
)

watch(
  () => props.data?.others?.isAdvancedMode,
  (value) => {
    if (value !== undefined) {
      isAdvancedMode.value = value
    }
  },
  { immediate: true }
)

watch(
  () => props.data?.script,
  (value) => {
    if (value && value !== scriptContent.value) {
      scriptContent.value = value || ''
    }

    nextTick(() => {
      try {
        const variables = luaEditorRef.value?.extractVariables?.() || []
        handleVariablesChange(variables)
      } catch (error) {
        console.error('解析脚本变量失败', error)
      }
    })
  },
  { immediate: true }
)

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
