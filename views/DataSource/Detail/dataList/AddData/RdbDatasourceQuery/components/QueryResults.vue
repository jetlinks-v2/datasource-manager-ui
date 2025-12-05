<template>
  <div class="query-result">
    <TitleComponent
      :data="$t('DataSource.QueryResults.100041-0')"
      :style="{ marginBottom: '0' }"
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
import { useI18n } from 'vue-i18n'

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

const { t: $t } = useI18n()
</script>

<style scoped lang="less">
:deep(::-webkit-scrollbar) {
  width: 7px;
  height: 7px;
}
</style>
