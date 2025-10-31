<template>
  <CommonTable
    :data="tableData"
    :columns="columns"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index + 1 }}
    </template>
    <template #column-key="{ record }">
      {{ record.key }}
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
}>()

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center' as const
  },
  {
    title: 'Key',
    key: 'key',
    dataIndex: 'key',
    width: 200,
    ellipsis: true
  },
  {
    title: 'Value',
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

const tableData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const hashValue = item?.value || {}

  return Object.entries(hashValue).map(([key, value]) => ({
    key,
    value: String(value)
  }))
})

const handleCountUpdated = (count: number) => {
  emit('countUpdated', `共 ${count} 个值`)
}
</script>
