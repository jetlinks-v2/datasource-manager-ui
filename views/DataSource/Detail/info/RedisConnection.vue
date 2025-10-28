<template>
  <DescriptionItemList title="数据连接" :column="3" :items="visibleItems" />
</template>

<script lang="ts" setup>
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'

interface RedisConfig {
  host: string
  port: string | number
  databaseIndex: string | number
  userName: string
  password: string
  separator: string
}

interface ShareConfig {
  host?: string
  port?: string | number
  databaseIndex?: string | number
  userName?: string
  password?: string
  separator?: string
}

interface InfoProps {
  shareConfig?: ShareConfig
  [key: string]: any
}

const props = defineProps<{ info: InfoProps }>()
const { info } = toRefs(props)

const redisData = reactive<RedisConfig>({
  host: '',
  port: '',
  databaseIndex: '',
  userName: '',
  password: '',
  separator: '，'
})

const items = computed<DescriptionItem[]>(() => [
  { key: 'host', label: '连接地址', value: redisData.host || '--', condition: true },
  { key: 'port', label: '端口', value: String(redisData.port || '--'), condition: true },
  { key: 'databaseIndex', label: '数据库索引', value: String(redisData.databaseIndex || '--'), condition: true },
  { key: 'userName', label: '用户名', value: redisData.userName || '--', condition: true },
  {
    key: 'password',
    label: '密码',
    component: MaskDisplay,
    componentProps: { value: redisData.password, placeholder: '--' },
    condition: true
  },
  { key: 'separator', label: '分隔符', value: redisData.separator || '--', condition: true }
])

const visibleItems = computed(() =>
  items.value
    .filter((item) => item.condition)
    .map((item) => ({ ...item, value: item.value || '--' }))
)

const parseRedisConfig = (shareConfig: ShareConfig) => {
  const { host = '', port = '', databaseIndex = '', userName = '', password = '', separator = '，' } = shareConfig
  return { host, port, databaseIndex, userName, password, separator }
}

watch(
  () => info.value,
  (newInfo) => {
    if (newInfo?.shareConfig) {
      const config = parseRedisConfig(newInfo.shareConfig)
      Object.assign(redisData, config)
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped></style>

