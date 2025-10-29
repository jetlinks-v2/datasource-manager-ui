<template>
  <a-form
    :model="formData"
    ref="formRef"
    layout="vertical"
  >
    <a-form-item
      name="host"
      :rules="[
        { required: true, message: '请输入连接地址', trigger: 'blur' },
        {
          pattern:
            /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$|^([a-zA-Z0-9_-]+)(\.[a-zA-Z0-9_-]+)*(\.[a-zA-Z]{2,})/,
          message: '请输入正确的连接地址',
          trigger: ['blur', 'change']
        }
      ]"
      label="连接地址"
    >
      <a-input
        v-model:value="formData.host"
        placeholder="请输入主机地址，例：192.168.1.100 或 10.0.0.1,10.0.0.2 （Cluster）"
      />
    </a-form-item>

    <a-form-item
      name="port"
      label="端口"
      :rules="[{ required: true, message: '请输入端口号', trigger: 'blur' }]"
    >
      <a-input-number
        v-model:value="formData.port"
        :min="0"
        :max="65536"
        :precision="0"
        placeholder="请输入端口号（0-65536）"
        style="width: 100%"
      />
    </a-form-item>

    <a-form-item
      name="databaseIndex"
      label="数据库索引"
      :rules="[{ required: true, message: '请输入数据库索引', trigger: 'blur' }]"
    >
      <a-input-number
        v-model:value="formData.databaseIndex"
        :min="0"
        :max="15"
        :precision="0"
        placeholder="请输入数据库索引（0-15）"
        style="width: 100%"
      />
    </a-form-item>

    <a-form-item
      name="userName"
      label="用户名"
    >
      <a-input
        v-model:value="formData.userName"
        placeholder="ACL in Redis >= 6.0"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item label="密码">
      <a-input-password
        v-model:value="formData.password"
        placeholder="Auth"
        :maxlength="64"
      />
    </a-form-item>

    <a-form-item name="separator">
      <template #label>
        <a-space>
          <span>分隔符</span>
          <a-tooltip title="树状显示的分隔符，设置为空可以禁用树状图，直接以列表展示">
            <a-icon
              type="QuestionCircleFilled"
              style="color: #777"
            />
          </a-tooltip>
        </a-space>
      </template>
      <a-input
        v-model:value="formData.separator"
        allow-clear
        placeholder="请输入树状显示的分隔符"
        :maxlength="10"
      />
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts" name="FormItemRedis">
import { RedisData } from '../../type'

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

<style scoped lang="less"></style>
