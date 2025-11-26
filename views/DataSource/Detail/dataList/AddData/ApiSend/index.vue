<template>
  <div class="api-send-container">
    <a-form-item
      label="请求路径"
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
          placeholder="请输入请求路径"
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
          :history-params="data.param"
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
              发送请求
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
import { convertParamsToObject, transformArray } from '../components/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import type { ApiMethod } from '../type'

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
  if (!value) return Promise.reject('请输入请求路径')
  if (!value.startsWith('/')) return Promise.reject('请求路径必须以/开头')
  if (value.endsWith('/')) return Promise.reject('请求路径不能以/结尾')
  return Promise.resolve()
}

// 验证请求参数
const validateRequestParams = async (): Promise<boolean> => {
  if (!(await requestParamsRef.value?.validateAll())) return false

  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest()
    onlyMessage('请检查动态参数输入项', 'error')
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
    onlyMessage('请检查动态参数输入项', 'error')
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
      onlyMessage('请求发送成功')
    }
  } catch {
    // 验证失败
  } finally {
    sending.value = false
  }
}

// 验证并提交
const validateAll = async () => {
  try {
    await props.formRef?.validate([['configuration', 'expression', 'uri', 'url']])

    if (!(await validateRequestParams())) return false

    if (!responseResultRef.value?.isValid) {
      onlyMessage('请检查响应体', 'error')
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
    onlyMessage('请检查请求路径', 'error')
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
