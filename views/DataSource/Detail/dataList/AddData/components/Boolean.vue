<template>
  <div class="content-warp">
    <a-form
      :model="formData"
      layout="vertical"
      ref="formRef"
    >
      <a-form-item
        label="布尔值"
        name="trueFalse"
        :rules="[{ required: true, validator: validateInputs, trigger: 'blur' }]"
        :auto-link="false"
      >
        <div class="input-wrapper">
          <a-input
            v-model:value="formData.trueText"
            placeholder="请输入标题"
            :disabled="readonly"
            :maxlength="64"
          />
          <span>-</span>
          <a-input
            v-model:value="formData.trueValue"
            placeholder="请输入值"
            :disabled="readonly"
            :maxlength="64"
          />
        </div>
        <div class="input-wrapper">
          <a-input
            v-model:value="formData.falseText"
            placeholder="请输入标题"
            :disabled="readonly"
            :maxlength="64"
          />
          <span>-</span>
          <a-input
            v-model:value="formData.falseValue"
            placeholder="请输入值"
            :disabled="readonly"
            :maxlength="64"
          />
        </div>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'

const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { data, readonly } = toRefs(props)

const formRef = ref()
const formData = reactive({
  trueValue: 'true',
  trueText: '是',
  falseValue: 'false',
  falseText: '否',
  type: 'boolean'
})

const validateInputs = (_: any, value: string, callback: Function) => {
  const { trueValue, trueText, falseValue, falseText } = formData
  if (!trueValue || !trueText || !falseValue || !falseText) {
    callback(new Error('请输入布尔值'))
  } else {
    callback()
  }
}

const getData = async () => {
  const valid = await formRef.value.validate()
  if (valid) return formData
}

const setData = (data: object) => {
  Object.assign(formData, cloneDeep(data))
}

watch(
  data,
  () => {
    setData(data.value)
  },
  { immediate: true }
)

defineExpose({
  getData,
  setData
})
</script>

<style scoped lang="less">
.content-warp {
  width: 400px;

  .input-wrapper {
    display: flex;
    align-items: center;
    margin-top: 12px;

    span {
      margin: 0 5px;
    }
  }
}
</style>
