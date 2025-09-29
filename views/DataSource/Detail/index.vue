<template>
  <div>
    <j-page-container
      :tabActiveKey="tabActiveKey"
      :tabList="list"
      @tabChange="onTabChange"
    >
      <template #title>
        <div class="page-header">
          <router-link :to="routeLink">
            <a-button class="back-btn">返回</a-button>
          </router-link>
          <j-ellipsis>
            <div class="page-title">{{ info?.name || '--' }}</div>
          </j-ellipsis>
        </div>
      </template>

      <template #content>
        <div class="info-panel">
          <a-row>
            <a-col :span="8">
              <div class="info-item">
                <span class="info-label">标识：</span>
                <div class="info-value">
                  <j-ellipsis>{{ info?.id || '--' }}</j-ellipsis>
                </div>
              </div>
            </a-col>
            <a-col :span="16">
              <div class="info-item">
                <span class="info-label">说明：</span>
                <div class="info-value">
                  <j-ellipsis>{{ info?.description || '--' }}</j-ellipsis>
                </div>
              </div>
            </a-col>
          </a-row>
        </div>
      </template>

      <template #extra>
        <div class="action-bar">
          <j-permission-button
            :hasPermission="`${permission}:delete`"
            danger
            @click="handleDeleteOk"
          >
            <DeleteOutlined />
            删除
          </j-permission-button>
          <j-permission-button
            :hasPermission="`${permission}:update`"
            @click="showSourceEdit"
          >
            <EditOutlined />
            编辑
          </j-permission-button>
          <j-permission-button
            v-if="sourceClassify === DATA_TYPE_ITEM.RDB_DATASOURCE"
            :hasPermission="`${permission}:state`"
            @click="handleTestDataSource()"
            :loading="loading"
            type="primary"
          >
            <CheckCircleOutlined />
            连接测试
          </j-permission-button>
        </div>
      </template>

      <FullPage>
        <div class="content-wrapper">
          <component
            :is="tabs[tabActiveKey]"
            :info="info"
            v-model:sourceData="sourceData"
            :sourceClassify="sourceClassify"
          />
        </div>
      </FullPage>
    </j-page-container>

    <SourceDetailsAdd
      v-if="showSourceAdd"
      :editData="info"
      :permission="permission"
      @close="showSourceAdd = false"
    />
  </div>
</template>

<script lang="ts" name="Detail" setup>
import Info from './info/index.vue'
import Query from './query/index.vue'
import Table from './table/index.vue'
import DataList from './dataList/index.vue'
import SourceDetailsAdd from '../components/dataSourceModal/SourceDetailsAdd.vue'
import {
  deleteDataSource,
  disableDataSource,
  getDataSourceDetail,
  getDataSourceTables,
  refreshTable,
  testDataSource
} from '@datasource-manager-ui/api/data/datasource'
import { SourceDataInfo } from './type'
import { onlyMessage } from '@jetlinks-web/utils'
import { DATA_TYPE_ITEM, getTypesDataDetail } from '../components/table'
import { DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'

const permission = 'system/DataSource'

const route = useRoute()
const router = useRouter()
const sourceId = route.params.id as string

const loading = ref(false)
const sourceData = ref()
const info = ref({} as SourceDataInfo)
const list = ref<{ key: string; tab: string }[]>([])

const tabs = {
  Info,
  Table,
  Query,
  DataList
} as Record<string, any>

const showSourceAdd = ref(false)
const tabActiveKey = ref('Info')

const sourceClassify = ref<DATA_TYPE_ITEM>()

const baseTabs = [{ key: 'Info', tab: '基本信息' }]
const endTabs = [{ key: 'DataList', tab: '功能列表' }]

const dataSourceTabs: Record<DATA_TYPE_ITEM, { key: string; tab: string }[]> = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: [
    { key: 'Table', tab: '表结构' },
    { key: 'Query', tab: '查询' }
  ],
  [DATA_TYPE_ITEM.API_SEND]: [],
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: []
}

const routeLink = computed(() => ({
  path: `/system/DataSource`,
  query: {
    group: info.value.group?.value
  }
}))

const onTabChange = async (key: string) => {
  tabActiveKey.value = key
  if (key !== 'Info' && key !== 'DataList') {
    if (!sourceData.value) {
      const resp = await refreshTable(route.params.id as string)
      if (resp.success) {
        const res = await getDataSourceTables(sourceId)
        if (res.success) {
          sourceData.value = res.result
        }
      }
    }
  }
}

const showSourceEdit = async () => {
  showSourceAdd.value = true
}

const handleTestDataSource = async () => {
  loading.value = true
  const { typeId, name, shareConfig } = info.value
  const { type, url, username, password, schema } = shareConfig
  const res = await testDataSource({
    typeId,
    name,
    shareConfig: {
      type,
      url,
      username,
      password,
      schema,
      others: {}
    },
    shareCluster: true
  }).catch((err) => {
    loading.value = false
  })

  if (res?.result.ok === true) {
    onlyMessage('连接数据源成功')
    loading.value = false
  } else {
    onlyMessage(`连接数据源失败,${res?.result?.reason?.cause?.message ?? '请求超时'}`, 'error')
    loading.value = false
  }
}

const handleDeleteOk = async () => {
  Modal.confirm({
    title: '删除',
    content: '删除该数据源后，相关数据将被删除，请谨慎操作',
    onOk: async () => {
      const res = await disableDataSource(sourceId)
      if (res.success) {
        const res = await deleteDataSource(sourceId)
        if (res.success) {
          router.push(routeLink.value)
          onlyMessage('删除成功')
        }
      }
    }
  })
}

const getDetailInfo = async () => {
  const res = await getDataSourceDetail(sourceId)

  if (res.status === 200) {
    info.value = res.result
    sourceClassify.value = getTypesDataDetail(info.value.searchCode).formType as DATA_TYPE_ITEM

    const dynamicTabs = dataSourceTabs[sourceClassify.value] || []
    list.value = [...baseTabs, ...dynamicTabs, ...endTabs]
  }
}

watch(
  () => showSourceAdd.value,
  async () => {
    if (!showSourceAdd.value) {
      await getDetailInfo()
    }
  }
)

onMounted(async () => {
  await getDetailInfo()
})

provide('INFO', info)
</script>

<style lang="less" scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;

  .back-btn {
    border-radius: 2px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 600;
    max-width: 600px;
  }
}

.info-panel {
  :deep(.ant-row) {
    width: 100%;
  }

  .info-item {
    display: flex;
    margin-right: 100px;

    .info-label {
      font-size: 14px;
      min-width: 42px;
    }

    .info-value {
      font-size: 14px;
      flex: 1;
    }
  }
}

.divider {
  margin: 26px 0 10px 0;
}

.action-bar {
  display: flex;
  gap: 12px;
}

.content-wrapper {
  margin-top: 24px;
  padding: 24px;
  height: 100%;
  overflow: auto;
}

:deep(.full-page-warp) {
  height: calc(100vh - 290px) !important;
}
</style>
