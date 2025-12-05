<template>
  <div class="mongo-connection">
    <DescriptionItemList
      :title="$t('Info.Mongo.100065-0')"
      :column="3"
      :items="items"
    />

    <KeyValueTable
      v-if="hasOptions"
      :title="$t('Info.Mongo.100065-1')"
      :data-source="optionsData"
    />
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'
import KeyValueTable from './components/KeyValueTable.vue'

const { t: $t } = useI18n()

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
      label: $t('Info.Mongo.100065-2'),
      value: isUrlMode ? $t('Info.Mongo.100065-3') : $t('Info.Mongo.100065-4'),
      condition: true
    },
    {
      key: 'uri',
      label: $t('Info.Mongo.100065-5'),
      component: MaskDisplay,
      componentProps: { value: mongoData.uri, placeholder: '--' },
      condition: isUrlMode
    },
    {
      key: 'host',
      label: $t('Info.Mongo.100065-6'),
      value: mongoData.host || '--',
      condition: !isUrlMode
    },
    {
      key: 'port',
      label: $t('Info.Mongo.100065-7'),
      value: mongoData.port !== undefined ? String(mongoData.port) : '--',
      condition: !isUrlMode
    },
    {
      key: 'database',
      label: $t('Info.Mongo.100065-8'),
      value: mongoData.database || '--',
      condition: !isUrlMode
    },
    {
      key: 'username',
      label: $t('Info.Rdb.100066-10'),
      value: mongoData.username || '--',
      condition: !isUrlMode
    },
    {
      key: 'password',
      label: $t('Info.Mongo.100065-12'),
      component: MaskDisplay,
      componentProps: { value: mongoData.password, placeholder: '--' },
      condition: !isUrlMode
    },
    {
      key: 'authDatabase',
      label: $t('Info.Mongo.100065-9'),
      value: mongoData.authDatabase || '--',
      condition: !isUrlMode
    },
    {
      key: 'sslEnabled',
      label: $t('Info.Mongo.100065-10'),
      value: mongoData.sslEnabled ? $t('Info.Mongo.100065-11') : $t('Info.Mongo.100065-12'),
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
