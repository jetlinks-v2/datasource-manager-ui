<template>
  <a-modal
    open
    :title="isEdit ? '编辑功能' : '新增功能'"
    centered
    :maskClosable="false"
    @cancel="emit('cancel')"
    :destroyOnClose="true"
    :width="sourceClassify === DATA_TYPE_ITEM.RDB_DATASOURCE && currentStep === 1 ? '600px' : '1200px'"
    :bodyStyle="{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '8px', marginRight: '-8px' }"
  >
    <a-form
      :model="formData"
      ref="formRef"
      layout="vertical"
    >
      <a-steps
        :current="currentStep"
        class="mb-6"
      >
        <a-step title="详细配置" />
        <a-step title="命令生成" />
      </a-steps>

      <div v-show="currentStep === 0">
        <component
          ref="componentRef"
          :is="components[sourceClassify]"
          :isEdit="isEdit"
          :dataSourceId="info.id"
          :formRef="formRef"
          :data="formData.configuration"
          @update:expression="updateExpressionData"
          @update:configuration="handleConfigUpdate"
        />
      </div>

      <div v-show="currentStep === 1">
        <BasicForm
          ref="basicFormRef"
          :modelValue="formData"
          :testData="checkTestDataSource"
          :dynamicParams="dynamicParams"
          :isEdit="isEdit"
          :sourceClassify="sourceClassify"
          @update="handleFormUpdate"
        />
      </div>
    </a-form>

    <template #footer>
      <div class="footer-wrapper">
        <div>
          <a-button
            v-if="currentStep > 0"
            @click="prev"
          >
            上一步
          </a-button>
        </div>

        <a-button
          v-if="currentStep < 1"
          type="primary"
          @click="next"
        >
          下一步
        </a-button>
        <a-button
          v-else
          type="primary"
          @click="handleSave"
        >
          保存
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import RdbDatasourceQuery from './RdbDatasourceQuery/index.vue'
import ApiSend from './ApiSend/index.vue'
import BasicForm from './components/BasicForm.vue'
import WebSocketSend from './WebSocketSend/index.vue'
import { addDataSourceCommand, editDataSourceCommand } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { parseTableTreeToMetadata, metadataConvertToTableTree } from './utils'
import { transformArray } from './components/utils'
import { isArray, isObject, cloneDeep } from 'lodash-es'
import { Modal } from 'ant-design-vue'
import { TypeId } from '../../type'
import { DATA_TYPE_ITEM } from '../../../components/table'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  info: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['cancel', 'ok'])

const route = useRoute()
const formRef = ref()
const componentRef = ref()
const basicFormRef = ref()

const data = ref<any>({})
const currentStep = ref(0)
const checkTestDataSource = ref<any>()
const dynamicParams = ref<any[]>([])
const formData = reactive<any>({
  id: data.value.id,
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
    expression: {
      uri: {
        url: ''
      },
      method: 'GET',
      body: {
        contentType: '',
        content: ''
      },
      queryParams: [],
      headers: []
    }
  }
})

const isEdit = computed(() => {
  if (data.value.id) {
    currentStep.value = 1
    return true
  }
  currentStep.value = 0
  return false
})

const sourceClassify = computed(() => {
  return route.query.typeId as TypeId
})

const updateExpressionData = (expression: any, testData: any, dynamicParamsData: any) => {
  formData.configuration.expression = expression
  checkTestDataSource.value = testData
  dynamicParams.value = dynamicParamsData
}

const handleConfigUpdate = (config: any) => {
  formData.configuration = {
    rdbDefinition: config,
    provider: 'definition'
  }
}

const next = async (): Promise<void> => {
  try {
    const componentValid = await componentRef.value?.validateAll()
    if (componentValid) {
      currentStep.value++
      scrollToTop()
    } else {
      console.log('验证失败', { componentValid })
    }
  } catch (e) {
    console.error('Validation error:', e)
  }
}

const prev = () => {
  currentStep.value--
  scrollToTop()
}

const scrollToTop = () => {
  const el = document.querySelector('.ant-modal-body')
  if (el) {
    el.scrollTop = 0
  }
}

const components: any = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: RdbDatasourceQuery,
  [DATA_TYPE_ITEM.API_SEND]: ApiSend,
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: WebSocketSend
}

const handleFormUpdate = (newData: any) => {
  Object.assign(formData, newData)
}

const handleSave = async () => {
  try {
    // 通用数据源处理
    if (sourceClassify.value === DATA_TYPE_ITEM.RDB_DATASOURCE) {
      const valid = await formRef.value?.validate()
      if (!valid) return

      const componentValid = await componentRef.value?.validateAll()
      if (!componentValid) return

      await onSaveData(formData)
      return
    }

    // API和WebSocket通用验证
    const valid = await formRef.value?.validate().catch((e: any) => {
      onlyMessage(e.errorFields[0].errors[0], 'error')
      return false
    })
    if (!valid) return

    const _formData = await basicFormRef.value?.getFormData()
    if (!_formData) return

    // 构建参数
    const params = buildDataSourceParams(_formData)

    // 检查输出配置并保存
    if (!_formData.configuration.output.length) {
      Modal.confirm({
        title: '提示',
        content: '命令返回响应配置为空，是否继续保存',
        cancelText: '取消',
        okText: '确定',
        onOk: () => onSaveData(params)
      })
    } else {
      await onSaveData(params)
    }
  } catch (e) {
    console.error('保存失败:', e)
  }
}

// 构建数据源参数
const buildDataSourceParams = (formData: any) => {
  const isDataSourceArray = isEdit.value
    ? data.value.configuration.output.type === 'array'
    : isArray(checkTestDataSource.value)

  const { queryParams, headers, uri, message, method } = formData.configuration.expression

  // 构建基础配置
  const baseExpression = {
    queryParams: transformArray(queryParams),
    headers: transformArray(headers),
    uri: {
      url: sourceClassify.value === DATA_TYPE_ITEM.API_SEND ? uri.url.split('?')[0] : uri.url
    }
  } as any

  // WebSocket需要添加message
  if (sourceClassify.value === DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE) {
    baseExpression.message = message || {}
  }

  // API需要添加method
  if (sourceClassify.value === DATA_TYPE_ITEM.API_SEND) {
    baseExpression.method = method
  }

  // 构建输出配置
  const outputConfig = {
    name: isDataSourceArray ? '数组' : '对象',
    id: isDataSourceArray ? 'array' : 'object',
    type: isDataSourceArray ? 'array' : 'object',
    ...(isDataSourceArray
      ? {
          elementType: {
            type: 'object',
            properties: parseTableTreeToMetadata(formData.configuration.output)
          }
        }
      : {
          properties: parseTableTreeToMetadata(formData.configuration.output)
        })
  }

  return {
    ...formData,
    configuration: {
      ...formData.configuration,
      expression: baseExpression,
      input: parseTableTreeToMetadata(formData.configuration.input),
      output: outputConfig,
      provider: 'expression'
    }
  }
}

// 保存数据
const onSaveData = async (formData: any) => {
  try {
    const res = isEdit.value ? await editDataSourceCommand(formData) : await addDataSourceCommand(formData)

    if (res.success) {
      onlyMessage(isEdit.value ? '编辑成功' : '新增成功')
      emit('ok')
      emit('cancel')
    } else {
      throw new Error(isEdit.value ? '编辑失败' : '新增失败')
    }
  } catch (error: any) {
    onlyMessage(error.message || '操作失败', 'error')
  }
}

// 合并表单数据
const mergeFormData = () => {
  Object.keys(formData).forEach((key) => {
    if (!data.value.hasOwnProperty(key)) return

    const isComplexObject = isObject(formData[key]) && !isArray(formData[key])
    isComplexObject ? Object.assign(formData[key], data.value[key]) : (formData[key] = data.value[key])
  })
}

// 处理表达式参数转换
const transformExpressionParams = (params: any[]) => {
  return params.map((item) => ({
    ...item,
    key: item.key.value,
    value: item.value.value
  }))
}

// 处理输入输出配置
const processInputOutput = () => {
  const { input, output } = data.value.configuration

  // 处理输入
  formData.configuration.input = metadataConvertToTableTree(input, 'dataType')

  // 处理输出
  if (output.type === 'array') {
    formData.configuration.output = metadataConvertToTableTree(output.elementType.properties, 'dataType')
  } else if (output.type === 'object') {
    formData.configuration.output = metadataConvertToTableTree(output.properties, 'dataType')
  }
}

// 构建查询字符串
const buildQueryString = (queryParams: any[]) => {
  return (
    queryParams
      ?.filter((item) => item.enable)
      .map((item) => `${item.key}=${item.value}`)
      .join('&') || ''
  )
}

// 处理API发送类型数据
const handleApiSendData = () => {
  const { queryParams, headers, uri } = data.value.configuration.expression

  // 转换表达式参数
  formData.configuration.expression = {
    ...data.value.configuration.expression,
    queryParams: transformExpressionParams(queryParams),
    headers: transformExpressionParams(headers)
  }

  // 构建带查询参数的URL
  if (uri) {
    const queryString = buildQueryString(formData.configuration.expression.queryParams)
    if (queryString) {
      const separator = uri.url.includes('?') ? '&' : '?'
      formData.configuration.expression.uri.url = `${uri.url}${separator}${queryString}`
    }
  }

  // 处理输入输出
  processInputOutput()
}

// 处理WebSocket类型数据
const handleWebSocketData = () => {
  const { queryParams, headers, uri, message } = data.value.configuration.expression

  // 转换表达式参数
  formData.configuration.expression = {
    ...data.value.configuration.expression,
    queryParams: transformExpressionParams(queryParams),
    headers: transformExpressionParams(headers),
    message: message || {}
  }

  // 保持原始URL
  if (uri) {
    formData.configuration.expression.uri.url = uri.url
  }

  // 处理输入输出
  processInputOutput()
}

// 处理RDB类型数据
const handleRdbData = () => {
  formData.configuration.rdbDefinition = data.value.configuration.rdbDefinition
}

onMounted(() => {
  data.value = cloneDeep(props.data)
  if (!data.value || !Object.keys(data.value).length) return

  // 合并表单数据
  mergeFormData()

  // 根据数据源类型处理配置
  const handlers = {
    [DATA_TYPE_ITEM.API_SEND]: handleApiSendData,
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: handleWebSocketData,
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: handleRdbData
  }

  const handler = handlers[sourceClassify.value]
  handler()
})
</script>

<style scoped lang="less">
.mb-6 {
  width: 70%;
  margin: 0 auto 16px;
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
