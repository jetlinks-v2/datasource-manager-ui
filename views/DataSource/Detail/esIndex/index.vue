<template>
  <div class="es-index-container">
    <IndexList
      :selected-index="selectedItem.index"
      @select="handleIndexSelect"
    />

    <a-divider
      type="vertical"
      class="divider"
    />

    <IndexContent :selectedItem="selectedItem" />
  </div>
</template>

<script setup lang="ts" name="EsIndex">
import IndexList from './components/IndexList.vue'
import IndexContent from './components/IndexContent.vue'

const selectedItem = ref({} as any)

const handleIndexSelect = (item: any) => {
  selectedItem.value = item
}
</script>

<style scoped lang="less">
.es-index-container {
  display: flex;
  height: 100%;
  border-radius: 8px;
}

.divider {
  height: 100%;
  margin: 0;
}
</style>
