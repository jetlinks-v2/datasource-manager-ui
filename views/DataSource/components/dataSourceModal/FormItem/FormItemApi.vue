<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
  >
    <a-form-item
      :rules="[
        { required: true, message: '请输入API地址', trigger: 'blur' },
        {
          pattern: /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#[\]@!$&'()*+,;=]*[^\/]$/,
          message: '请输入有效的API地址',
          trigger: ['blur', 'change']
        }
      ]"
      name="api"
      label="API地址"
    >
      <a-input
        v-model:value="formData.api"
        placeholder="请输入API地址"
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
    <a-form-item label="鉴权方式">
      <a-radio-group
        v-model:value="formData.authType"
        button-style="solid"
      >
        <a-radio value="basic">基本认证</a-radio>
        <a-radio value="bearer">bearer认证</a-radio>
        <a-radio value="OAuth2">OAuth2</a-radio>
        <a-radio value="none">不鉴权</a-radio>
      </a-radio-group>
    </a-form-item>

    <div v-if="formData.authType === 'basic'">
      <a-form-item
        :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]"
        name="username"
        label="用户名"
      >
        <a-input
          v-model:value="formData.username"
          placeholder="请输入用户名"
        />
      </a-form-item>
      <a-form-item
        :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]"
        name="password"
        label="密码"
      >
        <a-input-password
          v-model:value="formData.password"
          placeholder="请输入密码"
        />
      </a-form-item>
    </div>

    <div v-if="formData.authType === 'bearer'">
      <a-form-item
        :rules="[{ required: true, message: '请输入token', trigger: 'blur' }]"
        name="token"
        label="token"
      >
        <a-input
          v-model:value="formData.token"
          placeholder="请输入token"
        />
      </a-form-item>
    </div>

    <div v-if="formData.authType === 'OAuth2'">
      <a-form-item label="模式">
        <a-radio-group
          v-model:value="formData.OAuth2.mode"
          button-style="solid"
        >
          <a-radio value="client_credentials">客户端模式</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'token']"
        :rules="[{ required: true, message: '请输入token地址', trigger: 'blur' }]"
        label="token地址"
      >
        <a-input
          v-model:value="formData.OAuth2.token"
          placeholder="请输入token地址"
        />
      </a-form-item>
      <a-form-item label="请求方式">
        <a-radio-group
          v-model:value="formData.OAuth2.request"
          button-style="solid"
        >
          <a-radio value="POST_URI">URL参数</a-radio>
          <a-radio value="POST_BODY">请求体</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'clientId']"
        :rules="[{ required: true, message: '请输入Client Id', trigger: 'blur' }]"
      >
        <template #label>
          <a-space>
            <span>Client Id</span>
            <a-tooltip>
              <template #title>应用唯一标识</template>
              <AIcon type="QuestionCircleFilled" />
            </a-tooltip>
          </a-space>
        </template>

        <a-input
          v-model:value="formData.OAuth2.clientId"
          placeholder="请输入client Id"
        />
      </a-form-item>
      <a-form-item
        :name="['OAuth2', 'clientSecret']"
        :rules="[{ required: true, message: '请输入Client Secret', trigger: 'blur' }]"
      >
        <template #label>
          <a-space>
            <span>Client Secret</span>
            <a-tooltip>
              <template #title>应用唯一标识的密钥</template>
              <AIcon type="QuestionCircleFilled" />
            </a-tooltip>
          </a-space>
        </template>

        <a-input-password
          v-model:value="formData.OAuth2.clientSecret"
          placeholder="请输入client Secret"
        />
      </a-form-item>

      <a-form-item
        label="Scope"
        :name="['OAuth2', 'scope']"
        :rules="[{ max: 64, message: '最多可输入64个字符', trigger: 'blur' }]"
      >
        <a-input
          v-model:value="formData.OAuth2.scope"
          placeholder="请输入scope"
        />
      </a-form-item>
      <a-form-item label="请求头">
        <HeaderParamsTable
          v-model="dynamicValidateForm.headers"
          ref="headersTableRef"
        />
      </a-form-item>
      <a-form-item label="参数">
        <HeaderParamsTable
          v-model="dynamicValidateForm.params"
          ref="paramsTableRef"
        />
      </a-form-item>
    </div>
  </a-form>
</template>
<script lang="ts" name="FormItemApi" setup>
import { useSourceDetailStore } from '../../../sourceDetail'
import { cloneDeep } from 'lodash-es'
import { UniversalData } from '../../type'
import HeaderParamsTable from '../HeaderParamsTable.vue'

interface Header {
  key: string
  value: string
  id: number
}

const props = defineProps({
  editData: {
    type: Object,
    default: {}
  }
})

const emit = defineEmits(['update:formData'])
const sourceDetailStore = useSourceDetailStore()
const formRef = ref()
const headersTableRef = ref()
const paramsTableRef = ref()

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

        emit('update:formData', formData.value)
        resolve(true)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

watch(
  () => props.editData,
  (newValue) => {
    if (newValue && Object.keys(newValue).length > 0) {
      Object.assign(formData.value, newValue)
      if (formData.value.authType === 'OAuth2') {
        dynamicValidateForm.value = {
          headers: newValue.OAuth2.headers || [],
          params: newValue.OAuth2.params || []
        }
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

defineExpose({
  validate
})
</script>

<style lang="less" scoped></style>
