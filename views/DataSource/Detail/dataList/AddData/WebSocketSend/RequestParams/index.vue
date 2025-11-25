<template>
  <a-tabs
    v-model:activeKey="activeKey"
    style="min-height: 300px; margin: 0 0 24px"
  >
    <a-tab-pane
      key="message"
      tab="消息"
      force-render
    >
      <div class="message-container">
        <div class="message-header">
          <div class="payload-type-selector">
            <span class="selector-label">消息类型:</span>
            <a-select
              v-model:value="payloadType"
              style="width: 120px"
              size="small"
              disabled
            >
              <a-select-option value="JSON">JSON</a-select-option>
              <a-select-option value="STRING">STRING</a-select-option>
              <a-select-option value="BINARY">BINARY</a-select-option>
            </a-select>
          </div>
        </div>

        <div class="message-content">
          <!-- STRING 类型 -->
          <template v-if="payloadType === 'STRING'">
            <a-textarea
              v-model:value="stringContent"
              placeholder="请输入字符串消息内容，支持{{}}动态参数"
              :rows="10"
              :maxlength="65535"
              @change="handleStringContentChange"
            />
          </template>

          <!-- JSON 类型 -->
          <template v-if="payloadType === 'JSON'">
            <div class="json-editor-container">
              <JsonEditor
                ref="messageEditorRef"
                v-model="jsonContent"
                height="300px"
                formatOnBlur
                @update="handleJsonContentChange"
              />
            </div>
          </template>

          <!-- BINARY 类型 -->
          <template v-if="payloadType === 'BINARY'">
            <a-textarea
              v-model:value="binaryContent"
              placeholder="请输入十六进制字符串"
              :rows="10"
              :maxlength="65535"
              @change="handleBinaryContentChange"
            />
          </template>
        </div>
      </div>
    </a-tab-pane>

    <a-tab-pane
      key="params"
      tab="参数"
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

<script setup lang="ts" name="WebSocketRequestParams">
import { cloneDeep } from 'lodash-es'
import { onlyMessage } from '@jetlinks-web/utils'
import ParamConfigTable from '../../components/ParamConfigTable.vue'
import JsonEditor from '../../components/JsonEditor.vue'
import { paramColumns, type ParamItem } from '../../components/setting'
import { useAllParams } from '../../utils'
import { findBodyJsonParams, findQueryParams, findUriParams } from '../../components/utils'
const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:data'])
const info = inject('INFO') as any
const activeKey = ref('message')
const payloadType = computed(() => info.value.shareConfig.payloadType)

// 不同类型的消息内容
const stringContent = ref<string>('')
const jsonContent = ref<string>('{}')
const binaryContent = ref<string>('')

// Refs
const requestParamTableRef = ref()
const requestHeaderTableRef = ref()
const messageEditorRef = ref()

// 数据源
const requestParamsData = computed<any>(() => props.data)
const requestParamDataSource = ref<ParamItem[]>([])
const copyRequestParamData = ref<ParamItem[]>([])
const requestHeaderDataSource = ref<ParamItem[]>([])

// 动态参数
const dynamicParams = reactive<{
  query: any[]
  headers: any[]
  message: any[]
  uri: any[]
}>({
  query: [],
  headers: [],
  message: [],
  uri: []
})

// 处理路径参数
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

// 处理字符串内容变化
const handleStringContentChange = () => {
  updateMessageData()
}

// 处理JSON内容变化
const handleJsonContentChange = (value: any) => {
  jsonContent.value = value
  updateMessageData()
}

// 处理二进制内容变化
const handleBinaryContentChange = () => {
  updateMessageData()
}

// 更新消息数据
const updateMessageData = () => {
  let content: any = ''
  let currentContent = ''

  switch (payloadType.value) {
    case 'STRING':
      content = stringContent.value
      currentContent = stringContent.value
      break
    case 'JSON':
      try {
        content = JSON.parse(jsonContent.value || '{}')
        currentContent = jsonContent.value
      } catch (error) {
        content = {}
        currentContent = jsonContent.value
      }
      break
    case 'BINARY':
      content = binaryContent.value
      currentContent = binaryContent.value
      break
  }

  requestParamsData.value.message = {
    content
  }

  // 根据消息类型提取动态参数
  if (payloadType.value === 'JSON') {
    dynamicParams.message = findBodyJsonParams(currentContent || '{}')
  } else {
    // STRING和BINARY类型直接从字符串中提取参数
    dynamicParams.message = findBodyJsonParams(JSON.stringify({ content: currentContent }))
  }

  emit('update:data', cloneDeep(requestParamsData.value))
}

// 处理URI变化
const handleUriChange = () => {
  const { queryParams } = useAllParams(props.data.uri.url)
  requestParamDataSource.value = queryParams.value

  // 创建参数key到description的映射
  const descriptionMap = Object.fromEntries(
    copyRequestParamData.value.filter((item: any) => item.description).map((item: any) => [item.key, item.description])
  )

  // 获取禁用参数
  const disabledParams = copyRequestParamData.value.filter((item: any) => !item.enable || (!item.value && !item.key))

  copyRequestParamData.value = [
    ...requestParamDataSource.value.map((item: any) => ({
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
        message: '请检查路径参数输入项',
        _activeKey: 'params'
      },
      {
        ref: requestHeaderTableRef.value,
        message: '请检查请求头输入项',
        _activeKey: 'headers'
      },
      {
        ref: messageEditorRef.value,
        message: '请检查消息内容输入项',
        _activeKey: 'message'
      }
    ] as { ref: any; message: string; _activeKey: string }[]

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

onMounted(() => {
  nextTick(() => {
    if (!props.data) return

    // 初始化参数数据
    copyRequestParamData.value = cloneDeep(props.data.queryParams ?? []) as ParamItem[]
    requestHeaderDataSource.value = cloneDeep(props.data.headers ?? []) as ParamItem[]

    // 初始化动态参数
    dynamicParams.query = findQueryParams(copyRequestParamData.value)
    dynamicParams.headers = findQueryParams(requestHeaderDataSource.value)
    dynamicParams.uri = findUriParams(props.data.uri?.url || '')

    // 初始化消息内容
    const msg = props.data.message
    const content = msg?.content
    switch (payloadType.value) {
      case 'STRING':
        stringContent.value = typeof content === 'object' ? JSON.stringify(content) : content || ''
        break
      case 'JSON':
        jsonContent.value = typeof content === 'object' ? JSON.stringify(content, null, 2) : content || '{}'
        break
      case 'BINARY':
        binaryContent.value = typeof content === 'object' ? JSON.stringify(content) : content || ''
        break
      default:
        jsonContent.value = '{}'
        break
    }
    // 如果没有消息内容，默认JSON类型初始化
    if (!msg) {
      jsonContent.value = '{}'
    }

    // 更新动态参数
    updateMessageData()
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

.message-container {
  display: flex;
  flex-direction: column;
  min-height: 320px;
  gap: 12px;

  .message-header {
    .message-description {
      display: flex;
      align-items: center;
      color: rgba(0, 0, 0, 0.65);
      font-size: 12px;
    }

    .payload-type-selector {
      display: flex;
      align-items: center;
      gap: 8px;

      .selector-label {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.65);
        white-space: nowrap;
      }
    }
  }

  .message-content {
    flex: 1;
    min-height: 0;

    .json-editor-container {
      height: 100%;
      display: flex;
      flex-direction: column;

      .json-toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 8px;
      }
    }
  }
}
</style>
