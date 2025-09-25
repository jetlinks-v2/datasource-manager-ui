<template>
  <div style="margin-bottom: 20px">
    <TitleComponent
      data="基础信息"
      :style="{ fontSize: '16px' }"
    />
    <a-descriptions
      :column="3"
      bordered
    >
      <a-descriptions-item label="类型">
        <j-ellipsis>{{ sourceType || '--' }}</j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="数据源名称">
        <j-ellipsis>{{ info.name || '--' }}</j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="数据源标识">
        <j-ellipsis>{{ info.id || '--' }}</j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="创建时间">
        <j-ellipsis>
          {{ info.createTime ? dayjs(info.createTime).format('YYYY-MM-DD HH:mm:ss') : '--' }}
        </j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="说明">
        <j-ellipsis>{{ info.description || '--' }}</j-ellipsis>
      </a-descriptions-item>
    </a-descriptions>
  </div>
  <!-- 动态数据连接组件 -->
  <component
    :is="connectionComponent"
    :info="info"
    v-if="connectionComponent && isShowConnection"
  />
</template>

<script setup lang="ts" name="Info">
import dayjs from 'dayjs'
import DatabaseConnection from './DatabaseConnection.vue'
import ApiConnection from './ApiConnection.vue'
import WebSocketConnection from './WebSocketConnection.vue'
import { DATASOURCE_NAME, DATA_TYPE_ITEM } from '../../components/table'
import { SourceDataInfo } from '../type'

const props = defineProps<{ info: SourceDataInfo; sourceClassify: any; sourceData?: any }>()
const { info, sourceClassify } = toRefs(props)

const sourceType = computed(() => {
  if (info.value) {
    return getDataSourceName(info.value.searchCode)
  }
})

const getDataSourceName = (value: string) => {
  for (let key in DATASOURCE_NAME) {
    if (key === value) {
      return DATASOURCE_NAME[key]
    }
  }
}

// 判断是否显示数据连接
const isShowConnection = computed(() => {
  return info.value.shareConfig && Object.keys(info.value.shareConfig).length > 0
})

// 动态选择连接组件
const connectionComponent = computed(() => {
  if (!sourceClassify.value) return null

  switch (sourceClassify.value) {
    case DATA_TYPE_ITEM.RDB_DATASOURCE:
      return DatabaseConnection
    case DATA_TYPE_ITEM.API_SEND:
      return ApiConnection
    case DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE:
      return WebSocketConnection
    default:
      return null
  }
})
</script>

<style scoped lang="less"></style>
