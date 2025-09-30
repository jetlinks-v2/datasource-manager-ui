<template>
  <div class="table-sidebar">
    <ListHeader
      search-placeholder="请输入表名"
      @search="handleSearch"
    >
      <template #count>
        <slot name="header">
          共
          <a>&nbsp;{{ listData.length }}&nbsp;</a>
          个表
        </slot>
      </template>

      <template #actions>
        <a-tooltip title="刷新表">
          <a-button
            type="text"
            @click="handelRefresh"
            size="small"
          >
            <AIcon :type="refreshLoading ? 'LoadingOutlined' : 'SyncOutlined'" />
          </a-button>
        </a-tooltip>
      </template>
    </ListHeader>

    <div class="table-list">
      <a-spin :spinning="refreshLoading && listData.length === 0">
        <a-list
          v-if="filteredListData.length > 0"
          size="small"
          :data-source="filteredListData"
          :split="false"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="table-item"
              @click="handelClick(item)"
              :class="selectedItem === item.name ? 'table-item-active' : ''"
            >
              <div class="table-item-content">
                <a-space>
                  <AIcon type="TableOutlined" />
                  <j-ellipsis>{{ item.name }}</j-ellipsis>
                </a-space>
                <span
                  v-if="showFieldCount"
                  class="table-col"
                >
                  {{ item.columns?.length || 0 }}个字段
                </span>
              </div>
            </a-list-item>
          </template>
        </a-list>
        <div
          v-else
          class="empty-table"
          style="height: 100%"
        >
          <j-empty />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts" name="TableList">
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { refreshTable, getDataSourceTables } from '@datasource-manager-ui/api/data/datasource'

interface TableSchema {
  name: string
  columns: any[]
}

interface Props {
  showFieldCount?: boolean // 是否显示字段数量
  initialSelectedTable?: string // 初始选中的表名（用于数据回显）
}

const props = withDefaults(defineProps<Props>(), {
  showFieldCount: false,
  initialSelectedTable: ''
})

const emit = defineEmits(['click', 'loaded'])

const route = useRoute()
const refreshLoading = ref(false)
const searchQuery = ref('')
const sourceData = ref<TableSchema[]>([])
const listData = ref<TableSchema[]>([])
const selectedItem = ref('')

// 过滤后的数据
const filteredListData = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return listData.value
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase().trim()

  return listData.value.filter((item) => {
    return item.name.toLowerCase().includes(lowerCaseQuery)
  })
})

const handleSearch = (value: string) => {
  searchQuery.value = value
  if (filteredListData.value.length > 0) {
    handelClick(filteredListData.value[0])
  }
}

const handelClick = (clickItem: TableSchema) => {
  selectedItem.value = clickItem.name
  emit('click', {
    clickItem,
    sourceData: sourceData.value
  })
}

const handelRefresh = async () => {
  const id = route.params.id as string
  refreshLoading.value = true
  try {
    const resp = await refreshTable(id)
    if (resp.success) {
      const res = await getDataSourceTables(id)
      if (res.success) {
        sourceData.value = res.result || []
        listData.value = sourceData.value
        if (listData.value.length > 0) {
          handelClick(listData.value[0])
        }
        onlyMessage('刷新成功', 'success')
      }
    }
  } catch (error) {
    onlyMessage('刷新失败', 'error')
  } finally {
    refreshLoading.value = false
  }
}

// 初始加载数据
const loadInitialData = async () => {
  if (sourceData.value.length > 0) return

  const id = route.params.id as string
  refreshLoading.value = true
  try {
    const resp = await refreshTable(id)
    if (resp.success) {
      const res = await getDataSourceTables(id)
      if (res.success) {
        sourceData.value = res.result || []
        listData.value = sourceData.value

        emit('loaded', sourceData.value)

        if (listData.value.length > 0) {
          // 如果有初始选中的表名，则选中该表；否则选中第一个
          if (props.initialSelectedTable) {
            const targetTable = listData.value.find((item) => item.name === props.initialSelectedTable)
            if (targetTable) {
              handelClick(targetTable)
            } else {
              handelClick(listData.value[0])
            }
          } else {
            handelClick(listData.value[0])
          }
        }
      }
    }
  } catch (error) {
    console.error('加载表结构失败:', error)
  } finally {
    refreshLoading.value = false
  }
}

onMounted(() => {
  loadInitialData()
})
</script>

<style scoped lang="less">
.table-sidebar {
  width: 250px;
  min-width: 250px;
  max-width: 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px 0 0 8px;
  margin-right: 4px;
}

.table-list {
  flex: 1;
  overflow: auto;

  :deep(.ant-list) {
    padding-right: 4px;
  }
}

.table-item {
  width: 100%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin: 0 0 4px 0;

  &:hover {
    background-color: #f5f5f5;
  }

  .table-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .table-col {
      color: #999;
      font-size: 12px;
      white-space: nowrap;
      margin-left: 8px;
    }
  }
}

.table-item-active {
  background-color: #f0f9ff;
  border-color: #d0ebff;

  .anticon {
    color: #1890ff;
  }

  :deep(.j-ellipsis) {
    color: #1890ff;
  }
}

.empty-table {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
