<template>
  <a-form
    :model="formData"
    ref="formRef"
    layout="vertical"
  >
    <a-form-item
      name="uri"
      :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
      label="URI地址"
    >
      <a-input
        v-model:value="formData.uri"
        placeholder="请输入URI地址，例：http://localhost:9100"
      />
    </a-form-item>

    <a-form-item
      name="pathPrefix"
      label="路径前缀"
    >
      <a-input
        v-model:value="formData.pathPrefix"
        placeholder="请输入路径前缀（可选）"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item
      name="username"
      label="用户名"
    >
      <a-input
        v-model:value="formData.username"
        placeholder="请输入用户名（可选）"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item label="密码">
      <a-input-password
        v-model:value="formData.password"
        placeholder="请输入密码（可选）"
        :maxlength="64"
      />
    </a-form-item>

    <a-button
      :disabled="!canTestConnection"
      @click="handleTestConnection"
      :loading="connectionLoading"
    >
      测试连接
    </a-button>
  </a-form>
</template>

<script setup lang="ts" name="FormItemEs">
import { useSourceDetailStore } from '../../sourceDetail'

const emit = defineEmits(['update:modelValue', 'testConnection'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  editData: {
    type: Object,
    default: () => ({})
  }
})

const connectionLoading = ref(false)
const sourceDetailStore = useSourceDetailStore()
const formRef = ref()

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canTestConnection = computed(() => {
  const { uri } = formData.value
  return !!uri
})

const validateUri = (rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请输入URI地址')
  }

  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(value)) {
    return Promise.reject('请输入有效的URI地址，格式：http://host:port 或 https://host:port')
  }

  return Promise.resolve()
}

const handleTestConnection = () => {
  emit('testConnection', formData.value)
}

const setLoading = (val: boolean) => {
  connectionLoading.value = val
}

const validate = () => {
  return formRef.value.validate()
}

const resetFields = () => {
  formRef.value.resetFields()
}

watch(
  () => props.editData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.assign(formData.value, newData)
    }
  },
  { immediate: true, deep: true }
)

watch(
  formData,
  (newData) => {
    if (newData) {
      sourceDetailStore.saveElasticsearchData({ ...newData })
    }
  },
  { deep: true }
)

defineExpose({
  validate,
  setLoading,
  resetFields
})
</script>

<style scoped lang="less"></style>
