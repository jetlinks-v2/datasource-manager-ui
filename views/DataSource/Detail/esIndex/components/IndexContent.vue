<template>
  <div class="index-content">
    <a-tabs
      v-if="selectedItem"
      v-model:activeKey="activeKey"
      :tabBarStyle="{ margin: '0 0 0 25px' }"
      type="card"
      @change="handleTabChange"
    >
      <!-- 基本信息 Tab -->
      <a-tab-pane
        key="basic"
        tab="基本信息"
      >
        <div class="info-section">
          <DescriptionItemList
            :column="2"
            :items="basicInfoItems"
          >
            <template #health>
              <a-space>
                <a-badge :color="getHealthColor(selectedItem?.health)" />
                <span>{{ selectedItem?.health || '--' }}</span>
              </a-space>
            </template>
          </DescriptionItemList>
        </div>
      </a-tab-pane>

      <!-- 索引字段 Tab -->
      <a-tab-pane
        key="fields"
        tab="索引字段"
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
        ></j-pro-table>
        <div
          v-else
          class="empty-table"
        >
          <j-empty description="暂无字段数据" />
        </div>
      </a-tab-pane>

      <!-- 数据列表 Tab -->
      <a-tab-pane
        key="data"
        tab="数据列表"
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
            <j-empty description="暂无数据" />
          </div>
        </template>
      </a-tab-pane>
    </a-tabs>
    <div
      v-else
      class="empty-content"
    >
      <j-empty description="请选择索引查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts" name="IndexContent">
import { queryEsMetadata, queryEsPager } from '@datasource-manager-ui/api/data/datasource'
import DescriptionItemList, { type DescriptionItem } from '../../info/components/DescriptionItemList.vue'

const props = defineProps<{
  selectedItem: any
}>()

const route = useRoute()
const activeKey = ref('basic')
const fieldData = ref<any[]>([])
const dataColumns = ref<any[]>([])
const showDataTable = ref(false)
const dataQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})

// 获取健康状态对应的颜色
const getHealthColor = (health: string) => {
  const colorMap: Record<string, string> = {
    green: '#52c41a',
    yellow: '#faad14',
    red: '#ff4d4f'
  }
  return colorMap[health?.toLowerCase()] || '#d9d9d9'
}

// 基本信息项配置
const basicInfoItems = computed<DescriptionItem[]>(() => [
  {
    key: 'health',
    label: '健康状态'
  },
  {
    key: 'status',
    label: '状态',
    value: props.selectedItem?.status || '--'
  },
  {
    key: 'primaries',
    label: '主分片数',
    value: props.selectedItem?.primaries || '--'
  },
  {
    key: 'replicas',
    label: '副本数',
    value: props.selectedItem?.replicas || '--'
  },
  {
    key: 'docsCount',
    label: '文档数',
    value: props.selectedItem?.docsCount || '--'
  },
  {
    key: 'storeSize',
    label: '存储大小',
    value: props.selectedItem?.storeSize || '--'
  },
  {
    key: 'index',
    label: '索引名称',
    value: props.selectedItem?.index || '--'
  }
])

// 索引字段表格列配置
const fieldColumns = [
  {
    title: '序号',
    key: 'index',
    dataIndex: 'index',
    width: 80,
    scopedSlots: true
  },
  {
    title: '名称',
    dataIndex: 'id',
    key: 'id',
    ellipsis: true
  },
  {
    title: '注释',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true
  },
  {
    title: '字段类型',
    dataIndex: ['valueType', 'type'],
    key: 'type',
    ellipsis: true
  },
  {
    title: '字段名称',
    dataIndex: ['valueType', 'name'],
    key: 'typeName',
    ellipsis: true
  }
]

// 加载索引元数据（字段信息）
const loadIndexMetadata = async () => {
  if (!props.selectedItem?.index) return

  const id = route.params.id as string

  try {
    const res = await queryEsMetadata(id, { index: props.selectedItem.index })

    if (res.status === 200 && res.result && res.result.length > 0) {
      const properties = res.result[0].properties || []
      properties.forEach((item: any, index: number) => {
        item.index = index + 1
      })
      fieldData.value = properties
    } else {
      fieldData.value = []
    }
  } catch (error) {
    console.error('加载索引元数据失败:', error)
    fieldData.value = []
  }
}

// 处理数据列表请求
const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (props.selectedItem?.index) {
      const params = {
        index: props.selectedItem.index,
        pageIndex: request.pageIndex,
        pageSize: request.pageSize,
        terms: []
      }

      queryEsPager(route.params.id as string, params)
        .then((resp: any) => {
          if (resp.result?.data && resp.result.data.length > 0) {
            handleColumns(resp.result.data)
          }
          resolve({
            code: resp.status,
            status: resp.status,
            success: resp.success,
            result: {
              data: resp.result.data || [],
              pageSize: resp.result.pageSize || 0,
              pageIndex: resp.result.pageIndex || 0,
              total: resp.result.total || 0
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

// 处理数据列的动态生成
const handleColumns = (arr: any) => {
  if (arr && arr.length > 0) {
    const obj = arr[0]
    dataColumns.value = Object.keys(obj).map((key) => ({
      title: key,
      dataIndex: key,
      key: key,
      ellipsis: true,
      width: 150
    }))
    showDataTable.value = true
  } else {
    dataColumns.value = []
    showDataTable.value = false
  }
}

// Tab 切换处理
const handleTabChange = (key: any) => {
  if (key === 'fields') {
    loadIndexMetadata()
  } else if (key === 'data') {
    showDataTable.value = true
    dataQueryParams.value = {
      index: props.selectedItem.index,
      pageIndex: 0,
      pageSize: 12,
      terms: []
    }
  }
}

// 监听选中项变化
watch(
  () => props.selectedItem,
  () => {
    activeKey.value = 'basic'
    fieldData.value = []
    dataColumns.value = []
    showDataTable.value = false
  }
)
</script>

<style scoped lang="less">
.index-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.info-section {
  padding: 14px 0 24px 24px;
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
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

:deep(.ant-descriptions-item-label) {
  background-color: #fafafa;
  font-weight: 500;
}
</style>
