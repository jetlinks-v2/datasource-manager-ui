<template>
  <a-form
    :model="formData"
    ref="formRef"
    layout="vertical"
  >
    <a-form-item
      name="uri"
      :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
      :label="$t('DataSource.FormItemEs.100073-0')"
    >
      <a-input
        v-model:value="formData.uri"
        :placeholder="$t('DataSource.FormItemEs.100073-1')"
      />
    </a-form-item>

    <a-form-item
      name="pathPrefix"
      :label="$t('DataSource.FormItemEs.100073-2')"
    >
      <a-input
        v-model:value="formData.pathPrefix"
        :placeholder="$t('DataSource.FormItemEs.100073-3')"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item
      name="username"
      :label="$t('DataSource.FormItemEs.100073-4')"
    >
      <a-input
        v-model:value="formData.username"
        :placeholder="$t('DataSource.FormItemEs.100073-5')"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item :label="$t('DataSource.FormItemEs.100073-6')">
      <a-input-password
        v-model:value="formData.password"
        :placeholder="$t('DataSource.FormItemEs.100073-7')"
        :maxlength="64"
      />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts" name="FormItemEs">
import { useI18n } from 'vue-i18n'
import { useSourceDetailStore } from '../../../sourceDetail'

const { t: $t } = useI18n()

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

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
    return Promise.reject($t('DataSource.FormItemEs.100073-8'))
  }

  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(value)) {
    return Promise.reject($t('DataSource.FormItemEs.100073-9'))
  }

  return Promise.resolve()
}

const validate = () => formRef.value.validate()

watch(
  () => props.modelValue,
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
  canTestConnection
})
</script>

<style scoped lang="less"></style>
