<template>
  <div class="websocket-send-container">
    <a-form-item
      label="请求路径"
      :name="['configuration', 'expression', 'uri', 'url']"
      :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
    >
      <div style="display: flex; justify-content: space-between">
        <a-input-group compact>
          <a-form-item-rest>
            <a-select
              v-model:value="protocol"
              style="width: 10%"
              @change="handleProtocolChange"
            >
              <a-select-option value="ws://">ws://</a-select-option>
              <a-select-option value="wss://">wss://</a-select-option>
            </a-select>
          </a-form-item-rest>

          <a-input
            v-model:value="expression.uri.url"
            style="width: 90%"
            placeholder="请输入请求路径"
            :maxlength="65535"
            @change="handleUriChange"
          />
        </a-input-group>
      </div>
    </a-form-item>

    <RequestParams
      ref="requestParamsRef"
      v-model:data="expression"
    >
      <template #checkTest="{ params }">
        <CheckTest
          ref="checkTestRef"
          :formData="expression"
          :queryParams="params"
          @update:data="handleCheckTestSave"
        >
          <template #sendOutButton>
            <a-button
              type="primary"
              @click="handleSend"
              :loading="sending"
            >
              <AIcon type="SendOutlined" />
              发送请求
            </a-button>
          </template>
        </CheckTest>
      </template>
    </RequestParams>

    <ResponseResult
      ref="responseResultRef"
      :data="checkTestDataSource"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts" name="WebSocketSend">
import RequestParams from './RequestParams/index.vue'
import CheckTest from '../components/CheckTest/index.vue'
import ResponseResult from './ResponseResult/index.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { Rule } from 'ant-design-vue/es/form'
import { SelectValue } from 'ant-design-vue/lib/select'
import { convertParamsToObject, transformArray } from '../components/utils'
import { testWebSocketDataSource } from '@datasource-manager-ui/api/data/datasource'
import type { WebSocketProtocol } from '../type'

const props = defineProps({
  dataSourceId: {
    type: String,
    required: true
  },
  formRef: {
    type: Object,
    default: () => ({})
  },
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:expression'])
const expression = ref()
const protocol = ref<WebSocketProtocol>('ws://')
const checkTestRef = ref()
const sending = ref(false)
const requestParamsRef = ref()
const responseResultRef = ref()
const checkTestDataSource = ref<any>({})
const dynamicParams = ref<any>([])

const validateUri = async (rule: Rule, value: string) => {
  if (!value) {
    return Promise.reject('请输入请求路径')
  }
  if (value) {
    // WebSocket路径可以是完整URL或路径
    const fullUrl = value.startsWith('ws://') || value.startsWith('wss://') ? value : `${protocol.value}${value}`
    try {
      new URL(fullUrl)
    } catch (error) {
      return Promise.reject('请输入有效的WebSocket路径')
    }
  }
  return Promise.resolve()
}

const validate = async () => {
  if (!(await requestParamsRef.value?.validateAll())) {
    return false
  }

  requestParamsRef.value?.handleUriChange()
  return true
}

const handleCheckTestSave = (data: any) => {
  dynamicParams.value = data
}

const handleProtocolChange = (value: SelectValue) => {
  protocol.value = value as WebSocketProtocol
  // 更新完整的URL
  if (
    expression.value.uri.url &&
    !expression.value.uri.url.startsWith('ws://') &&
    !expression.value.uri.url.startsWith('wss://')
  ) {
    expression.value.uri.url = expression.value.uri.url
  }
}

const handleUriChange = (e: Event) => {
  const value = (e.target as HTMLInputElement).value
  expression.value.uri.url = value
  requestParamsRef.value?.handleUriChange()
}

const handleBlur = (bodyData: any) => {
  checkTestDataSource.value = bodyData
}

const validateAll = async () => {
  return await props.formRef
    ?.validate([['configuration', 'expression', 'uri', 'url']])
    .then(async () => {
      if (!(await validate())) {
        return false
      }

      if (!responseResultRef.value?.isValid) {
        onlyMessage('请检查响应体', 'error')
        return false
      }

      const inputs = convertParamsToObject(dynamicParams.value)
      emit('update:expression', expression.value, checkTestDataSource.value, inputs)
      return true
    })
    .catch(() => {
      onlyMessage('请检查请求路径', 'error')
      return false
    })
}

const handleSend = async () => {
  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest?.()
    onlyMessage('请检查动态参数输入项', 'error')
    return false
  }

  try {
    await props.formRef
      ?.validate([['configuration', 'expression', 'uri', 'url']])
      .then(async () => {
        sending.value = true
        const { uri, queryParams, headers, message } = expression.value

        // 构建完整的WebSocket URL
        const fullUrl =
          uri.url.startsWith('ws://') || uri.url.startsWith('wss://') ? uri.url : `${protocol.value}${uri.url}`

        const _expression = {
          uri: {
            url: fullUrl
          },
          queryParams: transformArray(queryParams),
          headers: transformArray(headers),
          message: message || {}
        }
        const dynamicParamsData = convertParamsToObject(dynamicParams.value)

        const sendParams = {
          inputs: dynamicParamsData,
          expression: _expression
        }

        const res = await testWebSocketDataSource(props.dataSourceId, sendParams)

        if (res.status === 200) {
          checkTestDataSource.value = res.result?.payload || {}
          onlyMessage('WebSocket请求发送成功')
          emit('update:expression', expression.value, checkTestDataSource.value, dynamicParamsData)
        }
      })
      .catch((e: any) => {
        onlyMessage(e.errorFields[0].errors[0], 'error')
      })
  } finally {
    sending.value = false
  }
}

watch(
  () => props.data,
  () => {
    expression.value = props.data.expression
    // 从URL中提取协议
    if (expression.value?.uri?.url) {
      if (expression.value.uri.url.startsWith('wss://')) {
        protocol.value = 'wss://'
        expression.value.uri.url = expression.value.uri.url.replace('wss://', '')
      } else if (expression.value.uri.url.startsWith('ws://')) {
        protocol.value = 'ws://'
        expression.value.uri.url = expression.value.uri.url.replace('ws://', '')
      }
    }
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  nextTick(() => {
    requestParamsRef.value?.handleUriChange()
  })
})

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.websocket-send-container {
  height: 100%;
  width: 100%;
  padding: 15px;
  overflow-y: auto;
}
</style>
