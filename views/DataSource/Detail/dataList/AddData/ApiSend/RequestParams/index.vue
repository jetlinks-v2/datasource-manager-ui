<template>
  <a-tabs
    v-model:activeKey="activeKey"
    style="min-height: 300px; margin: 0 0 24px"
  >
    <a-tab-pane
      key="params"
      tab="查询参数"
      force-render
    >
      <ParamConfigTable
        ref="requestParamTableRef"
        :dataSource="copyRequestParamData"
        :columns="paramColumns"
        :is-valid="true"
        @update="handleRequestParamDataUpdate"
      />
    </a-tab-pane>
    <a-tab-pane
      key="headers"
      tab="请求头"
      force-render
    >
      <ParamConfigTable
        ref="requestHeaderTableRef"
        :dataSource="requestHeaderDataSource"
        :columns="paramColumns"
        :is-valid="true"
        @update="handleRequestHeaderDataUpdate"
      />
    </a-tab-pane>
    <a-tab-pane
      key="body"
      tab="请求体"
      force-render
    >
      <div class="request-body-container">
        <div class="body-format-selector">
          <div
            v-for="option in bodyFormatOptions"
            :key="option.value"
            class="format-option"
            :class="{ active: bodyFormat === option.value }"
            @click="handleBodyFormatChange(option.value)"
          >
            <span>{{ option.label }}</span>
          </div>
        </div>

        <div
          v-if="bodyFormat === 'none'"
          class="no-body-message"
        >
          此请求不包含请求体数据
        </div>

        <div class="body-content">
          <ParamConfigTable
            ref="formDataParamTableRef"
            v-if="bodyFormat === 'multipart/form-data'"
            :dataSource="formDataParams"
            :columns="paramColumnsWithoutDescription"
            :is-valid="true"
            @update="handleFormDataUpdate"
          />
          <ParamConfigTable
            ref="urlEncodedParamTableRef"
            v-if="bodyFormat === 'application/x-www-form-urlencoded'"
            :dataSource="urlEncodedParams"
            :columns="paramColumnsWithoutDescription"
            :is-valid="true"
            @update="handleUrlEncodedUpdate"
          />
          <JsonEditor
            ref="jsonEditorRef"
            v-if="bodyFormat === 'application/json'"
            v-model="requestBody"
            height="100%"
            @update="handleJsonUpdate"
          />
        </div>
      </div>
    </a-tab-pane>
    <a-tab-pane
      key="check"
      tab="测试"
      force-render
    >
      <slot
        name="checkTest"
        :params="dynamicParams"
      />
    </a-tab-pane>
  </a-tabs>
</template>

<script setup lang="ts" name="RequestParams">
import { cloneDeep } from 'lodash-es'
import { onlyMessage } from '@jetlinks-web/utils'
import ParamConfigTable from '../Components/ParamConfigTable.vue'
import JsonEditor from '../Components/JsonEditor.vue'
import { paramColumns, type ParamItem } from '../Components/setting'
import { useAllParams } from '../../utils'
import { convertParamsToObject, findBodyJsonParams, findQueryParams, findUriParams } from '../utils'
type BodyFormatType = 'none' | 'multipart/form-data' | 'application/x-www-form-urlencoded' | 'application/json'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:data'])
const activeKey = ref('params')
const bodyFormat = ref<BodyFormatType>('none')
const requestBody = ref<string>('{}')

// Refs
const requestParamTableRef = ref()
const requestHeaderTableRef = ref()
const formDataParamTableRef = ref()
const urlEncodedParamTableRef = ref()
const jsonEditorRef = ref()

// 数据源
const requestParamsData = computed<any>(() => props.data)
const requestParamDataSource = ref<ParamItem[]>([])
const copyRequestParamData = ref<ParamItem[]>([])
const requestHeaderDataSource = ref<ParamItem[]>([])
const formDataParams = ref<ParamItem[]>([])
const urlEncodedParams = ref<ParamItem[]>([])

// 动态参数
const dynamicParams = reactive<{
  query: any[]
  headers: any[]
  body: any[]
  uri: any[]
}>({
  query: [],
  headers: [],
  body: [],
  uri: []
})

// 计算属性
const paramColumnsWithoutDescription = computed(() => paramColumns.filter((item: any) => item.key !== 'description'))

const bodyFormatOptions = [
  { value: 'none' as const, label: 'None' },
  { value: 'multipart/form-data' as const, label: 'form-data' },
  { value: 'application/x-www-form-urlencoded' as const, label: 'x-www-form-urlencoded' },
  { value: 'application/json' as const, label: 'json' }
]

// 处理查询参数
const handleRequestParamDataUpdate = (dt: ParamItem[]) => {
  const queryParams = dt ?? []
  const enabledParams = queryParams.filter((item) => item.enable)

  // 构建新的 URI
  let baseUrl = props.data.uri.url?.split('?')[0] || ''

  if (enabledParams.length) {
    const queryString = enabledParams
      .filter((item) => item.key || item.value)
      .map((item) => `${item.key}=${item.value}`)
      .join('&')

    baseUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl
  }
  requestParamsData.value.queryParams = queryParams
  requestParamsData.value.uri = {
    url: baseUrl
  }

  copyRequestParamData.value = cloneDeep(queryParams)
  dynamicParams.query = findQueryParams(queryParams)
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理请求头
const handleRequestHeaderDataUpdate = (dt: ParamItem[]) => {
  requestHeaderDataSource.value = dt
  requestParamsData.value.headers = dt

  dynamicParams.headers = findQueryParams(dt)
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理表单数据
const handleFormDataUpdate = (dt: ParamItem[]) => {
  formDataParams.value = dt
  requestParamsData.value.body = {
    contentType: 'multipart/form-data',
    content: JSON.stringify(convertParamsToObject(dt))
  }

  dynamicParams.body = findQueryParams(formDataParams.value)
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理URL编码数据
const handleUrlEncodedUpdate = (dt: ParamItem[]) => {
  urlEncodedParams.value = dt
  requestParamsData.value.body = {
    contentType: 'application/x-www-form-urlencoded',
    content: JSON.stringify(convertParamsToObject(dt))
  }

  dynamicParams.body = findQueryParams(urlEncodedParams.value)
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理JSON数据
const handleJsonUpdate = (value: any) => {
  requestParamsData.value.body = {
    contentType: 'application/json',
    content: value
  }

  dynamicParams.body = findBodyJsonParams(requestBody.value || '{}')
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理URI变化
const handleUriChange = () => {
  const { queryParams } = useAllParams(props.data.uri.url)
  requestParamDataSource.value = queryParams.value

  // 创建参数key到description的映射
  const descriptionMap = Object.fromEntries(
    copyRequestParamData.value.filter((item) => item.description).map((item) => [item.key, item.description])
  )

  // 获取禁用参数
  const disabledParams = copyRequestParamData.value.filter((item) => !item.enable || (!item.value && !item.key))

  copyRequestParamData.value = [
    ...requestParamDataSource.value.map((item) => ({
      ...item,
      description: descriptionMap[item.key] || item.description
    })),
    ...disabledParams
  ]

  requestParamsData.value.queryParams = copyRequestParamData.value
  requestParamTableRef.value?.validateAll()
  dynamicParams.uri = findUriParams(props.data.uri.url)
  dynamicParams.query = findQueryParams(queryParams.value)
  emit('update:data', cloneDeep(requestParamsData.value))
}

// 表单验证
const validateAll = async (): Promise<boolean> => {
  try {
    // 基础验证项
    const validations = [
      {
        ref: requestParamTableRef.value,
        message: '请检查查询参数输入项',
        _activeKey: 'params'
      },
      {
        ref: requestHeaderTableRef.value,
        message: '请检查请求头输入项',
        _activeKey: 'headers'
      }
    ] as { ref: any; message: string; _activeKey: string }[]

    // 请求体验证项
    const bodyValidations = {
      'multipart/form-data': {
        ref: formDataParamTableRef.value,
        message: '请检查请求体输入项',
        _activeKey: 'body'
      },
      'application/x-www-form-urlencoded': {
        ref: urlEncodedParamTableRef.value,
        message: '请检查请求体输入项',
        _activeKey: 'body'
      },
      'application/json': {
        ref: jsonEditorRef.value,
        message: '请检查请求体输入项',
        _activeKey: 'body'
      }
    } as Record<BodyFormatType, { ref: any; message: string; _activeKey: string }>

    if (bodyFormat.value !== 'none' && bodyValidations[bodyFormat.value]) {
      validations.push(bodyValidations[bodyFormat.value])
    }

    for (const { ref, message, _activeKey } of validations) {
      if (ref && !(await ref.validateAll())) {
        activeKey.value = _activeKey
        onlyMessage(message, 'error')
        return false
      }
    }

    return true
  } catch (error) {
    console.error('验证失败:', error)
    onlyMessage('请检查表单输入项', 'error')
    return false
  }
}

const handleBodyFormatChange = (value: BodyFormatType) => {
  if (value === bodyFormat.value) return
  bodyFormat.value = value
  const handlers = {
    none: () => {
      requestParamsData.value.body = {
        contentType: 'none'
      }
      dynamicParams.body = []
    },
    'application/json': () => handleJsonUpdate(requestBody.value),
    'multipart/form-data': () => handleFormDataUpdate(formDataParams.value),
    'application/x-www-form-urlencoded': () => handleUrlEncodedUpdate(urlEncodedParams.value)
  }

  if (handlers[bodyFormat.value]) {
    handlers[bodyFormat.value]()
  } else {
    console.warn(`未知的请求体格式: ${bodyFormat.value}`)
  }
}

onMounted(() => {
  nextTick(() => {
    if (!props.data) return
    copyRequestParamData.value = cloneDeep(props.data.queryParams ?? []) as ParamItem[]
    requestHeaderDataSource.value = cloneDeep(props.data.headers ?? []) as ParamItem[]

    dynamicParams.query = findQueryParams(copyRequestParamData.value)
    dynamicParams.headers = findQueryParams(requestHeaderDataSource.value)

    const type = (props.data.body?.contentType || 'none') as BodyFormatType
    bodyFormat.value = type
    switch (type) {
      case 'application/json':
        requestBody.value = props.data.body?.content || '{}'
        dynamicParams.body = findBodyJsonParams(requestBody.value || '{}')
        break
      case 'multipart/form-data':
        const content = JSON.parse(props.data.body?.content || '{}')
        formDataParams.value = Object.entries(content).map(([key, value]) => ({
          key,
          value,
          enable: true
        })) as ParamItem[]
        dynamicParams.body = findQueryParams(formDataParams.value)
        break
      case 'application/x-www-form-urlencoded':
        const urlEncodedContent = JSON.parse(props.data.body?.content || '{}')
        urlEncodedParams.value = Object.entries(urlEncodedContent).map(([key, value]) => ({
          key,
          value,
          enable: true
        })) as ParamItem[]
        dynamicParams.uri = findUriParams(props.data.uri.url)
        break
      case 'none':
        requestParamsData.value.body = {
          contentType: 'none'
        }
        dynamicParams.body = []
        break

      default:
        break
    }
  })
})

defineExpose({
  validateAll,
  handleCheckTest: () => (activeKey.value = 'check'),
  handleUriChange
})
</script>

<style scoped lang="less">
:deep(.table-striped) {
  background-color: #fafafa;
}

.request-body-container {
  display: flex;
  flex-direction: column;
  height: 280px;
  gap: 16px;

  .body-format-selector {
    display: flex;
    width: 100%;
    padding: 0 8px;

    .format-option {
      padding: 2px 8px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid #d9d9d9;
      background: #fff;
      color: rgba(0, 0, 0, 0.65);
      font-size: 12px;
      text-align: center;
      margin: 0 4px;
      transition: all 0.3s;

      &:first-child {
        margin-left: 0;
      }

      &:last-child {
        margin-right: 0;
      }

      &:hover {
        color: #1890ff;
        border-color: #1890ff;
      }

      &.active {
        color: #1890ff;
        border-color: #1890ff;
        background: #e6f7ff;
      }
    }
  }

  .no-body-message {
    text-align: center;
    color: rgba(0, 0, 0, 0.45);
    font-size: 14px;
    padding: 24px 0;
    background: #fafafa;
    border-radius: 4px;
  }

  .body-content {
    flex: 1;
    min-height: 0;
  }
}
</style>
