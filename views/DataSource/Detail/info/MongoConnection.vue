<template>
  <div class="mongo-connection">
    <DescriptionItemList
      title="数据连接"
      :column="3"
      :items="items"
    />

    <KeyValueTable
      v-if="hasOptions"
      title="扩展参数"
      :data-source="optionsData"
    />
  </div>
</template>

<script lang="ts" setup>
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'
import KeyValueTable from './components/KeyValueTable.vue'

interface KeyValueItem {
  key?: string
  value?: string
}

interface ShareConfig {
  connectionMode?: string
  uri?: string
  host?: string
  port?: number
  database?: string
  authDatabase?: string
  username?: string
  password?: string
  sslEnabled?: boolean
  options?: Record<string, string>
}

interface InfoProps {
  shareConfig: ShareConfig
  [key: string]: any
}

const props = defineProps<{ info: InfoProps }>()
const { info } = toRefs(props)

const mongoData = reactive<ShareConfig>({
  connectionMode: 'basic',
  uri: '',
  host: '',
  port: undefined,
  database: '',
  authDatabase: '',
  username: '',
  password: '',
  sslEnabled: false,
  options: {}
})

const items = computed<DescriptionItem[]>(() => {
  const isUrlMode = mongoData.connectionMode === 'url'

  return [
    {
      key: 'connectionMode',
      label: '连接方式',
      value: isUrlMode ? '连接URL' : '基本配置',
      condition: true
    },
    {
      key: 'uri',
      label: '连接地址',
      component: MaskDisplay,
      componentProps: { value: mongoData.uri, placeholder: '--' },
      condition: isUrlMode
    },
    {
      key: 'host',
      label: '主机地址',
      value: mongoData.host || '--',
      condition: !isUrlMode
    },
    {
      key: 'port',
      label: '端口',
      value: mongoData.port !== undefined ? String(mongoData.port) : '--',
      condition: !isUrlMode
    },
    {
      key: 'database',
      label: '数据库名称',
      value: mongoData.database || '--',
      condition: !isUrlMode
    },
    {
      key: 'username',
      label: '用户名',
      value: mongoData.username || '--',
      condition: !isUrlMode
    },
    {
      key: 'password',
      label: '密码',
      component: MaskDisplay,
      componentProps: { value: mongoData.password, placeholder: '--' },
      condition: !isUrlMode
    },
    {
      key: 'authDatabase',
      label: '认证数据库',
      value: mongoData.authDatabase || '--',
      condition: !isUrlMode
    },
    {
      key: 'sslEnabled',
      label: 'SSL/TLS',
      value: mongoData.sslEnabled ? '已启用' : '未启用',
      condition: !isUrlMode
    }
  ]
})

// 判断是否有扩展参数
const hasOptions = computed(() => {
  const isUrlMode = mongoData.connectionMode === 'url'
  return !isUrlMode && !!mongoData.options && Object.keys(mongoData.options).length > 0
})

// 将 options 对象转换为 KeyValueTable 需要的数组格式
const optionsData = computed<KeyValueItem[]>(() => {
  if (!mongoData.options) return []
  return Object.entries(mongoData.options).map(([key, value]) => ({
    key,
    value
  }))
})

watch(
  () => info.value?.shareConfig,
  (config) => {
    if (config) {
      Object.assign(mongoData, {
        connectionMode: 'basic',
        uri: '',
        host: '',
        database: '',
        authDatabase: '',
        username: '',
        password: '',
        sslEnabled: false,
        options: {},
        ...config
      })
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped>
.mongo-connection {
  margin-bottom: 24px;
}
</style>
