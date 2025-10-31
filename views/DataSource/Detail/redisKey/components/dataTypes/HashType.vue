<template>
  <div class="hash-type">
    <a-table
      :columns="columns"
      :data-source="tableData"
      :pagination="pagination"
      :scroll="{ y: tableHeight }"
      size="middle"
      bordered
      class="hash-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span class="index-cell">{{ index + 1 }}</span>
        </template>
        <template v-else-if="column.key === 'field'">
          <div class="field-cell">
            <AIcon
              type="KeyOutlined"
              class="field-icon"
            />
            {{ record.field }}
          </div>
        </template>
        <template v-else-if="column.key === 'value'">
          {{ record.value }}
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
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
    title: 'Field',
    key: 'field',
    dataIndex: 'field',
    width: 200,
    ellipsis: true
  },
  {
    title: 'Value',
    key: 'value',
    dataIndex: 'value',
    ellipsis: true
  }
]

const pagination = computed(() => {
  const total = tableData.value.length
  return total > 10
    ? {
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number) => `共 ${total} 条`,
        pageSizeOptions: ['10', '20', '50', '100']
      }
    : false
})

const tableData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const hashValue = item?.value || {}

  return Object.entries(hashValue).map(([field, value]) => ({
    field,
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

const updateTableHeight = () => {
  const windowHeight = window.innerHeight
  const calculatedHeight = windowHeight - 500
  tableHeight.value = Math.max(300, calculatedHeight)
}

onMounted(() => {
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTableHeight)
})
</script>

<style scoped lang="less">
.hash-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.hash-table {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;

  :deep(.ant-table) {
    font-size: 13px;

    .ant-table-thead > tr > th {
      background-color: #fafafa;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
      padding: 12px 16px;
    }

    .ant-table-tbody > tr > td {
      padding: 10px 16px;
    }

    .ant-table-tbody > tr:hover > td {
      background-color: #f5f5f5;
    }
  }

  .index-cell {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }

  .field-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);

    .field-icon {
      color: #faad14;
      font-size: 14px;
    }
  }
}
</style>
