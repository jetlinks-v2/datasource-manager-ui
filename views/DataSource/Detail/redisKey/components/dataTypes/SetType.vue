<template>
  <CommonTable
    :data="setData"
    :columns="columns"
    :showAction="showAction"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index + 1 }}
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
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center' as const
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

const setData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const setValue = item?.value || []

  if (!Array.isArray(setValue)) {
    return []
  }

  return setValue.map((value) => ({
    value: String(value)
  }))
})

const handleCountUpdated = (count: number) => {
  emit('countUpdated', `共 ${count} 个元素`)
}
</script>
