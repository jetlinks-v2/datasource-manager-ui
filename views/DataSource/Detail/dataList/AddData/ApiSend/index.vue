<template>
  <div class="api-send-container">
    <a-form-item
      label="请求路径"
      :name="['configuration', 'expression', 'uri', 'url']"
      :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
    >
      <div style="display: flex; justify-content: space-between">
        <a-input-group compact>
          <a-form-item-rest>
            <a-select
              v-model:value="expression.method"
              style="width: 10%"
              @change="handleMethodChange"
            >
              <a-select-option value="GET">GET</a-select-option>
              <a-select-option value="POST">POST</a-select-option>
              <a-select-option value="PUT">PUT</a-select-option>
              <a-select-option value="PATCH">PATCH</a-select-option>
              <a-select-option value="DELETE">DELETE</a-select-option>
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
          :historyParams="data.param"
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

<script setup lang="ts" name="ApiSend">
import RequestParams from './RequestParams/index.vue'
import CheckTest from '../components/CheckTest/index.vue'
import ResponseResult from './ResponseResult/index.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { Rule } from 'ant-design-vue/es/form'
import { SelectValue } from 'ant-design-vue/lib/select'
import { convertParamsToObject, transformArray } from '../components/utils'
import { testAPIDataSource } from '@datasource-manager-ui/api/data/datasource'
import type { ApiMethod } from '../type'

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
const checkTestRef = ref()
const sending = ref(false)
const requestParamsRef = ref()
const responseResultRef = ref()
const checkTestDataSource = ref<any>({ body: {} })
const dynamicParams = ref<any>([])

const validateUri = async (_: Rule, value: string) => {
  if (!value) {
    return Promise.reject('请输入请求路径')
  }
  if (value) {
    if (!value.startsWith('/')) {
      return Promise.reject('请求路径必须以/开头')
    }
    if (value.endsWith('/')) {
      return Promise.reject('请求路径不能以/结尾')
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

const handleMethodChange = (value: SelectValue) => {
  expression.value.method = value as ApiMethod
}

const handleUriChange = (e: Event) => {
  expression.value.uri.url = (e.target as HTMLInputElement).value
  requestParamsRef.value?.handleUriChange()
}

const handleBlur = (bodyData: any) => {
  checkTestDataSource.value.body = bodyData
}

const validateAll = () => {
  return props.formRef
    ?.validate([['configuration', 'expression', 'uri', 'url']])
    .then(async () => {
      if (!(await validate())) {
        return false
      }

      if (!responseResultRef.value?.isValid) {
        onlyMessage('请检查响应体', 'error')
        return false
      }

      const latestBody = checkTestDataSource.value.body
      const inputs = convertParamsToObject(dynamicParams.value)
      emit('update:expression', expression.value, latestBody, inputs)
      return true
    })
    .catch(() => {
      onlyMessage('请检查请求路径', 'error')
      return false
    })
}

const handleSend = async () => {
  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest()
    onlyMessage('请检查动态参数输入项', 'error')
    return false
  }

  try {
    await props.formRef?.validate([['configuration', 'expression', 'uri', 'url']]).then(async () => {
      sending.value = true
      const { uri, method, body, queryParams, headers } = expression.value

      const _expression = {
        uri: {
          url: uri.url.split('?')[0]
        },
        method,
        body,
        queryParams: transformArray(queryParams),
        headers: transformArray(headers)
      }
      const dynamicParamsData = convertParamsToObject(dynamicParams.value)

      const sendParams = {
        inputs: dynamicParamsData,
        expression: _expression
      }

      const res = await testAPIDataSource(props.dataSourceId, sendParams)

      if (res.status === 200) {
        checkTestDataSource.value = res.result || {}
        onlyMessage('请求发送成功')
        emit('update:expression', expression.value, checkTestDataSource.value.body, dynamicParamsData)
      }
    })
  } finally {
    sending.value = false
  }
}

watch(
  () => props.data,
  () => {
    expression.value = props.data.expression
  },
  { immediate: true, deep: true }
)

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.api-send-container {
  height: 100%;
  width: 100%;
  padding: 15px;
  overflow-y: auto;
}
</style>
