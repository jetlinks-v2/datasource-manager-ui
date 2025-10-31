<template>
  <div class="hash-type">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="false"
      size="small"
      bordered
      :scroll="{ y: tableHeight }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'key'">
          {{ record.key }}
        </template>
        <template v-else-if="column.key === 'value'">
          {{ record.value }}
        </template>
        <template v-else-if="column.key === 'action'">
          <PreviewPopover :content="record.value" />
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import PreviewPopover from './PreviewPopover.vue'

const props = defineProps<{
  data: any
}>()

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const tableHeight = ref(300)

const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center' as const
  },
  {
    title: 'key',
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

watch(
  tableData,
  (data) => {
    if (data.length > 0) {
      emit('countUpdated', `共 ${data.length} 个字段`)
    }
  },
  { immediate: true }
)

const calculateTableHeight = () => {
  const container = document.querySelector('.hash-type')
  if (container) {
    const containerHeight = container.clientHeight
    tableHeight.value = Math.max(containerHeight - 80, 100)
  }
}

onMounted(() => {
  nextTick(() => {
    calculateTableHeight()
    window.addEventListener('resize', calculateTableHeight)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>

<style scoped lang="less">
.hash-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
