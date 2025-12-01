<template>
  <a-modal
    v-model:open="visible"
    :title="$t('DataSource.OtherConfig.100033-0')"
    @ok="handleOk"
    @cancel="handleCancel"
    :ok-text="$t('DataSource.OtherConfig.100033-1')"
    :destroy-on-close="true"
  >
    <a-form
      ref="formRef"
      :model="formData"
      name="otherConfig"
      layout="vertical"
      autocomplete="off"
    >
      <a-form-item
        :label="$t('DataSource.OtherConfig.100033-2')"
        name="paramType"
        :rules="[{ required: true, message: $t('DataSource.OtherConfig.100033-3') }]"
      >
        <a-radio-group
          v-model:value="formData.paramType"
          button-style="solid"
          style="width: 100%; text-align: center; display: flex"
          @change="handleParamTypeChange"
        >
          <a-radio-button
            value="fixed"
            style="flex-grow: 1"
          >
            {{ $t('DataSource.OtherConfig.100033-7') }}
          </a-radio-button>
          <a-radio-button
            value="dynamic"
            style="flex-grow: 1"
          >
            {{ $t('DataSource.OtherConfig.100033-8') }}
          </a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        v-if="formData.paramType === 'fixed'"
        :label="$t('DataSource.OtherConfig.100033-4')"
        name="defaultValue"
        :rules="[{ required: true, message: $t('DataSource.OtherConfig.100033-5') }]"
      >
        <a-input
          v-model:value="formData.defaultValue"
          :placeholder="$t('DataSource.OtherConfig.100033-5')"
          :maxlength="64"
        />
      </a-form-item>
      <a-form-item
        :label="$t('DataSource.OtherConfig.100033-6')"
        name="required"
      >
        <a-switch v-model:checked="formData.required" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const emit = defineEmits(['save'])

const formRef = ref()
const formData = reactive({
  paramType: 'dynamic',
  defaultValue: undefined,
  required: false
})
const visible = ref(false)

const handleParamTypeChange = (e: any) => {
  if (e.target.value === 'dynamic') {
    formData.defaultValue = undefined
  }
}

const handleOk = async () => {
  const valid = await formRef.value?.validate()
  if (valid) {
    emit('save', formData)
    formRef.value?.resetFields()
    visible.value = false
  }
}

const handleCancel = () => {
  formRef.value?.resetFields()
}

const openModel = (data?: any) => {
  if (data) {
    formData.paramType = data?.paramType || 'dynamic'
    formData.defaultValue = data?.defaultValue || undefined
    formData.required = data?.required || false
  }
  visible.value = true
}

defineExpose({
  openModel
})
</script>

<style scoped lang="less"></style>
