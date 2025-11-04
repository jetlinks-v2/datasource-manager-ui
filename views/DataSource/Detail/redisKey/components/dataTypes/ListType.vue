<template>
  <CommonTable
    :data="listData"
    :columns="columns"
    :showAction="showAction"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index }}
    </template>
    <template #column-value="{ record }">
      {{ record.value }}
    </template>
  </CommonTable>
</template>

<script setup lang="ts">
import CommonTable from './CommonTable.vue'

const props = defineProps<{
  data: any
  showAction?: boolean
}>()

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const columns = [
  {
    title: '索引',
    key: 'index',
    width: 100,
    align: 'center' as const
  },
  {
    title: '值',
    key: 'value',
    dataIndex: 'value',
    ellipsis: true
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'center' as const
  }
]

const listData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const listValue = item?.value || []

  if (!Array.isArray(listValue)) {
    return []
  }

  return listValue.map((value, index) => ({
    index,
    value: String(value)
  }))
})

const handleCountUpdated = (count: number) => {
  emit('countUpdated', `共 ${count} 个元素`)
}
</script>
