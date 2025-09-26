<template>
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
            style="padding: 0 0 24px 24px"
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
</template>

<script setup lang="ts" name="TableContent">
import { fieldColumns } from '../../table'
import { queryByPage } from '@datasource-manager-ui/api/data/datasource'

const props = defineProps<{
  fieldData: any[]
  currentTable: string
}>()

const route = useRoute()
const activeKey = ref('fields')
const dataColumns = ref<any>([])
const showDataTable = ref(false)
const dataQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (props.currentTable) {
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
      table: props.currentTable,
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

watch(
  () => props.currentTable,
  () => {
    handleTabChange(activeKey.value)
  }
)
</script>

<style scoped lang="less">
.table-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
