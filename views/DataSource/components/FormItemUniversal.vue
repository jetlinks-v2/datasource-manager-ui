<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
  >
    <a-form-item
      :rules="[
        { required: true, message: $t('DataSource.FormUniversal.100007-1'), trigger: 'blur' },
        {
          pattern: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=]*[^/]$/,
          message: $t('DataSource.FormUniversal.100007-2'),
          trigger: ['blur', 'change']
        }
      ]"
      name="api"
      :label="$t('DataSource.FormUniversal.100007-0')"
    >
      <a-input
        v-model:value="formData.api"
        :placeholder="$t('DataSource.FormUniversal.100007-1')"
      >
        <template #addonBefore>
          <a-select
            v-model:value="formData.protocol"
            style="width: 100px"
          >
            <a-select-option value="http://">http://</a-select-option>
            <a-select-option value="https://">https://</a-select-option>
          </a-select>
        </template>
      </a-input>
    </a-form-item>
    <a-form-item :label="$t('DataSource.FormUniversal.100007-3')">
      <a-radio-group
        v-model:value="formData.authType"
        button-style="solid"
      >
        <a-radio value="basic">{{ $t('DataSource.FormUniversal.100007-4') }}</a-radio>
        <a-radio value="bearer">{{ $t('DataSource.FormUniversal.100007-5') }}</a-radio>
        <a-radio value="OAuth2">OAuth2</a-radio>
        <a-radio value="none">{{ $t('DataSource.FormUniversal.100007-6') }}</a-radio>
      </a-radio-group>
    </a-form-item>

    <div v-if="formData.authType === 'basic'">
      <a-form-item
        :rules="[{ required: true, message: $t('DataSource.FormRelation.100006-16'), trigger: 'blur' }]"
        name="username"
        :label="$t('DataSource.FormRelation.100006-15')"
      >
        <a-input
          v-model:value="formData.username"
          :placeholder="$t('DataSource.FormRelation.100006-16')"
        />
      </a-form-item>
      <a-form-item
        :rules="[{ required: true, message: $t('DataSource.FormUniversal.100007-7'), trigger: 'blur' }]"
        name="password"
        :label="$t('DataSource.FormRelation.100006-17')"
      >
        <a-input-password
          v-model:value="formData.password"
          :placeholder="$t('DataSource.FormUniversal.100007-7')"
        />
      </a-form-item>
    </div>

    <div v-if="formData.authType === 'bearer'">
      <a-form-item
        :rules="[{ required: true, message: $t('DataSource.FormUniversal.100007-8'), trigger: 'blur' }]"
        name="token"
        label="token"
      >
        <a-input
          v-model:value="formData.token"
          :placeholder="$t('DataSource.FormUniversal.100007-8')"
        />
      </a-form-item>
    </div>

    <div v-if="formData.authType === 'OAuth2'">
      <a-form-item :label="$t('DataSource.FormUniversal.100007-9')">
        <a-radio-group
          v-model:value="formData.OAuth2.mode"
          button-style="solid"
        >
          <a-radio value="client_credentials">{{ $t('DataSource.FormUniversal.100007-10') }}</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'token']"
        :rules="[{ required: true, message: $t('DataSource.FormUniversal.100007-12'), trigger: 'blur' }]"
        :label="$t('DataSource.FormUniversal.100007-11')"
      >
        <a-input
          v-model:value="formData.OAuth2.token"
          :placeholder="$t('DataSource.FormUniversal.100007-12')"
        />
      </a-form-item>
      <a-form-item :label="$t('DataSource.FormUniversal.100007-13')">
        <a-radio-group
          v-model:value="formData.OAuth2.request"
          button-style="solid"
        >
          <a-radio value="POST_URI">{{ $t('DataSource.FormUniversal.100007-14') }}</a-radio>
          <a-radio value="POST_BODY">{{ $t('DataSource.FormUniversal.100007-15') }}</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'clientId']"
        :rules="[{ required: true, message: $t('DataSource.FormUniversal.100007-17'), trigger: 'blur' }]"
      >
        <template #label>
          <a-space>
            <span>Client Id</span>
            <a-tooltip>
              <template #title>{{ $t('DataSource.FormUniversal.100007-16') }}</template>
              <AIcon type="QuestionCircleFilled" />
            </a-tooltip>
          </a-space>
        </template>

        <a-input
          v-model:value="formData.OAuth2.clientId"
          :placeholder="$t('DataSource.FormUniversal.100007-17')"
        />
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'clientSecret']"
        :rules="[{ required: true, message: $t('DataSource.FormUniversal.100007-19'), trigger: 'blur' }]"
      >
        <template #label>
          <a-space>
            <span>Client Secret</span>
            <a-tooltip>
              <template #title>{{ $t('DataSource.FormUniversal.100007-18') }}</template>
              <AIcon type="QuestionCircleFilled" />
            </a-tooltip>
          </a-space>
        </template>

        <a-input-password
          v-model:value="formData.OAuth2.clientSecret"
          :placeholder="$t('DataSource.FormUniversal.100007-19')"
        />
      </a-form-item>

      <a-form-item
        label="Scope"
        :name="['OAuth2', 'scope']"
        :rules="[{ max: 64, message: $t('DataSource.SourceAdd.100005-4'), trigger: 'blur' }]"
      >
        <a-input
          v-model:value="formData.OAuth2.scope"
          placeholder="请输入scope"
        />
      </a-form-item>
      <a-form-item :label="$t('DataSource.FormUniversal.100007-20')">
        <a-table
          :columns="columns"
          :dataSource="dynamicValidateForm.headers"
          :pagination="false"
          rowKey="id"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'key'">
              <FormItem
                v-model:value="record.key"
                placeholder="Key"
                :error="formItemErrors[record.id]?.key"
                @change="(val: string) => handleFieldChange(val, 'key', record)"
              />
            </template>
            <template v-else-if="column.key === 'value'">
              <FormItem
                v-model:value="record.value"
                placeholder="Value"
                :error="formItemErrors[record.id]?.value"
                @change="(val: string) => handleFieldChange(val, 'value', record)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button
                type="text"
                size="small"
                @click="() => removeHeader(record, 'headers')"
              >
                <AIcon
                  type="DeleteOutlined"
                  style="color: var(--ant-error-color)"
                />
              </a-button>
            </template>
          </template>
        </a-table>
        <a-form-item>
          <a-button
            block
            type="dashed"
            @click="() => addHeader('headers')"
          >
            {{ $t('DataSource.FormUniversal.100007-22') }}
          </a-button>
        </a-form-item>
      </a-form-item>
      <a-form-item :label="$t('DataSource.FormUniversal.100007-21')">
        <a-table
          :columns="columns"
          :dataSource="dynamicValidateForm.params"
          :pagination="false"
          rowKey="id"
          size="small"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'key'">
              <FormItem
                v-model:value="record.key"
                placeholder="Key"
                :error="formItemErrors[record.id]?.key"
                @change="(val: string) => handleFieldChange(val, 'key', record)"
              />
            </template>
            <template v-else-if="column.key === 'value'">
              <FormItem
                v-model:value="record.value"
                placeholder="Value"
                :error="formItemErrors[record.id]?.value"
                @change="(val: string) => handleFieldChange(val, 'value', record)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button
                type="text"
                size="small"
                @click="() => removeHeader(record, 'params')"
              >
                <AIcon
                  type="DeleteOutlined"
                  style="color: var(--ant-error-color)"
                />
              </a-button>
            </template>
          </template>
        </a-table>
        <a-form-item>
          <a-button
            block
            type="dashed"
            @click="() => addHeader('params')"
          >
            {{ $t('DataSource.FormUniversal.100007-22') }}
          </a-button>
        </a-form-item>
      </a-form-item>
    </div>
  </a-form>
</template>
<script lang="ts" name="FormItemUniversal" setup>
import { useSourceDetailStore } from '@datasource-manager-ui/stores/sourceDetail'
import { cloneDeep } from 'lodash-es'
import FormItem from './FormItem.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const sourceDetailStore = useSourceDetailStore()

interface Header {
  key: string
  value: string
  id: number
}

const formItemErrors = ref<Record<string | number, Record<string, string>>>({})

//表头
const columns: any[] = [
  {
    title: 'Key',
    dataIndex: 'key',
    key: 'key'
  },
  {
    title: 'Value',
    dataIndex: 'value',
    key: 'value'
  },
  {
    title: $t('DataSource.table.100003-8'),
    key: 'action',
    align: 'center'
  }
]

//表单
const dynamicValidateForm = ref<{ headers: Header[]; params: Header[] }>({
  headers: [
    {
      key: '',
      value: '',
      id: Date.now()
    }
  ],
  params: [
    {
      key: '',
      value: '',
      id: Date.now() + 1
    }
  ]
})

const props = defineProps({
  editData: {
    type: Object,
    default: {}
  }
})

const emit = defineEmits(['update:formData'])
const formRef = ref()
const formData = ref<any>({
  api: '',
  protocol: 'http://',
  authType: 'basic',
  username: '',
  password: '',

  token: '',

  OAuth2: {
    mode: 'client_credentials',
    token: '',
    request: 'POST_URI',
    clientId: '',
    clientSecret: '',
    scope: '',
    headers: dynamicValidateForm.value.headers,
    params: dynamicValidateForm.value.params
  }
})

const validateField = (value: string, field: 'key' | 'value'): string => {
  if (value && value.length > 256) {
    return $t('DataSource.FormUniversal.100007-24')
  }
  return ''
}

const updateFormError = (recordId: string | number, field: string, error?: string): boolean => {
  if (!formItemErrors.value[recordId]) {
    formItemErrors.value[recordId] = {}
  }
  if (error) {
    formItemErrors.value[recordId][field] = error
    return true
  }
  delete formItemErrors.value[recordId][field]
  if (!Object.keys(formItemErrors.value[recordId]).length) {
    delete formItemErrors.value[recordId]
  }
  return false
}

const handleFieldChange = (val: string, field: 'key' | 'value', record: any) => {
  record[field] = val
  updateFormError(record.id, field)

  const lengthError = validateField(val, field)
  if (lengthError) {
    updateFormError(record.id, field, lengthError)
  }

  const isKeyField = field === 'key'
  const isValueField = field === 'value'

  if (isValueField && val && !record.key) {
    updateFormError(record.id, 'key', $t('DataSource.FormUniversal.100007-23'))
  }

  if (isKeyField && !val && record.value) {
    updateFormError(record.id, 'key', $t('DataSource.FormUniversal.100007-23'))
  }
}

// 表单数据校验
const validateFormData = (): boolean => {
  formItemErrors.value = {}
  let hasError = false

  // 统一校验函数
  const validateRecord = (record: Header) => {
    // 只有当value有值时，key才必填
    if (record.value && !record.key) {
      hasError = true
      updateFormError(record.id, 'key', $t('DataSource.FormUniversal.100007-23'))
    }

    // 字段长度校验
    const keyErr = validateField(record.key, 'key')
    const valueErr = validateField(record.value, 'value')

    if (keyErr) {
      hasError = true
      updateFormError(record.id, 'key', keyErr)
    }
    if (valueErr) {
      hasError = true
      updateFormError(record.id, 'value', valueErr)
    }
  }

  dynamicValidateForm.value.headers.forEach(validateRecord)
  dynamicValidateForm.value.params.forEach(validateRecord)

  return !hasError
}

const removeHeader = (item: Header, type: 'headers' | 'params') => {
  let index = dynamicValidateForm.value[type].indexOf(item)
  if (index !== -1) {
    dynamicValidateForm.value[type].splice(index, 1)
    // 清除对应的错误状态
    delete formItemErrors.value[item.id]
  }
}

const addHeader = (type: 'headers' | 'params') => {
  dynamicValidateForm.value[type].push({
    key: '',
    value: '',
    id: Date.now()
  })
}

const validate = () => {
  return new Promise((resolve, reject) => {
    // 先校验基本表单
    formRef.value
      .validate()
      .then(() => {
        // 再校验动态表单数据
        const isFormDataValid = validateFormData()
        if (!isFormDataValid) {
          reject(new Error('请完善参数信息'))
          return
        }

        // 过滤掉key和value都为空的数据
        const filteredHeaders = dynamicValidateForm.value.headers.filter((item) => item.key || item.value)
        const filteredParams = dynamicValidateForm.value.params.filter((item) => item.key || item.value)

        // 更新OAuth2数据
        formData.value.OAuth2.headers = filteredHeaders
        formData.value.OAuth2.params = filteredParams

        emit('update:formData', formData.value)
        resolve(true)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

onMounted(() => {
  if (sourceDetailStore.checkType && sourceDetailStore.cachedData?.type === sourceDetailStore.checkType) {
    formData.value = cloneDeep(sourceDetailStore.genericLibraryData)
    dynamicValidateForm.value = cloneDeep(sourceDetailStore.headerParams)
  }
})

onBeforeUnmount(() => {
  // 缓存数据
  sourceDetailStore.saveGenericData({ ...formData.value })
  // 缓存请求头参数
  sourceDetailStore.saveHeaderData({ ...dynamicValidateForm.value })
})

watch(
  () => props.editData,
  (newValue) => {
    for (const key in newValue) {
      formData.value[key] = newValue[key]
    }
    if (formData.value.authType === 'OAuth2') {
      dynamicValidateForm.value = {
        headers: props.editData.OAuth2.headers || [],
        params: props.editData.OAuth2.params || []
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => formData.value.api,
  (newValue) => {
    if (newValue) {
      if (newValue.includes('https') || newValue.includes('http')) {
        formData.value.protocol = newValue.includes('https') ? 'https://' : 'http://'
        formData.value.api = newValue.replace(/^(?:http(s)?:\/\/)?/, '')
      }
    }
  },
  { deep: true }
)

defineExpose({
  validate
})
</script>

<style lang="less" scoped></style>
