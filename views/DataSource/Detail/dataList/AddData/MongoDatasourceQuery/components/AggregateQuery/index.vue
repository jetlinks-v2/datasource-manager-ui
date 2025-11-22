<template>
  <div class="mongo-aggregate-query-container">
    <!-- 上部分：聚合阶段和编辑器 -->
    <div class="pipeline-section">
      <!-- 左侧：聚合阶段列表 -->
      <div class="pipeline-stages-wrapper">
        <PipelineStages
          :stages="pipelineStages"
          :current-index="currentStageIndex"
          :max-stages-reached="pipelineStages.length >= 20"
          @add="handleAddStage"
          @remove="handleRemoveStage"
          @select="selectStage"
          @reorder="handleReorder"
        />
      </div>

      <!-- 右侧：阶段编辑器 -->
      <div class="stage-editor-wrapper">
        <StageEditor
          :stage="currentStage"
          @update:type="handleStageTypeChange"
          @update:body="handleBodyChange"
          @variables-change="handleVariablesChange"
        />
      </div>
    </div>

    <!-- 下部分：动态参数 -->
    <div class="params-section">
      <CheckTest
        ref="checkTestRef"
        :query-params="queryParams"
        :history-params="historyParams"
        @update:data="handleParamsUpdate"
      >
        <template #sendOutButton>
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

<script setup lang="ts">
import { onlyMessage, randomString } from '@jetlinks-web/utils'
import MonacoEditor from '@/components/MonacoEditor/monacoEditor.vue'
import CheckTest from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/CheckTest/index.vue'
import PipelineStages from './PipelineStages.vue'
import StageEditor from './StageEditor.vue'
import TitleComponent from '@/components/TitleComponent/index.vue'
import { convertParamsToObject } from '../../../components/utils'
import { convertToTableTreeData, parseTableTreeToMetadata } from '../../../utils'
import { queryDataSource } from '@/modules/datasource-manager-ui/api/data/datasource'

interface PipelineStage {
  id: string
  type: string
  body: string
}

interface Props {
  data?: {
    collection?: string
    pipeline?: PipelineStage[]
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

const checkTestRef = ref<any>()

// 聚合管道
const pipelineStages = ref<PipelineStage[]>([])
const currentStageIndex = ref<number | null>(null)
const currentStage = computed(() => {
  if (currentStageIndex.value !== null && pipelineStages.value[currentStageIndex.value]) {
    return pipelineStages.value[currentStageIndex.value]
  }
  return null
})

// 动态参数
const parsedParams = ref<string[]>([])
const dynamicParams = ref<any>([])
const inputParams = ref<any>({})
const queryParams = ref<Record<string, any>>({
  query: []
})
const historyParams = ref<Record<string, string>>({})

// 执行相关
const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
const resultJson = ref('')

// 添加阶段
const handleAddStage = () => {
  const newStage: PipelineStage = {
    id: randomString(8),
    type: '$match',
    body: '{}'
  }
  pipelineStages.value.push(newStage)
  currentStageIndex.value = pipelineStages.value.length - 1
}

// 移除阶段
const handleRemoveStage = (index: number) => {
  // 至少保留一个阶段
  if (pipelineStages.value.length <= 1) {
    onlyMessage('至少需要保留一个阶段', 'warning')
    return
  }

  pipelineStages.value.splice(index, 1)
  if (currentStageIndex.value === index) {
    currentStageIndex.value = pipelineStages.value.length > 0 ? 0 : null
  } else if (currentStageIndex.value !== null && currentStageIndex.value > index) {
    currentStageIndex.value--
  }
}

// 选择阶段
const selectStage = (index: number) => {
  currentStageIndex.value = index
}

// 重新排序
const handleReorder = (fromIndex: number, toIndex: number) => {
  const item = pipelineStages.value[fromIndex]
  pipelineStages.value.splice(fromIndex, 1)
  pipelineStages.value.splice(toIndex, 0, item)

  // 更新当前选中的索引
  if (currentStageIndex.value === fromIndex) {
    currentStageIndex.value = toIndex
  } else if (fromIndex < toIndex && currentStageIndex.value !== null) {
    if (currentStageIndex.value > fromIndex && currentStageIndex.value <= toIndex) {
      currentStageIndex.value--
    }
  } else if (fromIndex > toIndex && currentStageIndex.value !== null) {
    if (currentStageIndex.value >= toIndex && currentStageIndex.value < fromIndex) {
      currentStageIndex.value++
    }
  }
}

// 阶段类型改变
const handleStageTypeChange = (type: string) => {
  if (currentStage.value) {
    currentStage.value.type = type
    currentStage.value.body = getDefaultBody(type)
  }
}

// 阶段内容改变
const handleBodyChange = (body: string) => {
  if (currentStage.value) {
    currentStage.value.body = body
  }
}

// 处理变量变化
const handleVariablesChange = (variables: string[]) => {
  parsedParams.value = variables

  const queryParamsArray: Array<{ key: string }> = []
  variables.forEach((param) => {
    queryParamsArray.push({ key: param })
  })

  queryParams.value = {
    query: queryParamsArray
  }
}

// 获取默认内容
const getDefaultBody = (type: string): string => {
  return '{}'
}

const handleParamsUpdate = (params: Array<{ name: string; value: string }>) => {
  dynamicParams.value = params
}

const handleExecute = async () => {
  if (pipelineStages.value.length === 0) {
    onlyMessage('请至少添加一个聚合阶段', 'error')
    return
  }

  executing.value = true
  hasResult.value = false

  try {
    inputParams.value = convertParamsToObject(dynamicParams.value || [])

    const pipelineArray = pipelineStages.value.map((stage) => {
      const bodyWithParams = stage.body.replace(/\$\{(\w+)\}/g, (_, key) => {
        const value = inputParams.value[key]
        return typeof value === 'number' ? String(value) : `"${value}"`
      })
      return { [stage.type]: JSON.parse(bodyWithParams) }
    })

    const input = parseTableTreeToMetadata(convertToTableTreeData(inputParams.value))

    const res = await queryDataSource(typeId, datasourceId, 'AggregateQuery', {
      pipeline: pipelineArray,
      input,
      argsValue: inputParams.value
    })

    executionSuccess.value = res.success
    resultJson.value = JSON.stringify(res.result, null, 2)
    hasResult.value = true

    if (res.success) {
      onlyMessage('聚合执行成功')
    }
  } catch (error: any) {
    executionSuccess.value = false
    resultJson.value = JSON.stringify(
      {
        success: false,
        error: error.message || '聚合执行失败',
        timestamp: Date.now()
      },
      null,
      2
    )
    hasResult.value = true
    onlyMessage(error.message || '聚合执行失败', 'error')
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

const validateAll = async () => {
  if (pipelineStages.value.length === 0) {
    onlyMessage('请至少添加一个聚合阶段', 'error')
    return false
  }

  for (const stage of pipelineStages.value) {
    try {
      JSON.parse(stage.body)
    } catch (error) {
      onlyMessage(`阶段 ${stage.type} 的 JSON 格式错误`, 'error')
      return false
    }
  }

  const pipelineArray = pipelineStages.value.map((stage) => ({
    [stage.type]: JSON.parse(stage.body)
  }))

  const input = parseTableTreeToMetadata(convertToTableTreeData(inputParams.value))

  emit(
    'update:expression',
    {
      pipeline: JSON.stringify(pipelineArray),
      input,
      provider: 'pipeline'
    },
    JSON.parse(resultJson.value || '{}'),
    inputParams.value
  )
  return true
}

watch(
  () => props.data,
  (value) => {
    if (value && Object.keys(value).length > 0) {
      if (value.pipeline) {
        try {
          let pipelineData = value.pipeline
          if (typeof pipelineData === 'string') {
            pipelineData = JSON.parse(pipelineData)
          }

          if (Array.isArray(pipelineData)) {
            pipelineStages.value = pipelineData.map((stageObj: any) => {
              const stageType = Object.keys(stageObj)[0]
              const stageBody = stageObj[stageType]
              return {
                id: randomString(8),
                type: stageType,
                body: JSON.stringify(stageBody, null, 2)
              }
            })
            if (pipelineStages.value.length > 0) {
              currentStageIndex.value = 0
            }
          }
        } catch (error) {
          console.error('解析 pipeline 失败', error)
        }
      }
    }

    if (pipelineStages.value.length === 0) {
      pipelineStages.value = [
        {
          id: randomString(8),
          type: '$match',
          body: '{}'
        }
      ]
      currentStageIndex.value = 0
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.data?.argsValue,
  (value) => {
    if (!value) return
    historyParams.value = value
  },
  { immediate: true, deep: true }
)

// 组件挂载时确保至少有一个阶段
onMounted(() => {
  if (pipelineStages.value.length === 0) {
    pipelineStages.value = [
      {
        id: randomString(8),
        type: '$match',
        body: '{}'
      }
    ]
    currentStageIndex.value = 0
  }
})

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.mongo-aggregate-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .section-title {
      margin: 0;
    }

    .result-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .pipeline-section {
    display: flex;
    height: 400px;
    margin-bottom: 12px;
    gap: 4px;

    .pipeline-stages-wrapper {
      width: 250px;
      flex: 0 0 250px;
      height: 100%;
    }

    .stage-editor-wrapper {
      flex: 1;
      height: 100%;
      min-width: 0;
    }
  }

  .params-section {
    margin-bottom: 16px;
  }

  .result-section {
    margin-bottom: 16px;

    .result-content {
      height: 320px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      overflow: hidden;
    }
  }
}
</style>
