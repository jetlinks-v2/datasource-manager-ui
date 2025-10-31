<template>
  <div class="list-type">
    <a-table
      :columns="columns"
      :data-source="listData"
      :pagination="pagination"
      :scroll="{ y: tableHeight }"
      size="middle"
      bordered
      class="list-table"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span class="index-cell">{{ index }}</span>
        </template>
        <template v-else-if="column.key === 'value'">
          {{ record.value }}
        </template>
        <template v-else-if="column.key === 'action'">
          <div
            v-if="record.previewVisible"
            class="popover-modal-mask"
            @click="record.previewVisible = false"
          ></div>
          <!-- 预览弹窗 -->
          <a-popover
            :open="record.previewVisible"
            trigger="click"
            placement="left"
          >
            <template #content>
              <div class="preview-wrapper">
                <StringType
                  :data="[{ value: record.value }]"
                  width="500px"
                  height="400px"
                />
              </div>
            </template>
            <AIcon
              type="EyeOutlined"
              class="preview-icon"
              @click="record.previewVisible = true"
            />
          </a-popover>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import StringType from './StringType.vue'

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

const pagination = computed(() => {
  const total = listData.value.length
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
      value: String(value),
      previewVisible: false
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
.list-type {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.popover-modal-mask {
  position: fixed;
  height: 100vh;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1030;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(1px);
}

.list-table {
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

  .preview-icon {
    font-size: 16px;
    color: #1890ff;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      color: #40a9ff;
      transform: scale(1.1);
    }
  }
}

.preview-wrapper {
  padding: 8px;
  min-width: 500px;
}
</style>
