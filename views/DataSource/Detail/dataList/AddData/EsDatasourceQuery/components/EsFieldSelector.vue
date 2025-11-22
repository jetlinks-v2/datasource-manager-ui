<template>
  <div class="field-selector">
    <div class="title">
      <TitleComponent
        data="字段选择"
        :style="{ margin: 0 }"
      />
      <div class="selection-actions">
        <a-input
          v-model:value="searchText"
          placeholder="请输入名称"
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
          <j-empty description="请选择索引" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  fields: any[]
  loading: boolean
}>()

const searchText = ref('')

const columns = [
  {
    title: '名称',
    dataIndex: 'id',
    key: 'id',
    ellipsis: true,
    width: 120
  },
  {
    title: '注释',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    width: 120
  },
  {
    title: '字段类型',
    dataIndex: ['valueType', 'type'],
    key: 'type',
    ellipsis: true,
    width: 100
  },
  {
    title: '字段名称',
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
