<template>
  <div class="table-container">
    <TableList @click="handelClick" />

    <a-divider
      type="vertical"
      class="divider"
    />

    <TableContent
      :field-data="fieldData"
      :current-table="currentTable"
    />
  </div>
</template>

<script setup lang="ts" name="Table">
import { SourceDataInfo } from '../type'
import TableList from './components/TableList.vue'
import TableContent from './components/TableContent.vue'

interface TableSchema {
  name: string
  columns: any[]
}

const props = defineProps<{ info: SourceDataInfo }>()
const fieldData = ref<any[]>([])
const currentTable = ref('')

const handelClick = (data: { clickItem: TableSchema; sourceData: TableSchema[] }) => {
  const { clickItem } = data

  if (currentTable.value === clickItem.name) return
  currentTable.value = clickItem.name

  fieldData.value = clickItem.columns
  fieldData.value.forEach((item, index) => {
    item.index = index + 1
  })
}
</script>

<style scoped lang="less">
.table-container {
  display: flex;
  height: 100%;
  border-radius: 8px;
}

.divider {
  height: 100%;
  margin: 0;
}
</style>
