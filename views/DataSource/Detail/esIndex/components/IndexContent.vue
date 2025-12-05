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
        :tab="$t('DataSource.Detail.100008-4')"
      >
        <div
          class="info-section"
          v-if="Object.keys(selectedItem).length > 0"
        >
          <DescriptionItemList
            :column="2"
            :items="basicInfoItems"
          >
            <template #health>
              <a-space>
                <a-badge
                  v-if="selectedItem?.health"
                  :color="getHealthColor(selectedItem?.health)"
                />
                <span>{{ selectedItem?.health || '--' }}</span>
              </a-space>
            </template>
          </DescriptionItemList>
        </div>
        <div
          v-else
          class="empty-content custom-table"
        >
          <j-empty :description="$t('DataSource.List.100002-0')" />
        </div>
      </a-tab-pane>

      <!-- 索引字段 Tab -->
      <a-tab-pane
        key="fields"
        :tab="$t('DataSource.EsIndexContent.100057-0')"
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
        />
        <div
          v-else
          class="empty-content custom-table"
        >
          <j-empty :description="$t('DataSource.List.100002-0')" />
        </div>
      </a-tab-pane>

      <!-- 数据列表 Tab -->
      <a-tab-pane
        key="data"
        :tab="$t('DataSource.EsIndexContent.100057-1')"
      >
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
            <div class="empty-table">
              <j-empty :description="$t('DataSource.List.100002-0')" />
            </div>
          </template>
        </j-pro-table>
      </a-tab-pane>
    </a-tabs>
    <div
      v-else
      class="empty-content"
    >
      <j-empty :description="$t('DataSource.List.100002-0')" />
    </div>
  </div>
</template>

<script setup lang="ts" name="IndexContent">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import DescriptionItemList, { type DescriptionItem } from '../../info/components/DescriptionItemList.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  selectedItem: any
}>()

const { t: $t } = useI18n()

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

const activeKey = ref('basic')
const fieldData = ref<any[]>([])
const dataColumns = ref<any[]>([])
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
    label: $t('DataSource.EsIndexContent.100057-2')
  },
  {
    key: 'status',
    label: $t('DataSource.EsIndexContent.100057-3'),
    value: props.selectedItem?.status || '--'
  },
  {
    key: 'primaries',
    label: $t('DataSource.EsIndexContent.100057-4'),
    value: props.selectedItem?.primaries || '--'
  },
  {
    key: 'replicas',
    label: $t('DataSource.EsIndexContent.100057-5'),
    value: props.selectedItem?.replicas || '--'
  },
  {
    key: 'docsCount',
    label: $t('DataSource.EsIndexContent.100057-6'),
    value: props.selectedItem?.docsCount || '--'
  },
  {
    key: 'storeSize',
    label: $t('DataSource.EsIndexContent.100057-7'),
    value: props.selectedItem?.storeSize || '--'
  },
  {
    key: 'index',
    label: $t('DataSource.EsIndexContent.100057-8'),
    value: props.selectedItem?.index || '--'
  }
])

// 索引字段表格列配置
const fieldColumns = computed(() => [
  {
    title: $t('Detail.table.100009-0'),
    key: 'index',
    dataIndex: 'index',
    width: 80,
    scopedSlots: true
  },
  {
    title: $t('DataSource.table.100003-0'),
    dataIndex: 'id',
    key: 'id',
    ellipsis: true
  },
  {
    title: $t('Detail.table.100009-1'),
    dataIndex: 'name',
    key: 'name',
    ellipsis: true
  },
  {
    title: $t('Detail.table.100009-2'),
    dataIndex: ['valueType', 'type'],
    key: 'type',
    ellipsis: true
  },
  {
    title: $t('DataSource.EsIndexContent.100057-9'),
    dataIndex: ['valueType', 'name'],
    key: 'typeName',
    ellipsis: true
  }
])

// 加载索引元数据（字段信息）
const loadIndexMetadata = async () => {
  if (!props.selectedItem?.index) return

  try {
    const res = await queryDataSource(typeId, dataSourceId, 'QueryMetadata', { index: props.selectedItem.index })

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

      queryDataSource(typeId, dataSourceId, 'QueryPager', params)
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
  } else {
    dataColumns.value = []
  }
}

// Tab 切换处理
const handleTabChange = (key: any) => {
  if (key === 'fields') {
    loadIndexMetadata()
  } else if (key === 'data') {
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
  height: calc(100vh - 460px);
}

:deep(.ant-descriptions-item-label) {
  background-color: #fafafa;
  font-weight: 500;
}

:deep(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}
</style>
