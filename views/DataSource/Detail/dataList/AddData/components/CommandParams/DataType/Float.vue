<template>
  <div class="content-warp">
    <a-form
      ref="formRef"
      :model="formData"
      layout="vertical"
    >
      <a-form-item
        label="精度"
        name="scale"
      >
        <a-input-number
          v-model:value="formData.scale"
          style="width: 100%"
          :min="0"
          :max="99"
          :precision="0"
          :disabled="readonly"
          placeholder="请输入0-99以内的整数"
        />
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

const formData = reactive({ scale: 0, type: 'float' })
const formRef = ref()

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
  width: 100%;
}
</style>
