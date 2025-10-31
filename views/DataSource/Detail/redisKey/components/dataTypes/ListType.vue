<template>
  <div class="list-type">
    <a-table
      :columns="columns"
      :data-source="listData"
      :pagination="false"
      :scroll="{ y: tableHeight }"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index }}
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

const tableHeight = ref(400)

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
const listData = ref<any[]>([])

watch(
  () => props.data,
  (newData) => {
    if (!newData || !Array.isArray(newData) || newData.length === 0) {
      listData.value = []
      return
    }

    const item = newData[0]
    const listValue = item?.value || []

    if (!Array.isArray(listValue)) {
      listData.value = []
      return
    }

    listData.value = listValue.map((value, index) => ({
      index,
      value: String(value)
    }))
  },
  { deep: true, immediate: true }
)

watch(
  listData,
  (data) => {
    if (data.length > 0) {
      emit('countUpdated', `共 ${data.length} 个元素`)
    }
  },
  { immediate: true }
)

const calculateTableHeight = () => {
  const container = document.querySelector('.list-type')
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
.list-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
