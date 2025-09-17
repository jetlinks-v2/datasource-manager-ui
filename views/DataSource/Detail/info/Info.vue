<template>
  <div style="margin-bottom: 20px">
    <div class="title">基础信息</div>
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
      <a-descriptions-item label=""></a-descriptions-item>
      <a-descriptions-item label=""></a-descriptions-item>
      <a-descriptions-item label="说明">
        <j-ellipsis>{{ info.description || '--' }}</j-ellipsis>
      </a-descriptions-item>
    </a-descriptions>
  </div>
  <DataConnection
    :info="info"
    :sourceClassify="sourceClassify"
  ></DataConnection>
</template>

<script setup lang="ts" name="Info">
import dayjs from 'dayjs'
import DataConnection from './DataConnection.vue'
import { DATASOURCE_NAME } from '../../components/table'
import { SourceDataInfo } from '../type'

const props = defineProps<{ info: SourceDataInfo; sourceClassify: 'database' | 'common'; sourceData?: any }>()
const { info } = toRefs(props)
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
</script>

<style scoped lang="less">
.title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5715;
  font-family: AliRegular !important;
  margin-bottom: 20px;
}
.ant-descriptions-item-label {
  width: 268px !important;
}
:deep(.ant-descriptions-item-label) {
  width: 268px !important;
}
:deep(.ant-descriptions-item-content) {
  min-width: 268px;
}
</style>
