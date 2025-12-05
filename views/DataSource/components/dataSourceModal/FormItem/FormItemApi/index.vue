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
          pattern: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#[\]@!$&'()*+,;=]*[^\/]$/,
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
        <HeaderParamsTable
          v-model="dynamicValidateForm.headers"
          ref="headersTableRef"
        />
      </a-form-item>
      <a-form-item :label="$t('DataSource.FormUniversal.100007-21')">
        <HeaderParamsTable
          v-model="dynamicValidateForm.params"
          ref="paramsTableRef"
        />
      </a-form-item>
    </div>
  </a-form>
</template>
<script lang="ts" name="FormItemApi" setup>
import { useSourceDetailStore } from '../../../../sourceDetail'
import { UniversalData } from '../../../type'
import HeaderParamsTable from './HeaderParamsTable.vue'
import { cloneDeep } from 'lodash-es'
import FormItem from './FormItem.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

interface Header {
  key: string
  value: string
  id: number
}

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])
const sourceDetailStore = useSourceDetailStore()
const formRef = ref()
const headersTableRef = ref()
const paramsTableRef = ref()

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

const formData = ref<UniversalData>({
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

const validate = () => {
  return new Promise((resolve, reject) => {
    // 先校验基本表单
    formRef.value
      .validate()
      .then(() => {
        // 再校验动态表单数据
        const isHeadersValid = headersTableRef.value?.validate() ?? true
        const isParamsValid = paramsTableRef.value?.validate() ?? true

        if (!isHeadersValid || !isParamsValid) {
          reject(new Error('请完善参数信息'))
          return
        }

        // 过滤掉key和value都为空的数据
        const filteredHeaders = dynamicValidateForm.value.headers.filter((item) => item.key || item.value)
        const filteredParams = dynamicValidateForm.value.params.filter((item) => item.key || item.value)

        // 更新OAuth2数据
        formData.value.OAuth2.headers = filteredHeaders
        formData.value.OAuth2.params = filteredParams

        emit('update:modelValue', formData.value)
        resolve(true)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

const syncFormData = (newValue: any) => {
  if (newValue && Object.keys(newValue).length > 0) {
    Object.assign(formData.value, cloneDeep(newValue))
    if (formData.value.authType === 'OAuth2') {
      dynamicValidateForm.value = {
        headers: newValue.OAuth2?.headers || [],
        params: newValue.OAuth2?.params || []
      }
    }
  }
}

watch(
  () => props.modelValue,
  (newValue) => syncFormData(newValue),
  { deep: true }
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

onMounted(() => {
  if (sourceDetailStore.checkType && sourceDetailStore.cachedData?.type === sourceDetailStore.checkType) {
    formData.value = cloneDeep(sourceDetailStore.genericLibraryData)
    dynamicValidateForm.value = cloneDeep(sourceDetailStore.headerParams)
  }
})

onBeforeUnmount(() => {
  sourceDetailStore.saveGenericData({ ...formData.value })
  sourceDetailStore.saveHeaderData({ ...dynamicValidateForm.value })
})

defineExpose({ validate })
</script>

<style lang="less" scoped></style>
