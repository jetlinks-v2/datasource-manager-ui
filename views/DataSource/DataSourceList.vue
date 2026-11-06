<template>
  <DefineCreateButton>
    <j-permission-button
      class="datasource-list__create" type="primary"
      :hasPermission="`${permission}:add`" @click="handleAdd"
    >
      <template #icon><AIcon type="PlusOutlined" /></template>
      {{ t('DataSource.index.100001-1') }}
    </j-permission-button>
  </DefineCreateButton>
  <div class="datasource-list">
    <a-alert v-if="loadError" type="error" show-icon :message="t('DataSource.list.loadFailed')">
      <template #action><a-button size="small" @click="updateSourceList">{{ t('DataSource.list.retry') }}</a-button></template>
    </a-alert>
    <j-pro-table
      ref="tableRef" class="pro-table__no-padding"
      :columns="dataSourceColumns" :params="queryParams" :request="handleSearch"
      :pagination="{ defaultPageSize: 12 }" :scroll="{ x: 800 }" mode="TABLE"
    >
      <template #headerLeftRender>
        <a-flex gap="small" class="datasource-list__toolbar">
          <ConditionFilter
            v-model="filterModel" class="datasource-list__filter" noMargin
            :columns="dataSourceColumns" target="datasource-manager" @search="onSearch"
          />
          <CreateButton />
        </a-flex>
      </template>
      <template #name="row">
        <a class="datasource-list__name" @click="handleDetail(row)">
          <AIcon :type="iconMaps[row.searchCode]" />
          <j-ellipsis>{{ row.name }}</j-ellipsis>
        </a>
      </template>
      <template #searchCode="{ searchCode }">{{ DATASOURCE_NAME[searchCode] }}</template>
      <template #id="{ id }"><j-ellipsis>{{ id }}</j-ellipsis></template>
      <template #description="{ description }"><j-ellipsis>{{ description || t('comm.table.empty') }}</j-ellipsis></template>
      <template #action="row">
        <TableActions>
          <TableActionsItem v-for="(action, index) in getActions(row)" :key="action.key" :common="index < 2" v-slot="{ placement }">
            <j-permission-button
              type="link" size="small" :danger="action.key === 'delete'"
              :hasPermission="`${permission}:${action.permission}`" :tooltip="{ title: action.text }"
              :popConfirm="action.popConfirm" @click="action.onClick?.()"
            >
              <template #icon><AIcon :type="action.icon" /></template>
              <template v-if="placement === 'more'">{{ action.text }}</template>
            </j-permission-button>
          </TableActionsItem>
        </TableActions>
      </template>
      <template #emptyText>
        <CloudEmpty v-if="!loadError" :search="searchTerms" :search-name="t('DataSource.index.100001-0')">
          <template #description>
            <div>{{ t('DataSource.List.100002-0') }}</div>
            <div>{{ t('DataSource.List.100002-1') }}</div>
          </template>
          <CreateButton />
        </CloudEmpty>
      </template>
    </j-pro-table>
  </div>

  <TypeAdd v-if="showTypeAdd" :active="activeKey" @close="handleClickNext" />
  <SourceDetailsAdd
    v-if="showSourceAdd" :active="activeKey" :editData="editData" :permission="permission"
    @close="handleClose" @openType="handleShowTypeAdd" @update="updateSourceList"
    @refreshCategoryList="emit('refreshCategoryList')" @success="handleCreateSuccess"
  />
  <DialogTips ref="dialogTipsRef" />
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { createReusableTemplate } from '@vueuse/core'
import { dataSourceColumns, iconMaps } from './table'
import { DATASOURCE_NAME } from './components/table'
import TypeAdd from './components/dataSourceModal/TypeAdd.vue'
import SourceDetailsAdd from './components/dataSourceModal/SourceDetailsAdd.vue'
import DialogTips from './components/dataSourceModal/DialogTips.vue'
import { useDataSourceList } from './composables/useDataSourceList'
import type { DataSourceCategory } from './types'

defineOptions({ name: 'DataSourceList' })
const props = defineProps<{ clickItem: Partial<DataSourceCategory>; permission: string }>()
const emit = defineEmits<{ 'update:value': [count: number]; refreshCategoryList: [] }>()
const { t } = useI18n()
const [DefineCreateButton, CreateButton] = createReusableTemplate()
const {
  tableRef, dialogTipsRef, showTypeAdd, showSourceAdd, editData, activeKey, filterModel,
  searchTerms, loadError, queryParams, onSearch, handleSearch, handleAdd, handleClickNext,
  handleClose, handleShowTypeAdd, handleDetail, getActions, updateSourceList, handleCreateSuccess,
} = useDataSourceList(toRef(props, 'clickItem'), count => emit('update:value', count))
</script>

<style scoped lang="less">
.datasource-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  min-width: 0;
  min-height: 0;

  > .pro-table { flex: 1 1 0; min-height: 0; }
  &__toolbar { width: 100%; min-width: 0; align-items: flex-start; }
  &__filter { flex: 0 1 40rem; width: 40rem; min-width: 0; max-width: 100%; }
  &__create { flex: none; }
  &__name { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
  &__name > :last-child { flex: 1; min-width: 0; }

  :deep(.jtable-body-header-left) { flex: 1; min-width: 0; }
  :deep(.ant-table-cell .ant-btn-link) { padding: 0; }
}
</style>
