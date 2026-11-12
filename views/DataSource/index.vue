<template>
  <j-page-container>
    <FullPage transparentBackground>
      <EqualHeightColumns left-width="18.75rem" right-width="1fr">
        <template #left>
          <DataSourceCategorySidebar
            :state="state" :tree-data="treeData" :name-rules="nameRules" :permission="permission"
            @search="searchCategories" @select="selectCategory" @create="openEditor()"
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
import DataSourceList from './DataSourceList.vue'
import DataSourceCategorySidebar from './components/DataSourceCategorySidebar.vue'
import { useDataSourceCategories } from './composables/useDataSourceCategories'

defineOptions({ name: 'Datasource' })

const permission = 'system/DataSource'
const {
  state, treeData, nameRules, listLength, loadCategories, searchCategories,
  refreshCategories, selectCategory, openEditor, closeEditor, saveCategory, removeCategory,
} = useDataSourceCategories()
</script>
