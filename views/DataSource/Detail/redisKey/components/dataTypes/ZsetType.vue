<template>
  <div class="zset-type">
    <div class="zset-header">
      <a-radio-group
        v-model:value="sortOrder"
        size="small"
      >
        <a-radio-button value="asc">
          <AIcon type="SortAscendingOutlined" />
          Score 升序
        </a-radio-button>
        <a-radio-button value="desc">
          <AIcon type="SortDescendingOutlined" />
          Score 降序
        </a-radio-button>
      </a-radio-group>
    </div>
    <a-table
      :columns="columns"
      :data-source="sortedData"
      :pagination="pagination"
      :scroll="{ y: tableHeight }"
      size="middle"
      bordered
      class="zset-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span class="index-cell">{{ index + 1 }}</span>
        </template>
        <template v-else-if="column.key === 'score'">
          <div class="score-cell">
            <a-tag color="blue">{{ record.score }}</a-tag>
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
const sortOrder = ref<'asc' | 'desc'>('desc')

const columns = [
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
    width: 120,
    align: 'center' as const
  },
  {
    title: '成员',
    key: 'value',
    dataIndex: 'value',
    ellipsis: true
  }
]

const pagination = computed(() => {
  const total = zsetData.value.length
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

const zsetData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const zsetValue = item?.value || {}

  if (typeof zsetValue !== 'object') {
    return []
  }

  return Object.entries(zsetValue).map(([value, score]) => ({
    value: String(value),
    score: Number(score)
  }))
})

const sortedData = computed(() => {
  const data = [...zsetData.value]
  return data.sort((a, b) => {
    if (sortOrder.value === 'asc') {
      return a.score - b.score
    } else {
      return b.score - a.score
    }
  })
})

watch(
  zsetData,
  (data) => {
    if (data.length > 0) {
      emit('countUpdated', `共 ${data.length} 个成员`)
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
.zset-type {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.zset-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 6px;

  .ant-radio-group {
    .ant-radio-button-wrapper {
      font-size: 12px;
      padding: 0 12px;
      height: 28px;
      line-height: 26px;

      .anticon {
        margin-right: 4px;
      }
    }
  }
}

.zset-table {
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

  .score-cell {
    display: flex;
    justify-content: center;

    .ant-tag {
      font-size: 13px;
      font-weight: 600;
      margin: 0;
      padding: 2px 12px;
    }
  }
}
</style>
