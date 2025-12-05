<template>
  <DescriptionItemList
    :title="$t('DataSource.Info.100010-0')"
    :column="3"
    :items="baseInfoItems"
  />

  <component
    :is="connectionComponent"
    :info="info"
    v-if="connectionComponent && isShowConnection"
  />
</template>

<script setup lang="ts" name="Info">
import dayjs from 'dayjs'
import RdbConnection from './RdbConnection.vue'
import ApiConnection from './ApiConnection.vue'
import WebSocketConnection from './WebSocketConnection.vue'
import EsConnection from './EsConnection.vue'
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import { DATASOURCE_NAME, DATA_TYPE_ITEM } from '../../components/table'
import { SourceDataInfo } from '../type'
import RedisConnection from './RedisConnection.vue'
import MongoConnection from './MongoConnection.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ info: SourceDataInfo; sourceClassify: any; sourceData?: any }>()
const { info, sourceClassify } = toRefs(props)
const { t: $t } = useI18n()

// 动态选择连接组件
const componentMap = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: RdbConnection,
  [DATA_TYPE_ITEM.API_SEND]: ApiConnection,
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: WebSocketConnection,
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: EsConnection,
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: RedisConnection,
  [DATA_TYPE_ITEM.MONGODB_DATASOURCE]: MongoConnection
}

const connectionComponent = computed(() => {
  return componentMap[sourceClassify.value as keyof typeof componentMap] ?? null
})

const sourceType = computed(() => {
  if (info.value) {
    return getDataSourceName(info.value.searchCode)
  }
  return '--'
})

// 判断是否显示数据连接
const isShowConnection = computed(() => {
  return info.value.shareConfig && Object.keys(info.value.shareConfig).length > 0
})

const baseInfoItems = computed<DescriptionItem[]>(() => [
  {
    key: 'type',
    label: $t('DataSource.table.100003-4'),
    value: sourceType.value
  },
  {
    key: 'name',
    label: $t('DataSource.Info.100010-1'),
    value: info.value?.name || '--'
  },
  {
    key: 'id',
    label: $t('DataSource.Info.100010-2'),
    value: info.value?.id || '--'
  },
  {
    key: 'createTime',
    label: $t('DataSource.Info.100010-3'),
    value: formatCreateTime(info.value?.createTime)
  },
  {
    key: 'description',
    label: $t('DataSource.table.100003-6'),
    value: info.value?.description || '--'
  }
])

const getDataSourceName = (value: string) => {
  for (let key in DATASOURCE_NAME) {
    if (key === value) {
      return DATASOURCE_NAME[key]
    }
  }
}

const formatCreateTime = (time?: string) => {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '--'
}
</script>

<style scoped lang="less"></style>
