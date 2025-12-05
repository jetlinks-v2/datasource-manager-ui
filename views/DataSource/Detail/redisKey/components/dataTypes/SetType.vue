<template>
  <CommonTable
    :data="setData"
    :columns="columns"
    :showAction="showAction"
    :scroll="scroll"
    @countUpdated="handleCountUpdated"
  >
    <template #index="{ index }">
      {{ index + 1 }}
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
    width: 80,
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

const setData = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return []
  }

  const item = props.data[0]
  const setValue = item?.value || []

  if (!Array.isArray(setValue)) {
    return []
  }

  return setValue.map((value) => ({
    value: String(value)
  }))
})

const handleCountUpdated = (count: number) => {
  emit('countUpdated', $t('DataSource.Detail.Redis.Set.TotalElements', { count }))
}
</script>
