<template>
  <div class="zset-type">
    <a-table
      :columns="columns"
      :data-source="zsetData"
      :pagination="false"
      :scroll="{ y: tableHeight }"
      size="small"
      bordered
      @change="onChange"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'score'">
          <a-tag color="blue">{{ record.score }}</a-tag>
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
import type { TableProps } from 'ant-design-vue'
import PreviewPopover from './PreviewPopover.vue'

const props = defineProps<{
  data: any
}>()

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const tableHeight = ref(400)

const tableSortOrder = ref<'ascend' | 'descend' | null>(null)

const columns = computed<TableProps['columns']>(() => [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center' as const
  },
  {
    title: 'Score',
    key: 'score',
    dataIndex: 'score',
    width: 150,
    align: 'center' as const,
    sorter: (a: any, b: any) => a.score - b.score,
    sortOrder: tableSortOrder.value
  },
  {
    title: '成员',
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
])

const zsetData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const zsetValue = item?.value || {}

  if (typeof zsetValue !== 'object') {
    return []
  }

  return Object.entries(zsetValue).map(([score, value]) => ({
    value: String(value),
    score: Number(score)
  }))
})

const onChange: TableProps['onChange'] = (_, __, sorter) => {
  if (sorter && 'field' in sorter && sorter.field === 'score') {
    tableSortOrder.value = sorter.order || null
  }
}

watch(
  zsetData,
  (data) => {
    if (data.length > 0) {
      emit('countUpdated', `共 ${data.length} 个成员`)
    }
  },
  { immediate: true }
)

const calculateTableHeight = () => {
  const container = document.querySelector('.zset-type')
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
.zset-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
