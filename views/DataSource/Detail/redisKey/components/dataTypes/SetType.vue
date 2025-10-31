<template>
  <div class="set-type">
    <a-table
      :columns="columns"
      :data-source="setData"
      :pagination="false"
      :scroll="{ y: tableHeight }"
      size="small"
      bordered
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
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
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center' as const
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

watch(
  setData,
  (data) => {
    if (data.length > 0) {
      emit('countUpdated', `共 ${data.length} 个成员`)
    }
  },
  { immediate: true }
)

const calculateTableHeight = () => {
  const container = document.querySelector('.set-type')
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
.set-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
