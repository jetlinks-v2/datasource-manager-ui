<template>
  <DescriptionItemList
    title="基础信息"
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

const props = defineProps<{ info: SourceDataInfo; sourceClassify: any; sourceData?: any }>()
const { info, sourceClassify } = toRefs(props)

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
    label: '类型',
    value: sourceType.value
  },
  {
    key: 'name',
    label: '数据源名称',
    value: info.value?.name || '--'
  },
  {
    key: 'id',
    label: '数据源标识',
    value: info.value?.id || '--'
  },
  {
    key: 'createTime',
    label: '创建时间',
    value: formatCreateTime(info.value?.createTime)
  },
  {
    key: 'description',
    label: '说明',
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
