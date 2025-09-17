<template>
  <div class="object-container">
    <CommandTable
      ref="commandTableRef"
      add-button
      :data-source="formData.properties"
      :columns="defaultParamsColumns"
      :preview="readonly"
      mode="treeTable"
      :showExpandColumn="false"
      :scroll="{ y: 372, x: 600 }"
      @update="handleUpdate"
    />
  </div>
</template>
<script setup lang="ts">
import { randomString } from '@jetlinks-web/utils'
import CommandTable from './CommandParams/CommandTable.vue'
import { defaultParamsColumns } from './setting'
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
const commandTableRef = ref()
const formData = reactive<{ properties: any[] }>({ properties: [] })

const handleUpdate = (data: any[]) => {
  formData.properties = data
}

const getData = () => {
  const hasError = commandTableRef.value.validateAllData()
  if (hasError) {
    return {
      error: '请完善结构体配置'
    }
  }

  return {
    properties: formData.properties.filter((ele) => ele.id && ele.name),
    type: 'object'
  }
}

const setData = (data: object) => {
  Object.assign(formData, cloneDeep(data))
  if (!formData.properties.length) {
    formData.properties = [
      {
        key: randomString(6),
        id: '',
        name: ''
      }
    ]
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
.object-container {
  margin-bottom: 10px;
  width: 500px;
}
</style>
