<template>
  <div class="table-sidebar">
    <ListHeader
      search-placeholder="请输入表名"
      @search="handleSearch"
    >
      <template #count>
        共
        <a>&nbsp;{{ listData.length }}&nbsp;</a>
        个表
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
            :class="itemRef === item ? 'table-item-active' : ''"
          >
            <a-space>
              <AIcon type="TableOutlined" />
              <j-ellipsis>{{ item }}</j-ellipsis>
            </a-space>
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
    </div>
  </div>
</template>

<script setup lang="ts" name="TableList">
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { refreshTable, getDataSourceTables } from '@datasource-manager-ui/api/data/datasource'

const emit = defineEmits(['update:sourceData', 'click', 'search'])
const props = defineProps<{
  listData: any[]
  itemRef: string
  sourceData: any
}>()

const route = useRoute()
const refreshLoading = ref(false)
const searchQuery = ref('')

const filteredListData = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return props.listData
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase().trim()

  return props.listData.filter((item) => {
    if (typeof item === 'string') {
      return item.toLowerCase().includes(lowerCaseQuery)
    }
    return false
  })
})

const handleSearch = (value: string) => {
  searchQuery.value = value
  emit('search', filteredListData.value[0])
}

const handelClick = (clickItem: any) => {
  emit('click', clickItem)
}

const handelRefresh = async () => {
  const id = route.params.id as string
  refreshLoading.value = true
  try {
    const resp = await refreshTable(id)
    if (resp.success) {
      const res = await getDataSourceTables(id)
      if (res.success) {
        emit('update:sourceData', res.result)
        onlyMessage('刷新成功', 'success')
      }
    }
  } catch (error) {
    onlyMessage('刷新失败', 'error')
  } finally {
    refreshLoading.value = false
  }
}
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin: 0 0 4px 0;

  &:hover {
    background-color: #f5f5f5;
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
