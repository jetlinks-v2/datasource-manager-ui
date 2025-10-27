<template>
  <div class="table-container">
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

    <a-divider
      type="vertical"
      class="divider"
    />

    <div class="table-content">
      <a-tabs
        v-model:activeKey="activeKey"
        :tabBarStyle="{ margin: '0 0 0 25px' }"
        type="card"
        @change="handleTabChange"
      >
        <a-tab-pane
          key="fields"
          tab="字段"
        >
          <j-pro-table
            v-if="fieldData.length > 0"
            :columns="fieldColumns"
            :dataSource="fieldData"
            :noPagination="true"
            mode="TABLE"
            :scroll="{ y: 'calc(100vh - 440px)' }"
            size="small"
            style="padding: 0 0 24px 24px"
          >
            <template #primaryKey="slotProps">
              <AIcon
                type="KeyOutlined"
                v-if="slotProps.primaryKey"
              />
            </template>
            <template #index="slotProps">
              {{ slotProps.index }}
            </template>
            <template #notnull="slotProps">
              <AIcon
                type="CheckOutlined"
                v-if="slotProps?.notnull"
              />
              <AIcon
                type="CloseOutlined"
                v-else
              />
            </template>
          </j-pro-table>
          <div
            v-else
            class="empty-table"
          >
            <j-empty />
          </div>
        </a-tab-pane>
        <a-tab-pane
          key="data"
          tab="数据"
        >
          <template v-if="showDataTable">
            <j-pro-table
              :columns="dataColumns"
              :params="dataQueryParams"
              :request="handleRequest"
              mode="TABLE"
              size="small"
              class="custom-table"
            >
              <template #emptyText>
                <div></div>
              </template>
            </j-pro-table>
          </template>
          <template v-else>
            <div class="empty-table">
              <j-empty />
            </div>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script setup lang="ts" name="Table">
import { fieldColumns } from '../table'
import { SourceDataInfo } from '../type'
import { getDataSourceTables, queryByPage, refreshTable } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader/index.vue'

const emit = defineEmits(['update:sourceData'])
const route = useRoute()

interface DataItem {
  name: string
  columns: any[]
}

const props = defineProps<{ info: SourceDataInfo; sourceData: any }>()
const data = ref<any[]>([])
const activeKey = ref('fields')
const listData = ref<any[]>([])
const itemRef = ref('')
const fieldData = ref<any[]>([])
const currentTable = ref('')
const dataColumns = ref<any>([])
const loading = ref(false)
const refreshLoading = ref(false)
const showDataTable = ref(false)

// 搜索相关变量
const searchQuery = ref('')

// 过滤后的数据列表
const filteredListData = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return listData.value
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase().trim()

  return listData.value.filter((item) => {
    if (typeof item === 'string') {
      return item.toLowerCase().includes(lowerCaseQuery)
    }
    return false
  })
})

// 搜索处理方法
const handleSearch = (value: string) => {
  searchQuery.value = value
  handelClick(filteredListData.value[0])
}

const handelClick = (clickItem: any) => {
  if (currentTable.value === clickItem) return
  currentTable.value = clickItem
  itemRef.value = clickItem
  const matchingItem: DataItem | undefined = data.value.find((item: DataItem) => item.name === clickItem)
  if (matchingItem) {
    fieldData.value = matchingItem.columns
    fieldData.value.forEach((item, index) => {
      item.index = index + 1
    })
  } else {
    fieldData.value = []
  }

  handleTabChange(activeKey.value)
}

const dataQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (currentTable.value) {
      queryByPage(route.params.id as string, request)
        .then((resp: any) => {
          handleColumns(resp.result.data)
          resolve({
            code: resp.status,
            status: resp.status,
            success: resp.success,
            result: {
              data: resp.result.data,
              pageSize: resp.result.pageSize,
              pageIndex: resp.result.pageIndex,
              total: resp.result.total
            }
          })
        })
        .catch(() => {
          resolve({ code: 'error', status: 500, success: false })
        })
    } else {
      resolve({
        code: 200,
        status: 200,
        success: true,
        result: {
          data: [],
          pageSize: 0,
          pageIndex: 0,
          total: 0
        }
      })
    }
  })

const handleTabChange = (key: any) => {
  if (key === 'data') {
    showDataTable.value = true
    dataQueryParams.value = {
      table: currentTable.value,
      pageIndex: 0,
      pageSize: 12
    }
  }
}

const handleColumns = (arr: any) => {
  if (arr[arr.length - 1]) {
    const obj = arr[0]
    dataColumns.value = Object.keys(obj).map((key) => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: 80
    }))
  } else {
    dataColumns.value = []
  }

  showDataTable.value = dataColumns.value.length > 0
}

const handelRefresh = async () => {
  const id = route.params.id as string
  refreshLoading.value = true
  loading.value = true
  try {
    const resp = await refreshTable(id)
    if (resp.success) {
      const res = await getDataSourceTables(id)
      if (res.success) {
        getTableList()
        emit('update:sourceData', res.result)
        onlyMessage('刷新成功', 'success')
      }
    }
  } catch (error) {
    onlyMessage('刷新失败', 'error')
  } finally {
    refreshLoading.value = false
    loading.value = false
  }
}

const getTableList = () => {
  data.value = props.sourceData
  listData.value = data.value?.map((item: any) => item.name)
  handelClick(listData.value[0])
}

watch(
  () => props.sourceData,
  (oldValue, newValue) => {
    if (oldValue !== newValue) {
      getTableList()
    }
  },
  { deep: true }
)

onMounted(() => {
  if (props.sourceData) {
    getTableList()
  }
})
</script>

<style scoped lang="less">
.table-container {
  display: flex;
  height: 100%;
  border-radius: 8px;
}

.table-sidebar {
  width: 250px !important;
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-right: 4px;
}

.table-list {
  flex: 1;
  overflow: auto;
  scrollbar-gutter: stable;

  :deep(.ant-list) {
    padding-right: 4px;
  }
}

.divider {
  height: 100%;
  margin: 0;
}

.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  font-weight: 500;

  .anticon {
    color: #1890ff;
  }

  :deep(.j-ellipsis) {
    color: #1890ff;
  }
}

.custom-table {
  height: calc(100vh - 360px);
}

.empty-table {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 360px);
}
</style>
