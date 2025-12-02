<template>
  <div class="field-selector">
    <div class="title">
      <TitleComponent
        :data="$t('DataSource.EsFieldSelector.100072-4')"
        :style="{ margin: 0 }"
      />
      <div class="selection-actions">
        <a-input
          v-model:value="searchText"
          :placeholder="$t('DataSource.EsFieldSelector.100072-5')"
        >
          <template #prefix>
            <AIcon type="SearchOutlined" />
          </template>
        </a-input>
      </div>
    </div>
    <div class="selector-content">
      <a-spin :spinning="loading">
        <j-pro-table
          v-if="fields.length > 0"
          :columns="columns"
          :dataSource="filteredFields || []"
          :noPagination="true"
          mode="TABLE"
          :scroll="{ y: 'calc(100vh - 500px)' }"
          size="small"
          style="padding: 0 0 0 16px"
        />
        <div
          v-else
          class="empty-state"
        >
          <j-empty :description="$t('DataSource.EsFieldSelector.100072-6')" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps<{
  fields: any[]
  loading: boolean
}>()

const searchText = ref('')

const columns = [
  {
    title: $t('DataSource.EsFieldSelector.100072-0'),
    dataIndex: 'id',
    key: 'id',
    ellipsis: true,
    width: 120
  },
  {
    title: $t('DataSource.EsFieldSelector.100072-1'),
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    width: 120
  },
  {
    title: $t('DataSource.EsFieldSelector.100072-2'),
    dataIndex: ['valueType', 'type'],
    key: 'type',
    ellipsis: true,
    width: 100
  },
  {
    title: $t('DataSource.EsFieldSelector.100072-3'),
    dataIndex: ['valueType', 'name'],
    key: 'typeName',
    ellipsis: true,
    width: 100
  }
]

const filteredFields = computed(() => {
  if (!searchText.value) {
    return props.fields
  }
  const searchValue = searchText.value.toLowerCase()
  return props.fields.filter((field: any) => field.name.toLowerCase()?.includes(searchValue))
})
</script>

<style scoped lang="less">
.field-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid #e8e8e8;

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 0 16px;

    h3 {
      margin: 0;
      font-size: 15px;
    }

    .selection-actions {
      white-space: nowrap;
      display: flex;
      gap: 8px;
    }
  }

  .selector-content {
    flex: 1;
    overflow: hidden;
  }

  .empty-state {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
