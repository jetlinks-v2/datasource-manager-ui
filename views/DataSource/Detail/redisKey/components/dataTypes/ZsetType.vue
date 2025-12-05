<template>
  <CommonTable
    :data="zsetData"
    :columns="columns"
    :showAction="showAction"
    :scroll="scroll"
    @change="handleTableChange"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index + 1 }}
    </template>
    <template #column-score="{ record }">
      <a-tag color="blue">{{ record.score }}</a-tag>
    </template>
    <template #column-value="{ record }">
      {{ record.value }}
    </template>
  </CommonTable>
</template>

<script setup lang="ts">
import CommonTable from './CommonTable.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps<{
  data: any
  showAction?: boolean
  scroll?: any
}>()

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const tableSortOrder = ref<'ascend' | 'descend' | null>(null)

const columns = computed<any>(() => [
  {
    title: $t('DataSource.Detail.Redis.Table.Column.Index'),
    key: 'index',
    width: 80,
    align: 'center' as const
  },
  {
    title: $t('DataSource.Detail.Redis.Table.Column.Score'),
    key: 'score',
    dataIndex: 'score',
    width: 80,
    align: 'center' as const,
    sorter: (a: any, b: any) => a.score - b.score,
    sortOrder: tableSortOrder.value
  },
  {
    title: $t('DataSource.Detail.Redis.Table.Column.Value'),
    key: 'value',
    dataIndex: 'value',
    ellipsis: true
  },
  {
    title: $t('DataSource.Detail.Redis.Table.Column.View'),
    key: 'action',
    width: 80,
    align: 'center' as const
  }
])

const zsetData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const zsetValue = item?.value || {}

  if (typeof zsetValue !== 'object') {
    return []
  }

  return Object.entries(zsetValue).map(([score, value]) => ({
    value: String(value),
    score: Number(score)
  }))
})

const handleTableChange: any = (_: any, __: any, sorter: any) => {
  if (sorter && sorter.field === 'score') {
    tableSortOrder.value = sorter.order || null
  }
}

const handleCountUpdated = (count: number) => {
  emit('countUpdated', $t('DataSource.Detail.Redis.Zset.TotalElements', { count }))
}
</script>
