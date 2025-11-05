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
        <a-step title="详细配置" />
        <a-step title="命令生成" />
      </a-steps>

      <!-- 步骤内容 -->
      <div v-show="currentStep === 0">
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

      <div v-show="currentStep === 1">
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
          v-if="currentStep > 0"
          class="prev-btn"
          @click="handlePrevStep"
        >
          上一步
        </a-button>

        <a-button
          v-if="currentStep < 1"
          type="primary"
          :loading="loading"
          @click="handleNextStep"
        >
          下一步
        </a-button>

        <a-button
          v-else
          type="primary"
          :loading="loading"
          @click="handleSave"
        >
          保存
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { Modal, message } from 'ant-design-vue'
import { cloneDeep, isArray, isObject } from 'lodash-es'

import RdbDatasourceQuery from './RdbDatasourceQuery/index.vue'
import ApiSend from './ApiSend/index.vue'
import BasicForm from './components/BasicForm.vue'
import WebSocketSend from './WebSocketSend/index.vue'
import EsDatasourceQuery from './EsDatasourceQuery/index.vue'
import RedisDatasourceQuery from './RedisDatasourceQuery/index.vue'

import { addDataSourceCommand, editDataSourceCommand } from '@datasource-manager-ui/api/data/datasource'
import { parseTableTreeToMetadata, metadataConvertToTableTree } from './utils'
import { transformArray } from './components/utils'

import type { TypeId } from '../../type'
import { DATA_TYPE_ITEM } from '../../../components/table'
import { FormData } from './type'

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
  ok: []
}>()

const route = useRoute()
const formRef = ref()
const componentRef = ref()
const basicFormRef = ref()

const currentStep = ref(0)
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
    commandId: '',
    commandName: '',
    output: {},
    input: [],
    param: {},
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
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: RedisDatasourceQuery
} as const

const isEdit = computed(() => !!props.data?.id)
const sourceClassify = computed(() => route.query.typeId as TypeId)
const currentComponent = computed(() => COMPONENT_MAP[sourceClassify.value])

const modalTitle = computed(() => (isEdit.value ? '编辑功能' : '新增功能'))
const modalWidth = computed(() => {
  if (currentStep.value === 1) {
    if (
      sourceClassify.value === DATA_TYPE_ITEM.RDB_DATASOURCE ||
      sourceClassify.value === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE
    ) {
      return '600px'
    }
  }
  return '1200px'
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
  testDataSource.value = testData
  dynamicParams.value = dynamicParamsData

  if (sourceClassify.value === DATA_TYPE_ITEM.REDIS_DATASOURCE) {
    formData.configuration = {
      ...expression,
      input: dynamicParamsData,
      output: testData
    }
    return
  }

  formData.configuration = {
    ...formData.configuration,
    expression,
    param: dynamicParamsData
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

const handleFormUpdate = (newData: any) => {
  Object.assign(formData, newData)
}

const handleNextStep = async () => {
  try {
    loading.value = true
    const isValid = await componentRef.value?.validateAll()
    if (!isValid) return

    currentStep.value++
    scrollToTop()
  } catch (error) {
    console.error('验证错误:', error)
    message.error('请检查表单填写是否完整')
  } finally {
    loading.value = false
  }
}

const handlePrevStep = () => {
  currentStep.value--
  scrollToTop()
}

const handleSave = async () => {
  try {
    loading.value = true

    // RDB 数据源特殊处理
    if (sourceClassify.value === DATA_TYPE_ITEM.RDB_DATASOURCE) {
      await saveRdbDataSource()
      return
    }

    // Elasticsearch 数据源特殊处理
    if (sourceClassify.value === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE) {
      await saveEsDataSource()
      return
    }

    // Redis 数据源特殊处理
    if (sourceClassify.value === DATA_TYPE_ITEM.REDIS_DATASOURCE) {
      await saveRedisDataSource()
      return
    }

    // API 和 WebSocket 通用处理
    await saveCommonDataSource()
  } catch (error: any) {
    console.error('保存失败:', error)
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

// 保存 RDB 数据源
const saveRdbDataSource = async () => {
  const isFormValid = await validateForm()
  if (!isFormValid) return

  const isComponentValid = await componentRef.value?.validateAll()
  if (!isComponentValid) return

  await saveDataSource({
    ...formData,
    configuration: {
      rdbDefinition: formData.configuration.rdbDefinition,
      provider: 'definition'
    }
  })
}

// 保存 ES 数据源
const saveEsDataSource = async () => {
  const isFormValid = await validateForm()
  if (!isFormValid) return

  const isComponentValid = await componentRef.value?.validateAll()
  if (!isComponentValid) return

  await saveDataSource({
    ...formData,
    configuration: {
      elasticsearchConfig: formData.configuration.elasticsearchConfig
    }
  })
}

// 保存 Redis 数据源
const saveRedisDataSource = async () => {
  const isFormValid = await validateForm()
  if (!isFormValid) return

  const isComponentValid = await componentRef.value?.validateAll()
  if (!isComponentValid) return

  const formDataFromRef = await basicFormRef.value?.getFormData()
  if (!formDataFromRef) return

  const { input, output } = formDataFromRef.configuration

  const inputConfig = parseTableTreeToMetadata(input)

  const isDataSourceArray = isEdit.value
    ? props.data?.configuration?.output?.type === 'array'
    : isArray(testDataSource.value)

  // 构建输出配置
  const outputConfig = buildOutputConfig(output, isDataSourceArray)

  const params = {
    ...formDataFromRef,
    configuration: {
      ...formDataFromRef.configuration,
      input: inputConfig,
      output: outputConfig
    }
  }

  // 检查输出配置
  if (!formDataFromRef.configuration.output?.length) {
    await confirmSaveWithoutOutput(params)
  } else {
    await saveDataSource(params)
  }
}

// 保存通用数据源
const saveCommonDataSource = async () => {
  const isFormValid = await validateForm()
  if (!isFormValid) return

  const formDataFromRef = await basicFormRef.value?.getFormData()
  if (!formDataFromRef) return

  const params = buildDataSourceParams(formDataFromRef)

  // 检查输出配置
  if (!formDataFromRef.configuration.output?.length) {
    await confirmSaveWithoutOutput(params)
  } else {
    await saveDataSource(params)
  }
}

// 验证表单
const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch (error: any) {
    const errorMessage = error.errorFields?.[0]?.errors?.[0] || '表单验证失败'
    message.error(errorMessage)
    return false
  }
}

// 确认保存无输出配置
const confirmSaveWithoutOutput = (params: any) => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '提示',
      content: '命令返回响应配置为空，是否继续保存',
      cancelText: '取消',
      okText: '确定',
      onOk: async () => {
        await saveDataSource(params)
        resolve(true)
      },
      onCancel: () => resolve(false)
    })
  })
}

// 构建数据源参数
const buildDataSourceParams = (formData: any): FormData => {
  const isDataSourceArray = isEdit.value
    ? props.data?.configuration?.output?.type === 'array'
    : isArray(testDataSource.value)

  const { expression, input, output } = formData.configuration

  // 构建表达式配置
  const baseExpression = buildExpression(expression)

  // 构建输出配置
  const outputConfig = buildOutputConfig(output, isDataSourceArray)

  console.log(input, 'buildDataSourceParams')
  return {
    ...formData,
    configuration: {
      ...formData.configuration,
      expression: baseExpression,
      input: parseTableTreeToMetadata(input),
      output: outputConfig,
      provider: 'expression'
    }
  }
}

// 构建表达式
const buildExpression = (expression: any) => {
  const { queryParams, headers, uri, message, method } = expression

  const baseExpression: any = {
    queryParams: transformArray(queryParams),
    headers: transformArray(headers),
    uri: {
      url: sourceClassify.value === DATA_TYPE_ITEM.API_SEND ? uri.url.split('?')[0] : uri.url
    }
  }

  // WebSocket 添加 message
  if (sourceClassify.value === DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE) {
    baseExpression.message = message || {}
  }

  // API 添加 method
  if (sourceClassify.value === DATA_TYPE_ITEM.API_SEND) {
    baseExpression.method = method
  }

  return baseExpression
}

// 构建输出配置
const buildOutputConfig = (output: any, isArray: boolean) => {
  const baseConfig = {
    name: isArray ? '数组' : '对象',
    id: isArray ? 'array' : 'object',
    type: isArray ? 'array' : 'object'
  }

  if (isArray) {
    return {
      ...baseConfig,
      elementType: {
        type: 'object',
        properties: parseTableTreeToMetadata(output)
      }
    }
  }

  return {
    ...baseConfig,
    properties: parseTableTreeToMetadata(output)
  }
}

// 保存数据源
const saveDataSource = async (params: any) => {
  const api = isEdit.value ? editDataSourceCommand : addDataSourceCommand
  const response = await api(params)

  if (!response.success) {
    throw new Error(isEdit.value ? '编辑失败' : '新增失败')
  }

  message.success(isEdit.value ? '编辑成功' : '新增成功')
  emit('ok')
  emit('cancel')
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

// 初始化数据
const initializeFormData = () => {
  const data = cloneDeep(props.data)
  if (!data || !Object.keys(data).length) return

  // 合并表单数据
  mergeFormData(data)

  const DATA_SOURCE_HANDLERS = {
    [DATA_TYPE_ITEM.API_SEND]: handleApiSendInit,
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: handleWebSocketInit,
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: handleRdbInit,
    [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: handleEsInit,
    [DATA_TYPE_ITEM.REDIS_DATASOURCE]: handleRedisInit
  }

  const handler = DATA_SOURCE_HANDLERS[sourceClassify.value]
  handler?.(data)
}

// 合并表单数据
const mergeFormData = (data: any) => {
  Object.keys(formData).forEach((key) => {
    if (!data.hasOwnProperty(key)) return

    const value = data[key]
    const currentValue = (formData as any)[key]

    if (isObject(currentValue) && !isArray(currentValue)) {
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
    formData.configuration.input = metadataConvertToTableTree(input, 'dataType')
  }

  if (output?.type === 'array') {
    formData.configuration.output = metadataConvertToTableTree(output.elementType?.properties, 'dataType')
  } else if (output?.type === 'object') {
    formData.configuration.output = metadataConvertToTableTree(output.properties, 'dataType')
  }
}

// 构建查询字符串
const buildQueryString = (queryParams: any[] = []) => {
  return queryParams
    .filter((item) => item.enable !== false)
    .map((item) => `${item.key}=${item.value}`)
    .join('&')
}

// API 类型
const handleApiSendInit = (data: any) => {
  const { expression } = data.configuration
  if (!expression) return

  const { queryParams, headers, uri } = expression

  formData.configuration.expression = {
    ...expression,
    queryParams: transformExpressionParams(queryParams),
    headers: transformExpressionParams(headers)
  }

  if (uri?.url) {
    const queryString = buildQueryString(formData.configuration.expression.queryParams)
    if (queryString) {
      const separator = uri.url.includes('?') ? '&' : '?'
      formData.configuration.expression.uri.url = `${uri.url}${separator}${queryString}`
    }
  }

  processInputOutput(data)
}

// WebSocket 类型
const handleWebSocketInit = (data: any) => {
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
const handleRdbInit = (data: any) => {
  formData.configuration = data.configuration || {}
}

// ES 类型
const handleEsInit = (data: any) => {
  formData.configuration = data.configuration || {}
}

// Redis 类型
const handleRedisInit = (data: any) => {
  formData.configuration = data.configuration || {}
  processInputOutput(data)
}

onMounted(() => {
  if (isEdit.value) {
    currentStep.value = 1
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
