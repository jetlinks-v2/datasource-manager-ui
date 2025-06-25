<template>
  <a-modal
    v-model:visible="visible"
    title="其他配置"
    @ok="handleOk"
    @cancel="handleCancel"
    ok-text="保存"
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
        label="参数类型"
        name="paramType"
        :rules="[{ required: true, message: '请选择参数类型' }]"
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
            固定参数
          </a-radio-button>
          <a-radio-button
            value="dynamic"
            style="flex-grow: 1"
          >
            动态参数
          </a-radio-button>
        </a-radio-group>
      </a-form-item>
      <a-form-item
        v-if="formData.paramType === 'fixed'"
        label="固定值"
        name="defaultValue"
        :rules="[{ required: true, message: '请输入固定值' }]"
      >
        <a-input
          v-model:value="formData.defaultValue"
          placeholder="请输入固定值"
          :maxlength="64"
        />
      </a-form-item>
      <a-form-item
        label="是否必填"
        name="required"
      >
        <a-switch v-model:checked="formData.required" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
<script setup lang="ts">
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
