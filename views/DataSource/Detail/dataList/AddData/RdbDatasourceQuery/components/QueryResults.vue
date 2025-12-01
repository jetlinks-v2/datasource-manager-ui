<template>
  <div class="query-result">
    <div class="title">
      <h3>{{ $t('DataSource.QueryResults.100041-0') }}</h3>
    </div>
    <j-pro-table
      :columns="columns"
      :params="params"
      :request="request"
      mode="TABLE"
      :bodyStyle="{ padding: 0 }"
      :scroll="{ y: 200 }"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

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
.query-result {
  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      margin: 0;
      font-size: 15px;
    }
  }
}
</style>
