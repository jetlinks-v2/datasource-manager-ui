<template>
  <div class="api-send-container">
    <a-form-item
      :label="$t('DataSource.ApiSend.100020-0')"
      :name="['configuration', 'expression', 'uri', 'url']"
      :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
    >
      <a-input-group compact>
        <a-form-item-rest>
          <a-select
            v-model:value="expression.method"
            style="width: 100px"
            @change="handleMethodChange"
          >
            <a-select-option
              v-for="method in HTTP_METHODS"
              :key="method"
              :value="method"
            >
              {{ method }}
            </a-select-option>
          </a-select>
        </a-form-item-rest>
        <a-input
          v-model:value="expression.uri.url"
          style="width: calc(100% - 100px)"
          :placeholder="$t('DataSource.ApiSend.100020-1')"
          :maxlength="65535"
          @change="handleUriChange"
        />
      </a-input-group>
    </a-form-item>

    <RequestParams
      ref="requestParamsRef"
      v-model:data="expression"
    >
      <template #checkTest="{ params }">
        <CheckTest
          ref="checkTestRef"
          :query-params="params"
          :history-params="data.defaultParams"
          :advanced-mode="isAdvancedMode"
          @update:data="handleCheckTestSave"
          @update:advanced-mode="handleAdvancedModeChange"
        >
          <template #sendOutButton>
            <a-button
              type="primary"
              :loading="sending"
              @click="handleSend"
            >
              <AIcon type="SendOutlined" />
              {{ $t('DataSource.ApiSend.100020-4') }}
            </a-button>
          </template>
        </CheckTest>
      </template>
    </RequestParams>

    <ResponseResult
      ref="responseResultRef"
      :data="responseData"
      @blur="handleResponseBlur"
    />
  </div>
</template>

<script setup lang="ts" name="ApiSend">
import { onlyMessage } from '@jetlinks-web/utils'
import type { Rule } from 'ant-design-vue/es/form'
import type { SelectValue } from 'ant-design-vue/lib/select'
import RequestParams from './RequestParams/index.vue'
import CheckTest from '../components/CheckTest/index.vue'
import ResponseResult from './ResponseResult/index.vue'
import { convertParamsToObject, transformArray, validateDynamicParams, validateUrlChars } from '../components/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import type { ApiMethod } from '../type'
import { useI18n } from 'vue-i18n'
import { isObject } from 'lodash-es'

const { t: $t } = useI18n()

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

const props = defineProps({
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
const route = useRoute()

// 路由参数
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

// 组件引用
const checkTestRef = ref()
const requestParamsRef = ref()
const responseResultRef = ref()

// 状态
const expression = ref<any>()
const sending = ref(false)
const responseData = ref<any>({ body: {} })
const dynamicParams = ref<any[]>([])
const isAdvancedMode = ref(false)

// URI 验证规则
const validateUri = async (_: Rule, value: string) => {
  if (!value) return Promise.reject($t('DataSource.ApiSend.100020-1'))
  if (!value.startsWith('/')) return Promise.reject($t('DataSource.ApiSend.100020-2'))
  if (value.endsWith('/')) return Promise.reject($t('DataSource.ApiSend.100020-3'))

  // 验证动态参数格式
  const validationResult = validateDynamicParams(value)
  if (!validationResult.valid) {
    const firstError = validationResult.errors[0]
    return Promise.reject($t(firstError.message))
  }

  // 验证 URL 特殊字符
  const urlCharsResult = validateUrlChars(value)
  if (!urlCharsResult.valid) {
    const firstError = urlCharsResult.errors[0]
    return Promise.reject($t(firstError.message, { char: firstError.text }))
  }

  return Promise.resolve()
}

// 验证请求参数
const validateRequestParams = async (): Promise<boolean> => {
  if (!(await requestParamsRef.value?.validateAll())) return false

  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest()
    onlyMessage($t('DataSource.ApiSend.100020-7'), 'error')
    return false
  }

  requestParamsRef.value?.handleUriChange()
  return true
}

// 构建请求表达式
const buildRequestExpression = () => {
  const { uri, method, body, queryParams, headers } = expression.value
  return {
    uri: { url: uri.url.split('?')[0] },
    method,
    body,
    queryParams: transformArray(queryParams),
    headers: transformArray(headers)
  }
}

// 事件处理
const handleCheckTestSave = (data: any[]) => {
  dynamicParams.value = data
}

const handleAdvancedModeChange = (value: boolean) => {
  isAdvancedMode.value = value
}

const handleMethodChange = (value: SelectValue) => {
  expression.value.method = value as ApiMethod
}

const handleUriChange = (e: Event) => {
  expression.value.uri.url = (e.target as HTMLInputElement).value
  requestParamsRef.value?.handleUriChange()
}

const handleResponseBlur = (bodyData: any) => {
  responseData.value.body = bodyData
}

// 发送请求
const handleSend = async () => {
  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest()
    onlyMessage($t('DataSource.ApiSend.100020-7'), 'error')
    return
  }

  try {
    await props.formRef?.validate([['configuration', 'expression', 'uri', 'url']])
    sending.value = true

    const res = await queryDataSource(typeId, dataSourceId, 'HttpExprRequest', {
      inputs: convertParamsToObject(dynamicParams.value),
      expression: buildRequestExpression()
    })

    if (res.status === 200) {
      responseData.value = res.result || {}
      onlyMessage($t('DataSource.ApiSend.100020-8'))
    }
  } catch {
    // 验证失败
  } finally {
    sending.value = false
  }
}

// 检查响应体是否有内容
const hasResponseBody = (): boolean => {
  const body = responseData.value?.body
  if (!body) return false
  if (isObject(body) && Object.keys(body).length === 0) return false
  return true
}

// 验证并提交
const validateAll = async () => {
  try {
    await props.formRef?.validate([['configuration', 'expression', 'uri', 'url']])

    if (!(await validateRequestParams())) return false

    if (!responseResultRef.value?.isValid) {
      onlyMessage($t('DataSource.ApiSend.100020-5'), 'error')
      return false
    }

    // 如果响应体为空，需要先发送请求
    if (!hasResponseBody()) {
      requestParamsRef.value?.handleCheckTest()
      onlyMessage($t('DataSource.ApiSend.100020-9'), 'error')
      return false
    }

    emit(
      'update:expression',
      { ...expression.value, others: { isAdvancedMode: isAdvancedMode.value } },
      responseData.value.body,
      convertParamsToObject(dynamicParams.value)
    )
    return true
  } catch {
    onlyMessage($t('DataSource.ApiSend.100020-6'), 'error')
    return false
  }
}

// 监听数据变化
watch(
  () => props.data,
  (newData) => {
    expression.value = newData.expression
    if (newData?.others?.isAdvancedMode !== undefined) {
      isAdvancedMode.value = newData.others.isAdvancedMode
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ validateAll })
</script>

<style scoped lang="less">
.api-send-container {
  height: 100%;
  width: 100%;
  padding: 15px;
  overflow-y: auto;
}
</style>
