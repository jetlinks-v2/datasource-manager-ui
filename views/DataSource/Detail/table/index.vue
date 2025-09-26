<template>
  <div class="table-container">
    <TableList
      :list-data="listData"
      :item-ref="itemRef"
      :source-data="props.sourceData"
      @update:source-data="handleUpdateSourceData"
      @click="handelClick"
      @search="handleSearch"
    />

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

interface DataItem {
  name: string
  columns: any[]
}

const emit = defineEmits(['update:sourceData'])
const props = defineProps<{ info: SourceDataInfo; sourceData: any }>()
const data = ref<any[]>([])
const listData = ref<any[]>([])
const itemRef = ref('')
const fieldData = ref<any[]>([])
const currentTable = ref('')

const handleUpdateSourceData = (newSourceData: any) => {
  emit('update:sourceData', newSourceData)
}

const handleSearch = (value: string) => {
  handelClick(value)
}

const handelClick = (clickItem: any) => {
  if (currentTable.value === clickItem) return
  currentTable.value = clickItem
  itemRef.value = clickItem
  const matchingItem: DataItem | undefined = data.value.find((item: DataItem) => item.name === clickItem)
  if (matchingItem) {
    fieldData.value = matchingItem.columns
    fieldData.value.forEach((item, index) => {
      item.index = index + 1
    })
  } else {
    fieldData.value = []
  }
}

const getTableList = () => {
  data.value = props.sourceData
  listData.value = data.value?.map((item: any) => item.name)
  handelClick(listData.value[0])
}

watch(
  () => props.sourceData,
  (oldValue, newValue) => {
    if (oldValue !== newValue) {
      getTableList()
    }
  },
  { deep: true }
)

onMounted(() => {
  if (props.sourceData) {
    getTableList()
  }
})
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
