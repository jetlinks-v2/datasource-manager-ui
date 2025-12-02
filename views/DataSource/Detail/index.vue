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
            <a-button class="back-btn">{{ $t('DataSource.Detail.100008-0') }}</a-button>
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
                <span class="info-label">{{ $t('DataSource.Detail.100008-1') }}</span>
                <div class="info-value">
                  <j-ellipsis>{{ info?.id || '--' }}</j-ellipsis>
                </div>
              </div>
            </a-col>
            <a-col :span="16">
              <div class="info-item">
                <span class="info-label">{{ $t('DataSource.Detail.100008-2') }}</span>
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
            {{ $t('DataSource.index.100001-10') }}
          </j-permission-button>
          <j-permission-button
            :hasPermission="`${permission}:update`"
            @click="showSourceEdit"
          >
            <EditOutlined />
            {{ $t('DataSource.List.100002-2') }}
          </j-permission-button>
          <j-permission-button
            v-if="showTestConnection"
            :hasPermission="`${permission}:state`"
            @click="handleTestDataSource()"
            :loading="testLoading"
            type="primary"
          >
            <CheckCircleOutlined />
            {{ $t('DataSource.Detail.100008-3') }}
          </j-permission-button>
        </div>
      </template>

      <FullPage>
        <div class="content-wrapper">
          <component
            :is="tabs[tabActiveKey]"
            :info="info"
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
import EsIndex from './esIndex/index.vue'
import RedisKey from './redisKey/index.vue'
import Collection from './collection/index.vue'
import SourceDetailsAdd from '../components/dataSourceModal/SourceDetailsAdd.vue'
import { deleteDataSource, disableDataSource, getDataSourceDetail } from '@datasource-manager-ui/api/data/datasource'
import { SourceDataInfo } from './type'
import { onlyMessage } from '@jetlinks-web/utils'
import { DATA_TYPE_ITEM, getTypesDataDetail } from '../components/table'
import { DeleteOutlined, EditOutlined, CheckCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { useTestConnection } from '../composables/useTestConnection'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const permission = 'system/DataSource'

const route = useRoute()
const router = useRouter()
const sourceId = route.params.id as string

const { loading: testLoading, testConnection } = useTestConnection()
const info = ref({} as SourceDataInfo)
const list = ref<{ key: string; tab: string }[]>([])

const tabs = {
  Info,
  Table,
  Query,
  DataList,
  EsIndex,
  RedisKey,
  Collection
} as Record<string, any>

const showSourceAdd = ref(false)
const tabActiveKey = ref('Info')

const sourceClassify = ref<DATA_TYPE_ITEM>()

const baseTabs = computed(() => [{ key: 'Info', tab: $t('DataSource.Detail.100008-4') }])
const endTabs = computed(() => [{ key: 'DataList', tab: $t('DataSource.Detail.100008-7') }])

const getDataSourceTabs = (type?: DATA_TYPE_ITEM) => {
  const map: Record<DATA_TYPE_ITEM, { key: string; tab: string }[]> = {
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: [
      { key: 'Table', tab: $t('DataSource.Detail.100008-5') },
      { key: 'Query', tab: $t('DataSource.Detail.100008-6') }
    ],
    [DATA_TYPE_ITEM.API_SEND]: [],
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: [],
    [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: [{ key: 'EsIndex', tab: $t('DataSource.DetailTabs.100062-0') }],
    [DATA_TYPE_ITEM.REDIS_DATASOURCE]: [{ key: 'RedisKey', tab: $t('DataSource.DetailTabs.100062-1') }],
    [DATA_TYPE_ITEM.MONGODB_DATASOURCE]: [{ key: 'Collection', tab: $t('DataSource.DetailTabs.100062-2') }]
  }
  return (type && map[type]) || []
}

const routeLink = computed(() => ({
  path: `/system/DataSource`,
  query: {
    group: info.value.group?.value
  }
}))

// 是否显示测试连接按钮
const showTestConnection = computed(() => {
  return (
    sourceClassify.value === DATA_TYPE_ITEM.RDB_DATASOURCE ||
    sourceClassify.value === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE ||
    sourceClassify.value === DATA_TYPE_ITEM.REDIS_DATASOURCE ||
    sourceClassify.value === DATA_TYPE_ITEM.MONGODB_DATASOURCE
  )
})

const onTabChange = (key: string) => {
  tabActiveKey.value = key
}

const showSourceEdit = async () => {
  showSourceAdd.value = true
}

const handleTestDataSource = async () => {
  const { typeId, name, shareConfig } = info.value
  await testConnection(typeId, name, shareConfig)
}

const handleDeleteOk = async () => {
  Modal.confirm({
    title: $t('DataSource.index.100001-10'),
    content: $t('DataSource.List.100002-3'),
    onOk: async () => {
      const res = await disableDataSource(sourceId)
      if (res.success) {
        const res = await deleteDataSource(sourceId)
        if (res.success) {
          router.push(routeLink.value)
          onlyMessage($t('DataSource.List.100002-4'))
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

    const dynamicTabs = getDataSourceTabs(sourceClassify.value)
    list.value = [...baseTabs.value, ...dynamicTabs, ...endTabs.value]
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
  white-space: normal;
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
