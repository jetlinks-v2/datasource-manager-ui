<template>
  <j-page-container>
    <FullPage transparentBackground>
      <EqualHeightColumns left-width="18.75rem" right-width="1fr">
        <template #left-header>
          <a-input :value="state.keyword" allow-clear :placeholder="t('DataSource.BaseForm.100071-11')" :aria-label="t('DataSource.category.title')" @update:value="searchCategories">
            <template #prefix><AIcon type="SearchOutlined" aria-hidden="true" /></template>
          </a-input>
        </template>
        <template #left>
          <DataSourceCategorySidebar
            :state="state" :tree-data="treeData" :name-rules="nameRules" :permission="permission"
            @select="selectCategory" @create="openEditor()"
            @edit="openEditor" @remove="removeCategory" @rename="state.editor.name = $event"
            @save="saveCategory" @cancel="closeEditor" @retry="loadCategories()"
          />
        </template>
        <template #right>
          <DataSourceList
            :click-item="state.selected" :permission="permission"
            @update:value="listLength = $event" @refresh-category-list="refreshCategories"
          />
        </template>
      </EqualHeightColumns>
    </FullPage>
  </j-page-container>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DataSourceList from './DataSourceList.vue'
import DataSourceCategorySidebar from './components/DataSourceCategorySidebar.vue'
import { useDataSourceCategories } from './composables/useDataSourceCategories'

defineOptions({ name: 'Datasource' })

const permission = 'system/DataSource'
const { t } = useI18n()
const {
  state, treeData, nameRules, listLength, loadCategories, searchCategories,
  refreshCategories, selectCategory, openEditor, closeEditor, saveCategory, removeCategory,
} = useDataSourceCategories()
</script>
