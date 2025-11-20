<template>
  <div class="collection-container">
    <CollectionList @click="handleClick" />

    <a-divider
      type="vertical"
      class="divider"
    />

    <CollectionContent :current-collection="currentCollection" />
  </div>
</template>

<script setup lang="ts" name="Collection">
import { SourceDataInfo } from '../type'
import CollectionList from './components/CollectionList.vue'
import CollectionContent from './components/CollectionContent.vue'

interface CollectionSchema {
  name: string
  fields: any[]
}

const props = defineProps<{ info: SourceDataInfo }>()
const currentCollection = ref('')

const handleClick = (data: { clickItem: CollectionSchema; sourceData: CollectionSchema[] }) => {
  const { clickItem } = data

  if (currentCollection.value === clickItem.name) return
  currentCollection.value = clickItem.name
}
</script>

<style scoped lang="less">
.collection-container {
  display: flex;
  height: 100%;
  border-radius: 8px;
}

.divider {
  height: 100%;
  margin: 0;
}
</style>
