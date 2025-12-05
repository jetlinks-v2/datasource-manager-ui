<template>
  <div class="fields-container">
    <div class="title">
      <TitleComponent
        :data="$t('DataSource.FieldSelector.100042-0')"
        :style="{ margin: 0 }"
      />
      <div class="selection-actions">
        <a-input
          v-model:value="searchText"
          :placeholder="$t('DataSource.FieldSelector.100042-1')"
        >
          <template #prefix>
            <AIcon type="SearchOutlined" />
          </template>
        </a-input>
      </div>
    </div>

    <div class="fields-table">
      <j-pro-table
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
        :columns="columns"
        :data-source="loading ? [] : filteredFields"
        :noPagination="true"
        mode="TABLE"
        :alert-show="false"
        :rowKey="(record: any) => record.name"
        :bodyStyle="{ padding: 0 }"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleComponent from '@jetlinks-web-core/components/TitleComponent/index.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

interface FieldSchema {
  name: string
  type: string
  comment?: string
}

type Key = string | number

const props = defineProps({
  fields: {
    type: Array as () => FieldSchema[],
    default: () => []
  },
  selectedKeys: {
    type: Array as () => Key[],
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:selectedKeys', 'selectChange'])

const searchText = ref('')
const selectedRowKeys = ref<Key[]>(props.selectedKeys)

const columns = computed(() => [
  { title: $t('DataSource.FieldSelector.100042-2'), dataIndex: 'name', key: 'name', search: { type: 'input' } },
  { title: $t('DataSource.FieldSelector.100042-3'), dataIndex: 'type', key: 'type', search: { type: 'input' } },
  {
    title: $t('DataSource.table.100003-6'),
    dataIndex: 'comment',
    key: 'comment',
    search: { type: 'input' },
    ellipsis: true
  }
])

const filteredFields = computed(() => {
  if (!searchText.value) {
    return props.fields
  }
  const searchValue = searchText.value.toLowerCase()
  return props.fields.filter((field: any) => field.name.toLowerCase()?.includes(searchValue))
})

const onSelectChange = (keys: Key[]) => {
  selectedRowKeys.value = keys
  emit('update:selectedKeys', keys)
  emit('selectChange', keys)
}

watch(
  () => props.selectedKeys,
  (newKeys) => {
    selectedRowKeys.value = newKeys
  },
  { deep: true }
)
</script>

<style scoped lang="less">
.fields-container {
  flex: 1;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-left: 1px solid #e8e8e8;

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .selection-actions {
      white-space: nowrap;
      display: flex;
      gap: 8px;
    }
  }

  .fields-table {
    flex: 1;
    overflow: auto;
  }
}
</style>
