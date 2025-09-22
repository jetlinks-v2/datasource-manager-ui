<template>
  <div class="content-warp">
    <a-form
      :model="formData"
      layout="vertical"
      ref="formRef"
    >
      <a-form-item
        label="时间格式"
        name="format"
        :rules="[{ required: true, message: '请选择时间格式' }]"
      >
        <a-select
          v-model:value="formData.format"
          placeholder="请选择时间格式"
          style="width: 100%"
          :options="formatOptions"
          :filter-option="filterOption"
          :disabled="readonly"
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

const formRef = ref()
const formData = reactive({ format: 'yyyy-MM-dd HH:mm:ss', type: 'date' })
const formatOptions = ref([{ value: 'yyyy-MM-dd HH:mm:ss' }, { value: 'yyyy-MM-dd' }, { value: 'HH:mm:ss' }])

const filterOption = (input: string, option: any) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}

const getData = async () => {
  const valid = await formRef.value.validate()
  if (valid) return formData
}

const setData = (data: object) => {
  Object.assign(formData, cloneDeep(data))
  if (!formData.format) {
    formData.format = formatOptions.value[0].value
  }
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
  width: 250px;
}
</style>
