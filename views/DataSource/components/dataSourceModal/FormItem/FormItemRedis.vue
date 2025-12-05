<template>
  <a-form
    :model="formData"
    ref="formRef"
    layout="vertical"
  >
    <a-form-item
      name="host"
      :rules="[
        { required: true, message: $t('DataSource.FormItemRedis.100079-0'), trigger: 'blur' },
        {
          pattern:
            /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$|^([a-zA-Z0-9_-]+)(\.[a-zA-Z0-9_-]+)*(\.[a-zA-Z]{2,})/,
          message: $t('DataSource.FormItemRedis.100079-1'),
          trigger: ['blur', 'change']
        }
      ]"
      :label="$t('DataSource.FormItemRedis.100079-2')"
    >
      <a-input
        v-model:value="formData.host"
        :placeholder="$t('DataSource.FormItemRedis.100079-3')"
      />
    </a-form-item>

    <a-form-item
      name="port"
      :label="$t('DataSource.FormItemRedis.100079-4')"
      :rules="[{ required: true, message: $t('DataSource.FormItemRedis.100079-5'), trigger: 'blur' }]"
    >
      <a-input-number
        v-model:value="formData.port"
        :min="0"
        :max="65536"
        :precision="0"
        placeholder="6379"
        style="width: 100%"
      />
    </a-form-item>

    <a-form-item
      name="databaseIndex"
      :label="$t('DataSource.FormItemRedis.100079-6')"
      :rules="[{ required: true, message: $t('DataSource.FormItemRedis.100079-7'), trigger: 'blur' }]"
    >
      <a-input-number
        v-model:value="formData.databaseIndex"
        :min="0"
        :max="15"
        :precision="0"
        :placeholder="$t('DataSource.FormItemRedis.100079-8')"
        style="width: 100%"
      />
    </a-form-item>

    <a-form-item
      name="userName"
      :label="$t('DataSource.FormItemRedis.100079-9')"
    >
      <a-input
        v-model:value="formData.userName"
        :placeholder="$t('DataSource.FormItemRedis.100079-10')"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item :label="$t('DataSource.FormItemRedis.100079-11')">
      <a-input-password
        v-model:value="formData.password"
        :placeholder="$t('DataSource.FormItemRedis.100079-12')"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item name="delimiter">
      <template #label>
        <a-space>
          <span>{{ $t('DataSource.FormItemRedis.100079-13') }}</span>
          <a-tooltip :title="$t('DataSource.FormItemRedis.100079-14')">
            <a-icon
              type="QuestionCircleFilled"
              style="color: #777"
            />
          </a-tooltip>
        </a-space>
      </template>
      <a-input
        v-model:value="formData.delimiter"
        allow-clear
        :placeholder="$t('DataSource.FormItemRedis.100079-15')"
        :maxlength="10"
        @blur="handleSeparatorBlur"
      />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts" name="FormItemRedis">
import { useI18n } from 'vue-i18n'
import { RedisData } from '../../type'

const { t: $t } = useI18n()

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const formRef = ref()

const formData = computed<RedisData>({
  get: () => props.modelValue as RedisData,
  set: (value) => emit('update:modelValue', value)
})

const validate = () => formRef.value?.validate()

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== ''

const canTestConnection = computed(() => {
  const { host, port, databaseIndex } = formData.value
  return Boolean(host?.trim()) && hasValue(port) && hasValue(databaseIndex)
})

const handleSeparatorBlur = () => {
  if (formData.value.delimiter) {
    const trimmedValue = formData.value.delimiter.trim()
    formData.value.delimiter = trimmedValue || ''
  }
}

watch(
  () => props.modelValue,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      Object.assign(formData.value, newData)
    }
  },
  { immediate: true, deep: true }
)

defineExpose({ validate, canTestConnection })
</script>

<style scoped lang="less"></style>
