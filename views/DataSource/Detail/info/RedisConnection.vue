<template>
  <div class="redis-connection">
    <!-- 数据连接配置信息 -->
    <DescriptionItemList
      :title="$t('DataSource.Info.Redis.100067-0')"
      :column="3"
      :items="visibleItems"
    />

    <!-- 键值统计 -->
    <DescriptionItemList
      v-if="serverInfo?.dbSize"
      :title="$t('DataSource.Info.Redis.100067-1')"
      :items="dbSizeItems"
      :column="3"
    />

    <!-- 服务器信息展示 -->
    <div
      class="server-info-container"
      v-if="serverInfo"
    >
      <TitleComponent
        :data="$t('DataSource.Info.Redis.100067-2')"
        class="section-title"
      />

      <div class="info-cards">
        <InfoCard
          v-for="card in infoCards"
          :key="card.title"
          :title="card.title"
          :icon="card.icon"
          :items="card.items"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div
      v-else-if="loading"
      class="loading-container"
    >
      <a-spin :tip="$t('DataSource.Info.Redis.100067-21')" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'
import TitleComponent from '@/components/TitleComponent/index.vue'
import InfoCard from './components/InfoCard.vue'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { formatExpiration } from '../utils'

const { t: $t } = useI18n()

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

interface ShareConfig {
  host: string
  port: number
  databaseIndex: number
  userName: string
  password: string
  delimiter: string
}

interface DbSize {
  keys: number
  expires: number
  avg_ttl: number
}

interface ServerInfo {
  redisVersion?: string
  os?: string
  processId?: string
  usedMemory?: string
  usedMemoryPeak?: string
  usedMemoryLua?: string
  connectedClients?: number
  totalConnectionsReceived?: number
  totalCommandsProcessed?: number
  dbSize?: DbSize
}

interface InfoProps {
  shareConfig: ShareConfig
  typeId: string
  type: string
  [key: string]: any
}

const props = defineProps<{ info: InfoProps }>()
const { info } = toRefs(props)

const redisData = reactive<ShareConfig>({
  host: '',
  port: 0,
  databaseIndex: 0,
  userName: '',
  password: '',
  delimiter: ''
})

// 模拟数据
const serverInfo = ref<ServerInfo>()
const loading = ref(false)

const items = computed<DescriptionItem[]>(() => [
  { key: 'host', label: $t('DataSource.Info.Redis.100067-3'), value: redisData.host || '--', condition: true },
  { key: 'port', label: $t('DataSource.Info.Redis.100067-4'), value: String(redisData.port || '--'), condition: true },
  { key: 'databaseIndex', label: $t('DataSource.Info.Redis.100067-5'), value: String(redisData.databaseIndex || '--'), condition: true },
  { key: 'userName', label: $t('DataSource.Info.Redis.100067-6'), value: redisData.userName || '--', condition: true },
  {
    key: 'password',
    label: $t('DataSource.Info.Redis.100067-7'),
    component: MaskDisplay,
    componentProps: { value: redisData.password, placeholder: '--' },
    condition: true
  },
  { key: 'delimiter', label: $t('DataSource.Info.Redis.100067-8'), value: redisData.delimiter || '--', condition: true }
])

const visibleItems = computed(() =>
  items.value.filter((item) => item.condition).map((item) => ({ ...item, value: item.value || '--' }))
)

// 服务器信息卡片配置
const infoCards = computed(() => [
  {
    title: $t('DataSource.Info.Redis.100067-9'),
    icon: 'DatabaseOutlined',
    items: [
      { label: $t('DataSource.Info.Redis.100067-10'), value: serverInfo.value?.redisVersion || '--', highlight: true },
      { label: $t('DataSource.Info.Redis.100067-11'), value: serverInfo.value?.os || '--' },
      { label: $t('DataSource.Info.Redis.100067-12'), value: serverInfo.value?.processId || '--' }
    ]
  },
  {
    title: $t('DataSource.Info.Redis.100067-13'),
    icon: 'DashboardOutlined',
    items: [
      { label: $t('DataSource.Info.Redis.100067-14'), value: serverInfo.value?.usedMemory || '--', highlight: true },
      { label: $t('DataSource.Info.Redis.100067-15'), value: serverInfo.value?.usedMemoryPeak || '--' },
      { label: $t('DataSource.Info.Redis.100067-16'), value: serverInfo.value?.usedMemoryLua || '--' }
    ]
  },
  {
    title: $t('DataSource.Info.Redis.100067-17'),
    icon: 'CheckCircleOutlined',
    items: [
      { label: $t('DataSource.Info.Redis.100067-18'), value: String(serverInfo.value?.connectedClients || '--'), highlight: true },
      { label: $t('DataSource.Info.Redis.100067-19'), value: String(serverInfo.value?.totalConnectionsReceived || '--') },
      { label: $t('DataSource.Info.Redis.100067-20'), value: String(serverInfo.value?.totalCommandsProcessed || '--') }
    ]
  }
])

// 键值统计配置
const dbSizeItems = computed<DescriptionItem[]>(() => {
  const { keys = '--', expires = '--', avg_ttl = '--' } = serverInfo.value?.dbSize || {}
  return [
    { key: 'keys', label: $t('DataSource.Info.Redis.100067-23'), value: String(keys) },
    { key: 'expires', label: $t('DataSource.Info.Redis.100067-24'), value: String(expires) },
    { key: 'avg_ttl', label: $t('DataSource.Info.Redis.100067-25'), value: avg_ttl ? formatExpiration(avg_ttl) : '--' }
  ]
})

const parseRedisConfig = (shareConfig: ShareConfig) => {
  const { host = '', port = '', databaseIndex = '', userName = '', password = '', delimiter = '' } = shareConfig
  return { host, port, databaseIndex, userName, password, delimiter }
}

// 查询服务器信息
const fetchServerInfo = async () => {
  if (!typeId) return

  loading.value = true
  try {
    const { shareConfig } = info.value
    const res = await queryDataSource(typeId, dataSourceId, 'ServerInfo', {
      index: shareConfig.databaseIndex
    })
    if (res.status === 200 && res.result) {
      serverInfo.value = res.result
    }
  } catch (error) {
    console.error('获取服务器信息失败:', error)
    onlyMessage($t('DataSource.Info.Redis.100067-22'), 'error')
  } finally {
    loading.value = false
  }
}

watch(
  () => info.value,
  (newInfo) => {
    if (newInfo?.shareConfig) {
      const config = parseRedisConfig(newInfo.shareConfig)
      Object.assign(redisData, config)
    }
    if (newInfo?.id) {
      fetchServerInfo()
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.redis-connection {
  .section-title {
    font-size: 16px;
    height: 32px;
    line-height: 32px;
  }

  .server-info-container {
    .info-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 60px 0;
  }

  // 响应式布局
  @media (max-width: 1200px) {
    .server-info-container {
      .info-cards {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }

  @media (max-width: 768px) {
    .server-info-container {
      .info-cards {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
