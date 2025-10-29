<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
    labelAlign="left"
  >
    <a-form-item
      name="handshakeTimeout"
      :rules="[{ type: 'number', min: 0, message: '请输入有效的超时时间', trigger: 'change' }]"
      label="请求等待超时"
    >
      <a-input-number
        v-model:value="formData.handshakeTimeout"
        :min="0"
        placeholder="如果设置为0，表示永不超时，不填默认为0"
        style="width: 100%"
        addon-after="ms"
      />
    </a-form-item>

    <a-form-item
      name="reconnectionAttempts"
      :rules="[{ type: 'number', min: 0, message: '请输入有效的重连次数', trigger: 'change' }]"
      label="最大重连次数"
    >
      <a-input-number
        v-model:value="formData.reconnectionAttempts"
        :min="0"
        placeholder="0表示不重连，-1表示无限重连，不填默认为0"
        style="width: 100%"
      />
    </a-form-item>

    <!-- <a-form-item name="sslIgnore">
      <label>
        <a-space>
          <span>是否忽略SSL认证</span>
          <a-tooltip>
            <template #title>
              <span>浏览器环境通常无法忽略证书校验，该选项更适用于Node/Electron。</span>
            </template>
            <AIcon type="QuestionCircleFilled" />
          </a-tooltip>
        </a-space>
      </label>
      <div>
        <a-switch v-model:checked="formData.sslIgnore" />
      </div>
    </a-form-item> -->

    <a-form-item
      name="maxMessageSize"
      :rules="[{ type: 'number', min: 0, message: '请输入有效的消息大小', trigger: 'change' }]"
      label="允许接收的最大消息大小"
    >
      <a-input-number
        v-model:value="formData.maxMessageSize"
        :min="0"
        placeholder="不填默认为2MB"
        style="width: 100%"
        addon-after="MB"
      />
    </a-form-item>

    <a-form-item
      name="reconnectionIntervals"
      :rules="[{ type: 'number', min: 0, message: '请输入有效的重连间隔', trigger: 'change' }]"
      label="重连间隔时间"
    >
      <a-input-number
        v-model:value="formData.reconnectionIntervals"
        :min="0"
        placeholder="不填默认为5000毫秒"
        style="width: 100%"
        addon-after="ms"
      />
    </a-form-item>

    <a-form-item
      label="数据类型"
      name="payloadType"
    >
      <a-select
        v-model:value="formData.payloadType"
        placeholder="请选择数据类型"
      >
        <a-select-option value="JSON">JSON</a-select-option>
        <a-select-option value="STRING">STRING（文本）</a-select-option>
        <a-select-option value="BINARY">BINARY（二进制）</a-select-option>
      </a-select>
    </a-form-item>
  </a-form>
</template>

<script lang="ts" setup>
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const formRef = ref<any>()

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

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

defineExpose({ validate })
</script>

<style lang="less" scoped>
.form-item-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
