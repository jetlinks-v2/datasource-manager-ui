<template>
  <div class="datasource-categories">
    <header class="datasource-categories__header">
      <strong>{{ t('DataSource.category.title') }}</strong>
    </header>
    <a-input
      :value="state.keyword" allow-clear
      :placeholder="t('DataSource.BaseForm.100071-11')" :aria-label="t('DataSource.BaseForm.100071-11')"
      @update:value="emit('search', $event)"
    >
      <template #prefix><AIcon type="SearchOutlined" aria-hidden="true" /></template>
    </a-input>
    <div class="datasource-categories__body">
      <a-spin :spinning="state.loading">
        <a-alert v-if="state.error" type="error" show-icon :message="t('DataSource.category.loadFailed')">
          <template #action><a-button size="small" @click="emit('retry')">{{ t('DataSource.list.retry') }}</a-button></template>
        </a-alert>
        <a-tree
          v-else-if="treeData.length" :key="state.keyword.trim()" :tree-data="treeData"
          :field-names="{ title: 'name', key: 'id', children: 'children' }"
          :selected-keys="state.selected.id ? [state.selected.id] : []"
          :default-expanded-keys="[DEFAULT_CATEGORY_ID]"
          :default-expand-all="!!state.keyword.trim()"
          :show-line="{ showLeafIcon: false }" block-node
          @select="handleSelect"
        >
          <template #title="category">
            <div class="datasource-categories__item">
              <AIcon :type="category.id === DEFAULT_CATEGORY_ID ? 'DatabaseOutlined' : 'FolderOutlined'" />
              <j-ellipsis class="datasource-categories__name">{{ category.name }}</j-ellipsis>
              <div v-if="category.id !== DEFAULT_CATEGORY_ID && category.id === state.selected.id" class="datasource-categories__actions" @click.stop>
                <j-permission-button
                  type="link" size="small" :hasPermission="`${permission}:edit_class`"
                  :tooltip="{ title: t('DataSource.category.edit') }" @click="emit('edit', category.dataRef)"
                ><AIcon type="EditOutlined" /></j-permission-button>
                <j-permission-button
                  type="link" size="small" danger :hasPermission="`${permission}:delete_class`"
                  :tooltip="{ title: t('DataSource.index.100001-10') }" @click="emit('remove', category.id)"
                ><AIcon type="DeleteOutlined" /></j-permission-button>
              </div>
            </div>
          </template>
        </a-tree>
        <CloudEmpty v-else-if="!state.loading" :search="state.keyword.trim()" :search-name="t('DataSource.category.title')" />
      </a-spin>
    </div>
    <j-permission-button block :hasPermission="`${permission}:add_class`" @click="emit('create')">
      <template #icon><AIcon type="PlusOutlined" /></template>
      {{ t('DataSource.BaseForm.100071-10') }}
    </j-permission-button>
  </div>

  <a-modal
    :open="state.editor.open" :width="416" destroy-on-close :mask-closable="false"
    :title="t(state.editor.id ? 'DataSource.category.edit' : 'DataSource.BaseForm.100071-10')"
    :closable="!state.editor.saving" @cancel="emit('cancel')"
  >
    <a-form id="datasource-category-form" :model="state.editor" layout="vertical" @finish="emit('save')">
      <a-form-item name="name" :label="t('DataSource.BaseForm.100071-11')" :rules="nameRules" :validate-first="true">
        <a-input
          :value="state.editor.name" :placeholder="t('DataSource.BaseForm.100071-12')"
          :disabled="state.editor.saving" @update:value="emit('rename', $event)"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button :disabled="state.editor.saving" @click="emit('cancel')">{{ t('DataSource.SourceAdd.100005-12') }}</a-button>
      <a-button type="primary" html-type="submit" form="datasource-category-form" :loading="state.editor.saving">
        {{ t('DataSource.SourceAdd.100005-13') }}
      </a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Rule } from 'ant-design-vue/es/form'
import type { TreeProps } from 'ant-design-vue'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import type { DataSourceCategory, DataSourceCategoryState } from '../types'

const props = defineProps<{
  state: DataSourceCategoryState
  treeData: (DataSourceCategory & { key: string; children?: (DataSourceCategory & { key: string })[] })[]
  nameRules: Rule[]
  permission: string
}>()
const emit = defineEmits<{
  search: [keyword: string]
  select: [category: DataSourceCategory]
  create: []
  edit: [category: DataSourceCategory]
  remove: [id: string]
  rename: [name: string]
  save: []
  cancel: []
  retry: []
}>()
const { t } = useI18n()
const handleSelect: TreeProps['onSelect'] = (keys) => {
  const category = props.state.items.find(item => item.id === keys[0])
  if (category) emit('select', category)
}
</script>

<style scoped lang="less">
.datasource-categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: 100%;
  min-height: 0;
  min-width: 0;

  > :not(.datasource-categories__body) { flex-shrink: 0; }

  &__header strong {
    color: var(--jet-theme-text-title);
    font-size: var(--fs-18);
    font-weight: var(--chrome-label-font-weight);
    line-height: var(--lh-24);
  }

  &__body { flex: 1; min-height: 0; overflow: auto; }
  &__item { display: flex; align-items: center; gap: var(--space-1); min-width: 0; line-height: 2rem; }
  &__name { flex: 1; min-width: 0; }
  &__actions { display: flex; flex-shrink: 0; }
}
</style>
