<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
    labelAlign="left"
  >
    <a-form-item
      name="handshakeTimeout"
      :rules="[{ type: 'number', min: 0, message: $t('DataSource.FormItemWebSocket.100080-0'), trigger: 'change' }]"
      :label="$t('DataSource.FormItemWebSocket.100080-1')"
    >
      <a-input-number
        v-model:value="formData.handshakeTimeout"
        :min="0"
        :placeholder="$t('DataSource.FormItemWebSocket.100080-2')"
        style="width: 100%"
        :addon-after="$t('DataSource.FormItemWebSocket.100080-3')"
      />
    </a-form-item>

    <a-form-item
      name="reconnectionAttempts"
      :rules="[{ type: 'number', min: 0, message: $t('DataSource.FormItemWebSocket.100080-4'), trigger: 'change' }]"
      :label="$t('DataSource.FormItemWebSocket.100080-5')"
    >
      <a-input-number
        v-model:value="formData.reconnectionAttempts"
        :min="0"
        :placeholder="$t('DataSource.FormItemWebSocket.100080-6')"
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
      :rules="[{ type: 'number', min: 0, message: $t('DataSource.FormItemWebSocket.100080-7'), trigger: 'change' }]"
      :label="$t('DataSource.FormItemWebSocket.100080-8')"
    >
      <a-input-number
        v-model:value="formData.maxMessageSize"
        :min="0"
        :placeholder="$t('DataSource.FormItemWebSocket.100080-9')"
        style="width: 100%"
        :addon-after="$t('DataSource.FormItemWebSocket.100080-10')"
      />
    </a-form-item>

    <a-form-item
      name="reconnectionIntervals"
      :rules="[{ type: 'number', min: 0, message: $t('DataSource.FormItemWebSocket.100080-11'), trigger: 'change' }]"
      :label="$t('DataSource.FormItemWebSocket.100080-12')"
    >
      <a-input-number
        v-model:value="formData.reconnectionIntervals"
        :min="0"
        :placeholder="$t('DataSource.FormItemWebSocket.100080-13')"
        style="width: 100%"
        :addon-after="$t('DataSource.FormItemWebSocket.100080-3')"
      />
    </a-form-item>

    <a-form-item
      :label="$t('DataSource.FormItemWebSocket.100080-14')"
      name="payloadType"
    >
      <a-select
        v-model:value="formData.payloadType"
        :placeholder="$t('DataSource.FormItemWebSocket.100080-15')"
      >
        <a-select-option value="JSON">{{ $t('DataSource.FormItemWebSocket.100080-16') }}</a-select-option>
        <a-select-option value="STRING">{{ $t('DataSource.FormItemWebSocket.100080-17') }}</a-select-option>
        <a-select-option value="BINARY">{{ $t('DataSource.FormItemWebSocket.100080-18') }}</a-select-option>
      </a-select>
    </a-form-item>
  </a-form>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

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
