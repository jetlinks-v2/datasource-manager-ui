<template>
  <j-pro-table
    :columns="dataColumns"
    :params="queryParams"
    :request="handleRequest"
    mode="TABLE"
    size="small"
    style="padding: 0"
  >
    <template #emptyText>
      <div class="empty-table">
        <j-empty description="暂无数据" />
      </div>
    </template>
    <template #action="slotProps">
      <PreviewModal
        v-model:open="previewVisible[getRecordKey(slotProps)]"
        :raw-data="slotProps.__rawData__ || slotProps"
      >
        <a-button
          type="link"
          size="small"
          @click="handlePreview(slotProps)"
        >
          <AIcon type="EyeOutlined" />
        </a-button>
      </PreviewModal>
    </template>
  </j-pro-table>
</template>

<script setup lang="ts" name="CollectionDataTable">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import PreviewModal from './PreviewModal.vue'
import { convertObjectId } from '../../utils'

const props = defineProps<{
  currentCollection: string
}>()

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

const dataColumns = ref<any[]>([])
const queryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})
const previewVisible = ref<Record<string, boolean>>({})

const processData = (data: any[], allKeys: string[]) => {
  return data.map((item) => {
    const processedItem: any = {
      __rawData__: item
    }

    allKeys.forEach((key) => {
      if (key === '_id' && item[key]) {
        processedItem[key] = convertObjectId(item[key])
      } else if (item.hasOwnProperty(key)) {
        processedItem[key] = item[key]
      } else {
        processedItem[key] = 'NaN'
      }
    })

    return processedItem
  })
}

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (props.currentCollection) {
      const params = {
        collection: props.currentCollection,
        terms: [],
        sorts: [],
        pageIndex: request.pageIndex || 0,
        pageSize: request.pageSize || 12,
        paging: true
      }

      queryDataSource(typeId, dataSourceId, 'QueryPager', params)
        .then((resp: any) => {
          if (resp.success && resp.result) {
            const rawData = resp.result.data || []
            const allKeys = handleColumns(rawData)
            const processedData = processData(rawData, allKeys)

            resolve({
              code: resp.status,
              status: resp.status,
              success: resp.success,
              result: {
                data: processedData,
                pageSize: resp.result.pageSize || request.pageSize,
                pageIndex: resp.result.pageIndex || request.pageIndex,
                total: resp.result.total || 0
              }
            })
          } else {
            resolve({
              code: 200,
              status: 200,
              success: true,
              result: {
                data: [],
                pageSize: request.pageSize,
                pageIndex: request.pageIndex,
                total: 0
              }
            })
          }
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

const handleColumns = (arr: any[]): string[] => {
  if (arr.length === 0) {
    dataColumns.value = []
    return []
  }

  const allKeysSet = new Set<string>()
  arr.forEach((item) => {
    Object.keys(item).forEach((key) => allKeysSet.add(key))
  })

  const allKeys = Array.from(allKeysSet)

  dataColumns.value = [
    ...allKeys.map((key) => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: 150
    })),
    {
      title: '数据结构',
      key: 'action',
      dataIndex: 'action',
      fixed: 'right',
      width: 80,
      align: 'center',
      scopedSlots: true
    }
  ]

  return allKeys
}

const getRecordKey = (record: any): string => {
  return record._id || record.key || String(Math.random())
}

const handlePreview = (record: any) => {
  const key = getRecordKey(record)
  previewVisible.value = { [key]: true }
}

watch(
  () => props.currentCollection,
  () => {
    if (props.currentCollection) {
      queryParams.value = {
        collection: props.currentCollection,
        pageIndex: 0,
        pageSize: 12
      }
      previewVisible.value = {}
    }
  }
)
</script>

<style scoped lang="less">
:deep(.ant-table-wrapper) {
  .ant-table-body {
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
  }
}

.empty-table {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 468px);
}

.empty-table-cell {
  :deep(.ant-table-cell) {
    border: none !important;
  }
}
</style>
