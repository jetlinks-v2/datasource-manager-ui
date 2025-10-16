<template>
  <div class="query-result">
    <TitleComponent
      data="查询结果预览"
      :style="{ fontSize: '16px', marginBottom: '0' }"
    />
    <j-pro-table
      :columns="columns"
      :params="params"
      :request="request"
      mode="TABLE"
      :bodyStyle="{ padding: 0 }"
      :scroll="{ y: 300 }"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  params: {
    type: Object,
    default: () => ({})
  },
  request: {
    type: Function,
    required: true
  }
})
</script>

<style scoped lang="less">
:deep(::-webkit-scrollbar) {
  width: 7px;
  height: 7px;
}
</style>
