<template>
  <a-modal
    open
    :title="modalTitle"
    centered
    :mask-closable="false"
    :destroy-on-close="true"
    :width="modalWidth"
    :body-style="modalBodyStyle"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      layout="vertical"
    >
      <!-- 步骤条 -->
      <a-steps
        :current="currentStep"
        class="steps-container"
      >
        <a-step :title="$t('DataSource.AddData.100016-2')" />
        <a-step :title="$t('DataSource.AddData.100016-3')" />
      </a-steps>

      <!-- 步骤内容 -->
      <div v-show="currentStep === STEP_CONFIG.DETAIL">
        <component
          :is="currentComponent"
          ref="componentRef"
          :is-edit="isEdit"
          :form-ref="formRef"
          :data="formData.configuration"
          @update:expression="handleExpressionUpdate"
          @update:configuration="handleConfigUpdate"
        />
      </div>

      <div v-show="currentStep === STEP_CONFIG.COMMAND">
        <BasicForm
          ref="basicFormRef"
          :model-value="formData"
          :test-data="testDataSource"
          :dynamic-params="dynamicParams"
          :is-edit="isEdit"
          :source-classify="sourceClassify"
          @update="handleFormUpdate"
        />
      </div>
    </a-form>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="footer-wrapper">
        <a-button
          v-if="currentStep > STEP_CONFIG.DETAIL"
          class="prev-btn"
          @click="handlePrevStep"
        >
          {{ $t('DataSource.SourceAdd.100005-11') }}
        </a-button>

        <a-button
          v-if="currentStep < STEP_CONFIG.COMMAND"
          type="primary"
          :loading="loading"
          @click="handleNextStep"
        >
          {{ $t('DataSource.TypeAdd.100004-2') }}
        </a-button>

        <a-button
          v-else
          type="primary"
          :loading="loading"
          @click="handleSave"
        >
          {{ $t('DataSource.AddData.100016-4') }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { Modal } from 'ant-design-vue'
import { isArray, isObject, omit } from 'lodash-es'

import RdbDatasourceQuery from './RdbDatasourceQuery/index.vue'
import ApiSend from './ApiSend/index.vue'
import BasicForm from './components/BasicForm.vue'
import WebSocketSend from './WebSocketSend/index.vue'
import EsDatasourceQuery from './EsDatasourceQuery/index.vue'
import RedisDatasourceQuery from './RedisDatasourceQuery/index.vue'
import MongoDatasourceQuery from './MongoDatasourceQuery/index.vue'

import { addDataSourceCommand, editDataSourceCommand } from '@datasource-manager-ui/api/data/datasource'
import { parseTableTreeToMetadata, metadataConvertToTableTree, convertToTableTreeData } from './utils'
import { transformArray } from './components/utils'

import type { TypeId } from '../../type'
import { DATA_TYPE_ITEM } from '../../../components/table'
import type { FormData, QueryParam, OutputConfig, ApiMethod } from './type'
import { onlyMessage } from '@jetlinks-web/utils'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
interface Props {
  data?: Record<string, any>
  info?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
  info: () => ({})
})

const emit = defineEmits<{
  cancel: []
  ok: [id: string]
}>()

// 常量定义
const STEP_CONFIG = {
  DETAIL: 0 as number,
  COMMAND: 1 as number
}

const PROVIDER_TYPE = {
  DEFINITION: 'definition',
  EXPRESSION: 'expression',
  GENERAL_QUERY: 'generalQuery',
  PIPELINE: 'pipeline'
} as const

const route = useRoute()
const formRef = ref()
const componentRef = ref()
const basicFormRef = ref()

const currentStep = ref(STEP_CONFIG.DETAIL)
const loading = ref(false)
const testDataSource = ref<any>()
const dynamicParams = ref<any[]>([])

const formData = reactive<FormData>({
  id: props.data?.id,
  dataSourceId: props.info.id,
  support: '',
  name: '',
  dataSourceTypeId: route.query.typeId as string,
  description: '',
  configuration: {
    output: {},
    input: [],
    defaultParams: {},
    expression: {
      uri: { url: '' },
      method: 'GET',
      body: { contentType: '', content: '' },
      queryParams: [],
      headers: []
    }
  }
})

const COMPONENT_MAP = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: RdbDatasourceQuery,
  [DATA_TYPE_ITEM.API_SEND]: ApiSend,
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: WebSocketSend,
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: EsDatasourceQuery,
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: RedisDatasourceQuery,
  [DATA_TYPE_ITEM.MONGODB_DATASOURCE]: MongoDatasourceQuery
} as const

const isEdit = computed(() => !!props.data?.id)
const sourceClassify = computed(() => route.query.typeId as TypeId)
const currentComponent = computed(() => COMPONENT_MAP[sourceClassify.value])

const modalTitle = computed(() =>
  isEdit.value ? $t('DataSource.AddData.100016-0') : $t('DataSource.AddData.100016-1')
)
const modalWidth = computed(() => {
  if (currentStep.value !== STEP_CONFIG.COMMAND) {
    return '1200px'
  }

  const narrowWidthTypes = [DATA_TYPE_ITEM.RDB_DATASOURCE, DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE] as TypeId[]

  return narrowWidthTypes.includes(sourceClassify.value) ||
    formData.configuration.provider === PROVIDER_TYPE.GENERAL_QUERY
    ? '800px'
    : '1200px'
})

const modalBodyStyle = computed(() => ({
  maxHeight: '80vh',
  overflowY: 'auto' as any,
  paddingRight: '8px',
  marginRight: '-8px'
}))

const handleCancel = () => {
  emit('cancel')
}

const handleExpressionUpdate = (expression: any, testData: any, dynamicParamsData: any) => {
  testDataSource.value = convertToTableTreeData(testData)
  dynamicParams.value = convertToTableTreeData(dynamicParamsData)

  if (
    sourceClassify.value === DATA_TYPE_ITEM.REDIS_DATASOURCE ||
    sourceClassify.value === DATA_TYPE_ITEM.MONGODB_DATASOURCE
  ) {
    formData.configuration = expression
    return
  }
  const _expression = omit(expression, 'others') as FormData['configuration']['expression']

  formData.configuration = {
    ...formData.configuration,
    expression: _expression,
    defaultParams: dynamicParamsData,
    others: expression.others
  }
}

const handleConfigUpdate = (config: any) => {
  switch (sourceClassify.value) {
    case DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE:
      formData.configuration = {
        ...formData.configuration,
        elasticsearchConfig: config
      }
      break
    case DATA_TYPE_ITEM.RDB_DATASOURCE:
      formData.configuration = {
        ...formData.configuration,
        rdbDefinition: config
      }
      break
    case DATA_TYPE_ITEM.REDIS_DATASOURCE:
      formData.configuration = {
        ...formData.configuration,
        ...config
      }
      break
    default:
      break
  }
}

const handleFormUpdate = (newData: Partial<FormData>) => {
  Object.assign(formData, newData)
}

// 统一错误处理
const handleError = (error: any, defaultMessage: string) => {
  console.error(defaultMessage, error)
  const message = error?.message || error?.errorFields?.[0]?.errors?.[0] || defaultMessage
  onlyMessage(message, 'error')
}

const handleNextStep = async () => {
  try {
    loading.value = true
    const isValid = await componentRef.value?.validateAll()
    if (!isValid) return

    currentStep.value++
    scrollToTop()
  } catch (error) {
    handleError(error, $t('DataSource.AddData.100016-10'))
  } finally {
    loading.value = false
  }
}

const handlePrevStep = () => {
  currentStep.value--
  scrollToTop()
}

// 验证表单
const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch (error: unknown) {
    handleError(error, '表单验证失败')
    return false
  }
}

// 公共验证逻辑
const validateFormAndComponent = async (): Promise<boolean> => {
  return (await validateForm()) && (await componentRef.value?.validateAll())
}

// 保存数据源
const saveDataSource = async (params: FormData): Promise<void> => {
  const api = isEdit.value ? editDataSourceCommand : addDataSourceCommand
  const response = await api(params)

  if (!response.success) {
    throw new Error(isEdit.value ? $t('DataSource.AddData.100016-8') : $t('DataSource.AddData.100016-9'))
  }

  onlyMessage(isEdit.value ? $t('DataSource.AddData.100016-6') : $t('DataSource.AddData.100016-7'))
  const savedId = isEdit.value ? formData.id : response.result?.id || response.result
  emit('ok', savedId)
  emit('cancel')
}

// 确认保存无输出配置
const confirmSaveWithoutOutput = (params: FormData): Promise<boolean> => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: $t('DataSource.DataList.100014-2'),
      content: $t('DataSource.AddData.100016-5'),
      cancelText: $t('DataSource.SourceAdd.100005-12'),
      okText: $t('DataSource.SourceAdd.100005-13'),
      onOk: async () => {
        await saveDataSource(params)
        resolve(true)
      },
      onCancel: () => resolve(false)
    })
  })
}

// 构建输出配置
const buildOutputConfig = (output: unknown, isArray: boolean): OutputConfig => {
  const baseConfig = {
    name: isArray ? $t('DataSource.AddData.100016-11') : $t('DataSource.AddData.100016-12'),
    id: isArray ? 'array' : 'object',
    type: (isArray ? 'array' : 'object') as 'array' | 'object'
  }

  if (isArray) {
    return {
      ...baseConfig,
      elementType: {
        type: 'object',
        properties: parseTableTreeToMetadata(output as unknown[])
      }
    } as OutputConfig
  }

  return {
    ...baseConfig,
    properties: parseTableTreeToMetadata(output as unknown[])
  } as OutputConfig
}

// 构建表达式
const buildExpression = (expression?: any): any => {
  if (!expression) {
    return {
      uri: { url: '' },
      queryParams: [],
      headers: []
    }
  }

  const { queryParams, headers, uri, message, method } = expression

  const baseExpression: FormData['configuration']['expression'] = {
    queryParams: transformArray(queryParams) as QueryParam[],
    headers: transformArray(headers) as QueryParam[],
    uri: {
      url: sourceClassify.value === DATA_TYPE_ITEM.API_SEND ? uri.url.split('?')[0] : uri.url
    }
  }

  // WebSocket 添加 message
  if (sourceClassify.value === DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE) {
    baseExpression.message = message || {}
  }

  // API 添加 method 和 body
  if (sourceClassify.value === DATA_TYPE_ITEM.API_SEND) {
    baseExpression.method = method as ApiMethod
    baseExpression.body = expression.body
  }

  return baseExpression
}

// 构建数据源参数
const buildDataSourceParams = (formDataValue: FormData): FormData => {
  const isDataSourceArray = isEdit.value
    ? props.data?.configuration?.output?.type === 'array'
    : isArray(testDataSource.value)

  const { expression, input, output } = formDataValue.configuration

  // 构建表达式配置
  const baseExpression = buildExpression(expression)

  // 构建输出配置
  const outputConfig = buildOutputConfig(output, isDataSourceArray)

  return {
    ...formDataValue,
    configuration: {
      ...formDataValue.configuration,
      expression: baseExpression,
      input: parseTableTreeToMetadata(input as any[]),
      output: outputConfig,
      provider: PROVIDER_TYPE.EXPRESSION
    }
  }
}

// 保存带输入输出的数据源（Redis和MongoDB公共逻辑）
const saveDataSourceWithInputOutput = async (): Promise<void> => {
  if (!(await validateFormAndComponent())) return

  const formDataFromRef = (await basicFormRef.value?.getFormData()) as FormData | undefined
  if (!formDataFromRef) return

  // 如果provider是generalQuery，直接保存，排除input和output字段
  if (formDataFromRef.configuration?.provider === PROVIDER_TYPE.GENERAL_QUERY) {
    const { input, output, ...restConfiguration } = formDataFromRef.configuration
    const params: FormData = {
      ...formDataFromRef,
      configuration: restConfiguration
    }
    await saveDataSource(params)
    return
  }

  const { input, output } = formDataFromRef.configuration
  const inputConfig = parseTableTreeToMetadata(input as any[])
  // 构建输出配置(固定为数组)
  const outputConfig = buildOutputConfig(output, true)

  const params: FormData = {
    ...formDataFromRef,
    configuration: {
      ...formDataFromRef.configuration,
      input: inputConfig,
      output: outputConfig
    }
  }

  // 检查输出配置
  const outputArray = formDataFromRef.configuration.output as any[]
  if (!outputArray?.length) {
    await confirmSaveWithoutOutput(params)
  } else {
    await saveDataSource(params)
  }
}

// 保存 RDB 数据源
const saveRdbDataSource = async (): Promise<void> => {
  if (!(await validateFormAndComponent())) return

  await saveDataSource({
    ...formData,
    configuration: {
      rdbDefinition: formData.configuration.rdbDefinition,
      provider: PROVIDER_TYPE.DEFINITION
    }
  })
}

// 保存 ES 数据源
const saveEsDataSource = async (): Promise<void> => {
  if (!(await validateFormAndComponent())) return

  await saveDataSource({
    ...formData,
    configuration: {
      elasticsearchConfig: formData.configuration.elasticsearchConfig
    }
  })
}

// 保存 Redis 数据源
const saveRedisDataSource = async () => {
  await saveDataSourceWithInputOutput()
}

// 保存 MongoDB 数据源
const saveMongoDataSource = async () => {
  await saveDataSourceWithInputOutput()
}

// 保存通用数据源
const saveCommonDataSource = async (): Promise<void> => {
  const isFormValid = await validateForm()
  if (!isFormValid) return

  const formDataFromRef = (await basicFormRef.value?.getFormData()) as FormData | undefined
  if (!formDataFromRef) return

  const params = buildDataSourceParams(formDataFromRef)

  // 检查输出配置
  const outputArray = formDataFromRef.configuration.output as unknown[]
  if (!outputArray?.length) {
    await confirmSaveWithoutOutput(params)
  } else {
    await saveDataSource(params)
  }
}

// 保存策略映射
const SAVE_HANDLERS: Record<TypeId, () => Promise<void>> = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: saveRdbDataSource,
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: saveEsDataSource,
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: saveRedisDataSource,
  [DATA_TYPE_ITEM.MONGODB_DATASOURCE]: saveMongoDataSource,
  [DATA_TYPE_ITEM.API_SEND]: saveCommonDataSource,
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: saveCommonDataSource
}

const handleSave = async () => {
  try {
    loading.value = true
    const handler = SAVE_HANDLERS[sourceClassify.value]
    if (handler) {
      await handler()
    }
  } catch (error: unknown) {
    handleError(error, '操作失败')
  } finally {
    loading.value = false
  }
}

// 滚动到顶部
const scrollToTop = () => {
  nextTick(() => {
    const modalBody = document.querySelector('.ant-modal-body')
    if (modalBody) {
      modalBody.scrollTop = 0
    }
  })
}

// API 类型
const handleApiSendInit = (data: FormData) => {
  const { expression } = data.configuration
  if (!expression) return

  const { queryParams, headers, uri } = expression

  formData.configuration.expression = {
    ...expression,
    queryParams: transformExpressionParams(queryParams),
    headers: transformExpressionParams(headers)
  }

  if (uri?.url) {
    const baseUrl = uri.url.split('?')[0]
    const queryString = buildQueryString(formData.configuration.expression?.queryParams as QueryParam[])
    if (formData.configuration.expression) {
      formData.configuration.expression.uri.url = queryString ? `${baseUrl}?${queryString}` : baseUrl
    }
  }

  processInputOutput(data)
}

// WebSocket 类型
const handleWebSocketInit = (data: FormData) => {
  const { expression } = data.configuration
  if (!expression) return

  const { queryParams, headers, message } = expression

  formData.configuration.expression = {
    ...expression,
    queryParams: transformExpressionParams(queryParams),
    headers: transformExpressionParams(headers),
    message: message || {}
  }
  processInputOutput(data)
}

// RDB 类型
const handleRdbInit = (data: FormData) => {
  formData.configuration = data.configuration || {}
}

// ES 类型
const handleEsInit = (data: FormData) => {
  formData.configuration = data.configuration || {}
}

// Redis 类型
const handleRedisInit = (data: FormData) => {
  formData.configuration = data.configuration || {}
  processInputOutput(data)
}

// MongoDB 类型
const handleMongoInit = (data: FormData) => {
  formData.configuration = data.configuration || {}
  processInputOutput(data)
}

// 数据源初始化处理器映射
const DATA_SOURCE_INIT_HANDLERS: Record<string, (data: FormData) => void> = {
  [DATA_TYPE_ITEM.API_SEND]: handleApiSendInit,
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: handleWebSocketInit,
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: handleRdbInit,
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: handleEsInit,
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: handleRedisInit,
  [DATA_TYPE_ITEM.MONGODB_DATASOURCE]: handleMongoInit
}

// 初始化数据
const initializeFormData = () => {
  if (!Object.keys(props.data || {}).length) return

  // 合并表单数据
  mergeFormData(props.data)

  const handler = DATA_SOURCE_INIT_HANDLERS[sourceClassify.value]
  handler?.(props.data as FormData)
}

// 合并表单数据
const mergeFormData = (data: any) => {
  Object.keys(formData).forEach((key) => {
    if (!(key in data)) return

    const value = data[key]
    const currentValue = (formData as any)[key]

    if (isObject(currentValue) && !isArray(currentValue) && isObject(value)) {
      Object.assign(currentValue, value)
    } else {
      ;(formData as any)[key] = value
    }
  })
}

// 处理表达式参数转换
const transformExpressionParams = (params: any[] = []) => {
  return params.map((item) => ({
    ...item,
    key: item.key?.value ?? item.key,
    value: item.value?.value ?? item.value
  }))
}

// 处理输入输出配置
const processInputOutput = (data: any) => {
  const { input, output } = data.configuration

  if (input) {
    dynamicParams.value = metadataConvertToTableTree(input, 'dataType')
  }

  if (output?.type === 'array') {
    testDataSource.value = metadataConvertToTableTree(output.elementType?.properties, 'dataType')
  } else if (output?.type === 'object') {
    testDataSource.value = metadataConvertToTableTree(output.properties, 'dataType')
  }
}

// 构建查询字符串
const buildQueryString = (queryParams: any[] = []) => {
  return queryParams
    .filter((item) => item.enable !== false)
    .map((item) => `${item.key}=${item.value}`)
    .join('&')
}

onMounted(() => {
  if (isEdit.value) {
    currentStep.value = STEP_CONFIG.COMMAND
  }

  initializeFormData()
})
</script>

<style scoped lang="less">
.steps-container {
  width: 70%;
  margin: 0 auto 24px;
}

.footer-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  gap: 8px;

  .prev-btn {
    margin-right: auto;
  }
}

:deep(.ant-modal-body) {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
}
</style>
