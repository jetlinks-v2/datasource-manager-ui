<template>
  <div class="mongo-aggregate-query-container">
    <!-- 上部分：三列布局 - 集合列表、聚合阶段和编辑器 -->
    <div class="pipeline-section">
      <!-- 左侧：集合列表 -->
      <div class="collection-list-wrapper">
        <CollectionList
          ref="collectionListRef"
          :initialSelectedCollection="initialCollectionName"
          @click="selectCollection"
        >
          <template #header>
            <TitleComponent
              :data="$t('DataSource.MongoAggregate.100047-0')"
              :style="{ margin: 0 }"
            />
          </template>
        </CollectionList>
      </div>

      <!-- 中间：聚合阶段列表 -->
      <div class="pipeline-stages-wrapper">
        <PipelineStages
          ref="pipelineStagesRef"
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
        :advanced-mode="isAdvancedMode"
        @update:data="handleParamsUpdate"
        @update:advanced-mode="handleAdvancedModeChange"
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
            {{ $t('DataSource.MongoAggregate.100047-1') }}
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
          :data="$t('DataSource.MongoAggregate.100047-2')"
          class="section-title"
        />
        <div class="result-info">
          <a-tag :color="executionSuccess ? 'success' : 'error'">
            {{ executionSuccess ? $t('DataSource.MongoAggregate.100047-3') : $t('DataSource.MongoAggregate.100047-4') }}
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
import { onlyMessage } from '@jetlinks-web/utils'
import MonacoEditor from '@jetlinks-web-core/components/MonacoEditor/monacoEditor.vue'
import CheckTest from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/CheckTest/index.vue'
import CollectionList from '@datasource-manager-ui/views/DataSource/Detail/collection/components/CollectionList.vue'
import PipelineStages from './PipelineStages.vue'
import StageEditor from './StageEditor.vue'
import TitleComponent from '@jetlinks-web-core/components/TitleComponent/index.vue'
import { convertParamsToObject } from '../../../components/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import {
  type PipelineStage,
  collectAllVariables,
  validateStagesContent,
  parsePipelineString,
  buildPipelineString,
  createDefaultStage,
  checkAdvancedModeRequired
} from '../../utils/pipelineParser'
import { useI18n } from 'vue-i18n'

interface CollectionSchema {
  name: string
  fields: any[]
}

interface Props {
  data?: {
    collection?: string
    pipeline?: string
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
const { t: $t } = useI18n()

const checkTestRef = ref<any>()
const pipelineStagesRef = ref<any>()

const selectedCollection = ref('')
const initialCollectionName = ref('')

const pipelineStages = ref<PipelineStage[]>([])
const currentStageIndex = ref<number | null>(null)
const currentStage = computed(() => {
  if (currentStageIndex.value !== null && pipelineStages.value[currentStageIndex.value]) {
    return pipelineStages.value[currentStageIndex.value]
  }
  return null
})

const dynamicParams = ref<any>([])
const queryParams = ref<Record<string, any>>({ query: [] })
const historyParams = ref<Record<string, string>>({})
const isAdvancedMode = ref(false)

const executing = ref(false)
const hasResult = ref(false)
const executionSuccess = ref(false)
const resultJson = ref('')

const handleAddStage = () => {
  const newStage = createDefaultStage('$match')
  pipelineStages.value.push(newStage)
  currentStageIndex.value = pipelineStages.value.length - 1
  // 添加阶段后重新收集动态参数
  updateQueryParams()
}

const handleRemoveStage = (index: number) => {
  // 至少保留一个阶段
  if (pipelineStages.value.length <= 1) {
    onlyMessage($t('DataSource.MongoAggregate.100047-5'), 'warning')
    return
  }

  pipelineStages.value.splice(index, 1)
  if (currentStageIndex.value === index) {
    currentStageIndex.value = pipelineStages.value.length > 0 ? 0 : null
  } else if (currentStageIndex.value !== null && currentStageIndex.value > index) {
    currentStageIndex.value--
  }
  // 删除阶段后重新收集动态参数
  updateQueryParams()
}

const selectStage = (index: number) => {
  currentStageIndex.value = index
}

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

const handleStageTypeChange = (type: string) => {
  if (currentStage.value) {
    const newStage = createDefaultStage(type)
    currentStage.value.type = newStage.type
    currentStage.value.body = newStage.body
  }
  // 类型改变后重新收集动态参数
  updateQueryParams()
}

// 阶段内容改变
const handleBodyChange = (body: string) => {
  if (currentStage.value) {
    currentStage.value.body = body
  }
  // 内容改变后，重新收集所有阶段的动态参数
  updateQueryParams()
}

// 更新查询参数（收集所有阶段的动态参数）
const updateQueryParams = () => {
  const allVariables = collectAllVariables(pipelineStages.value)
  queryParams.value = {
    query: allVariables.map((param) => ({ key: param }))
  }
}

// 处理变量变化（当前阶段的变量变化）
const handleVariablesChange = () => {
  // 重新收集所有阶段的变量
  updateQueryParams()
}

// 选择集合
const selectCollection = (data: { clickItem: CollectionSchema }) => {
  selectedCollection.value = data.clickItem.name
}

// 更新动态参数
const handleParamsUpdate = (params: Array<{ name: string; value: any }>) => {
  dynamicParams.value = params
}

// 更新高级模式状态
const handleAdvancedModeChange = (value: boolean) => {
  isAdvancedMode.value = value
}

// 注：解析和验证逻辑已移至 utils/pipelineParser.ts

const handleExecute = async () => {
  if (!selectedCollection.value) {
    onlyMessage($t('DataSource.MongoAggregate.100047-6'), 'error')
    return
  }

  if (pipelineStages.value.length === 0) {
    onlyMessage($t('DataSource.MongoAggregate.100047-7'), 'error')
    return
  }

  // 验证阶段内容
  const validation = validateStagesContent(pipelineStages.value)
  if (!validation.valid) {
    onlyMessage(validation.errorMessage, 'error')
    // 定位到错误的阶段并滚动
    currentStageIndex.value = validation.errorIndex
    nextTick(() => {
      pipelineStagesRef.value?.scrollToStage(validation.errorIndex)
    })
    return
  }

  // 检查是否需要高级模式
  const advancedCheck = checkAdvancedModeRequired(pipelineStages.value)
  if (advancedCheck.required && !isAdvancedMode.value) {
    onlyMessage($t('DataSource.MongoAggregate.100047-8', { reason: advancedCheck.reason }), 'warning')
    return
  }

  executing.value = true
  hasResult.value = false

  try {
    // 构建 pipeline 字符串
    const pipelineString = buildPipelineString(pipelineStages.value)
    // 转换动态参数
    const argsValue = convertParamsToObject(dynamicParams.value || [])

    const res = await queryDataSource(typeId, datasourceId, 'AggregateQuery', {
      collection: selectedCollection.value,
      pipeline: pipelineString,
      executeType: 'DYNAMIC',
      argsValue
    })

    executionSuccess.value = res.success
    resultJson.value = JSON.stringify(res.result, null, 2)
    hasResult.value = true

    if (res.success) {
      nextTick(() => {
        onlyMessage($t('DataSource.MongoAggregate.100047-9'))
        const modalBody = document.querySelector('.ant-modal-body')
        if (modalBody) {
          modalBody.scrollTop = modalBody.scrollHeight
        }
      })
    }
  } catch (error: any) {
    executionSuccess.value = false
    resultJson.value = JSON.stringify(
      {
        success: false,
        error: error.message || $t('DataSource.MongoAggregate.100047-10'),
        timestamp: Date.now()
      },
      null,
      2
    )
    hasResult.value = true
    onlyMessage(error.message || $t('DataSource.MongoAggregate.100047-10'), 'error')
  } finally {
    executing.value = false
  }
}

const validateAll = async () => {
  if (!selectedCollection.value) {
    onlyMessage($t('DataSource.MongoAggregate.100047-6'), 'error')
    return false
  }

  if (pipelineStages.value.length === 0) {
    onlyMessage($t('DataSource.MongoAggregate.100047-7'), 'error')
    return false
  }

  // 验证阶段内容
  const validation = validateStagesContent(pipelineStages.value)
  if (!validation.valid) {
    onlyMessage(validation.errorMessage, 'error')
    // 定位到错误的阶段并滚动
    currentStageIndex.value = validation.errorIndex
    nextTick(() => {
      pipelineStagesRef.value?.scrollToStage(validation.errorIndex)
    })
    return false
  }

  if (!checkTestRef.value.validateAll()) {
    onlyMessage($t('DataSource.MongoAggregate.100047-11'), 'error')
    return false
  }

  // 构建 pipeline 字符串
  const pipelineString = buildPipelineString(pipelineStages.value)

  // 构建 output（从执行结果中解析）
  let outputData: any[] = []
  if (resultJson.value && executionSuccess.value) {
    try {
      const result = JSON.parse(resultJson.value)
      if (Array.isArray(result) && result.length > 0) {
        outputData = JSON.parse(resultJson.value)
      }
    } catch {}
  }

  // 转换动态参数为 argsValue 格式
  const argsValue = convertParamsToObject(dynamicParams.value || [])

  emit(
    'update:expression',
    {
      collection: selectedCollection.value,
      pipeline: pipelineString,
      provider: 'pipeline',
      argsValue,
      others: {
        isAdvancedMode: isAdvancedMode.value
      }
    },
    outputData,
    argsValue
  )
  return true
}

watch(
  () => props.data,
  (value) => {
    if (value && Object.keys(value).length > 0) {
      // 回显集合名称
      if (value.collection) {
        initialCollectionName.value = value.collection
        selectedCollection.value = value.collection
      }

      // 回显管道阶段
      if (value.pipeline) {
        try {
          const parsedStages = parsePipelineString(value.pipeline)

          if (parsedStages.length > 0) {
            pipelineStages.value = parsedStages
            currentStageIndex.value = 0
            // 回显后收集所有阶段的动态参数
            nextTick(() => {
              updateQueryParams()
            })
            return
          }
        } catch (error) {
          console.error('解析 pipeline 失败:', error)
        }
      }
    }

    // 初始化默认阶段
    if (pipelineStages.value.length === 0) {
      pipelineStages.value = [createDefaultStage('$match')]
      currentStageIndex.value = 0
      // 初始化后收集动态参数
      nextTick(() => {
        updateQueryParams()
      })
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

watch(
  () => props.data?.others?.isAdvancedMode,
  (value) => {
    if (value !== undefined) {
      isAdvancedMode.value = value
    }
  },
  { immediate: true }
)

// Refs
const collectionListRef = ref<any>()

// 对外暴露的方法
const getSelectedCollection = () => selectedCollection.value

const setSelectedCollection = (collectionName: string) => {
  if (!collectionName || collectionName === selectedCollection.value) return

  selectedCollection.value = collectionName
  collectionListRef.value?.setSelectedCollection(collectionName)
}

defineExpose({
  validateAll,
  getSelectedCollection,
  setSelectedCollection
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

    .collection-list-wrapper {
      width: 250px;
      flex: 0 0 250px;
      height: 100%;
    }

    .pipeline-stages-wrapper {
      width: 250px;
      flex: 0 0 250px;
      height: 100%;
      border-left: 1px solid #eee;
      padding-left: 12px;
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
