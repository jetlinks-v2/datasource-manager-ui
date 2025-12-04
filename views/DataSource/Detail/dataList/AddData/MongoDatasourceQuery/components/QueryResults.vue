<template>
  <div class="query-result">
    <div class="result-header">
      <TitleComponent
        data="查询结果预览"
        :style="{ margin: 0 }"
      />
      <a-button
        type="primary"
        @click="handleQuery"
      >
        <template #icon>
          <AIcon type="SearchOutlined" />
        </template>
        查询
      </a-button>
    </div>
    <j-pro-table
      :key="queryKey"
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
import TitleComponent from '@jetlinks-web-core/components/TitleComponent/index.vue'

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
  },
  queryKey: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['query'])

const handleQuery = () => {
  emit('query')
}
</script>

<style scoped lang="less">
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(::-webkit-scrollbar) {
  width: 7px;
  height: 7px;
}
</style>
