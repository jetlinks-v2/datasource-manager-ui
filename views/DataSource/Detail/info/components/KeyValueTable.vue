<template>
  <a-table
    :bordered="true"
    :columns="columns"
    :data-source="sanitizeData(dataSource)"
    :pagination="false"
    :scroll="{ y: scrollY }"
    :style="{ marginTop: marginTop + 'px' }"
  >
    <template #title>
      <div class="key-value-table__title">{{ title }}</div>
    </template>
  </a-table>
</template>

<script lang="ts" setup>
import type { TableColumnType } from 'ant-design-vue'

interface KeyValueItem {
  key?: string
  value?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    dataSource: KeyValueItem[]
    scrollY?: number
    marginTop?: number
  }>(),
  {
    scrollY: 240,
    marginTop: 12
  }
)

const columns: TableColumnType[] = [
  { title: 'Key', dataIndex: 'key', width: '50%' },
  { title: 'Value', dataIndex: 'value', width: '50%' }
]

const sanitizeData = (list: KeyValueItem[]) => {
  return list?.length ? list : [{ key: '--', value: '--' }]
}
</script>

<style lang="less" scoped>
.key-value-table__title {
  font-weight: bold;
}
</style>
