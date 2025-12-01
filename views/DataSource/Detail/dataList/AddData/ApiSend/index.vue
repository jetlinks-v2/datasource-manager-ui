<template>
  <div class="api-send-container">
    <a-form-item
      :label="$t('DataSource.ApiSend.100020-0')"
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
            :placeholder="$t('DataSource.ApiSend.100020-1')"
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
              {{ $t('DataSource.ApiSend.100020-4') }}
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
import CheckTest from './CheckTest/index.vue'
import ResponseResult from './ResponseResult/index.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { Rule } from 'ant-design-vue/es/form'
import { SelectValue } from 'ant-design-vue/lib/select'
import { convertParamsToObject, transformArray } from './utils'
import { testAPIDataSource } from '@datasource-manager-ui/api/data/datasource'
import type { ApiMethod } from '../type'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

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

const validateUri = async (rule: Rule, value: string) => {
  if (!value) {
    return Promise.reject($t('DataSource.ApiSend.100020-1'))
  }
  if (value) {
    if (!value.startsWith('/')) {
      return Promise.reject($t('DataSource.ApiSend.100020-2'))
    }
    if (value.endsWith('/')) {
      return Promise.reject($t('DataSource.ApiSend.100020-3'))
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
  const value = (e.target as HTMLInputElement).value
  expression.value.uri.url = value
  requestParamsRef.value?.handleUriChange()
}

const handleBlur = (bodyData: any) => {
  checkTestDataSource.value.body = bodyData
}

const validateAll = async () => {
  return await props.formRef
    ?.validate([['configuration', 'expression', 'uri', 'url']])
    .then(async () => {
      if (!(await validate())) {
        return false
      }

      if (!responseResultRef.value?.isValid) {
        onlyMessage($t('DataSource.ApiSend.100020-5'), 'error')
        return false
      }

      const inputs = convertParamsToObject(dynamicParams.value)
      emit('update:expression', expression.value, checkTestDataSource.value, inputs)
      return true
    })
    .catch(() => {
      onlyMessage($t('DataSource.ApiSend.100020-6'), 'error')
      return false
    })
}

const handleSend = async () => {
  if (!(await checkTestRef.value?.validateAll())) {
    requestParamsRef.value?.handleCheckTest()
    onlyMessage($t('DataSource.ApiSend.100020-7'), 'error')
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
      const inputs = convertParamsToObject(dynamicParams.value)

      const sendParams = {
        inputs,
        expression: _expression
      }

      const res = await testAPIDataSource(props.dataSourceId, sendParams)

      if (res.status === 200) {
        checkTestDataSource.value = res.result
        onlyMessage($t('DataSource.ApiSend.100020-8'))
        emit('update:expression', expression.value, checkTestDataSource.value, inputs)
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
.api-send-container {
  height: 100%;
  width: 100%;
  padding: 15px;
  overflow-y: auto;
}
</style>
