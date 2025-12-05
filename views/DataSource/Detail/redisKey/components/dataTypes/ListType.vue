<template>
  <CommonTable
    :data="listData"
    :columns="columns"
    :showAction="showAction"
    :scroll="scroll"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index }}
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

const columns = [
  {
    title: $t('DataSource.Detail.Redis.Table.Column.Index'),
    key: 'index',
    width: 100,
    align: 'center' as const
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
]

const listData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const listValue = item?.value || []

  if (!Array.isArray(listValue)) {
    return []
  }

  return listValue.map((value, index) => ({
    index,
    value: String(value)
  }))
})

const handleCountUpdated = (count: number) => {
  emit('countUpdated', $t('DataSource.Detail.Redis.List.TotalElements', { count }))
}
</script>
