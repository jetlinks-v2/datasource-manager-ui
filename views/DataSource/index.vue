<template>
  <j-page-container>
    <FullPage>
      <ContentPanel>
	      <EqualHeightColumns class="parameter-container" left-width="20rem">
		      <template #left>
			      <div class="fixed-width">
				      <CategorySelect
					      :data="categoryList"
					      labelKey="name"
					      :labelRules="labelRules"
					      valueKey="id"
					      :defaultKey="DEFAULT_CATEGORY_ID"
					      :showId="false"
					      removeDefaultMore
					      :bodyStyle="{ maxHeight: 'calc(100vh - 270px)' }"
					      :permission="permission"
					      :active-id="clickItem.id"
					      @change="handleChange"
					      @search="handleSearch"
					      @click="handleClick"
					      @delete="handleClickDelete"
				      >
					      <template #content="{ item }">
						      <j-ellipsis>
							      <div>{{ item.name }}</div>
						      </j-ellipsis>
					      </template>
				      </CategorySelect>
			      </div>
		      </template>
		      
		      <template #right>
			      <div style="flex: 1">
				      <DataSourceList
					      v-model:value="listLength"
					      :clickItem="clickItem"
					      :permission="permission"
					      ref="dataSourceListRef"
					      @refreshCategoryList="getCategoryList"
				      >
					      <j-permission-button
						      type="primary"
						      :hasPermission="`${permission}:add`"
						      @click="_handleAdd"
					      >
						      <AIcon type="PlusOutlined" />
						      {{ $t('DataSource.index.100001-1') }}
					      </j-permission-button>
				      </DataSourceList>
			      </div>
		      </template>
	      </EqualHeightColumns>
      </ContentPanel>
    </FullPage>
  </j-page-container>
</template>

<script setup lang="ts" name="Datasource">
import DataSourceList from './DataSourceList.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { Modal } from 'ant-design-vue'
import { cloneDeep } from 'lodash-es'
import {
  deleteDataSourceGroup,
  getDataSourceGroup,
  addDataSourceGroup,
  updateDataSourceGroup
} from '@datasource-manager-ui/api/data'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { Rule } from 'ant-design-vue/es/form'
import { moduleRegistry } from '@jetlinks-web-core/utils/module-registry'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const { CategorySelect } = moduleRegistry.getResource('visualization-manager-ui', 'components')

const permission = 'system/DataSource'
const dataSourceListRef = ref()
const listLength = ref()
const categoryList = ref([] as any)
const categoryListDeep = ref([] as any)
const clickItem = ref<any>({})

const labelRules: Rule[] = [
  {
    validator: (_, value: string) => {
      const flag = categoryList.value
        .filter((item: any) => {
          return !clickItem.value?.id || item.id !== clickItem.value?.id
        })
        .find((i: any) => i.name === value)
      if (!flag && value !== $t('DataSource.index.100001-12')) {
        return Promise.resolve()
      } else {
        return Promise.reject($t('DataSource.index.100001-2'))
      }
    },
    trigger: 'blur'
  }
]

const getCategoryList = async (searchValue?: string) => {
  let searchObj = {}
  if (searchValue) {
    searchObj = {
      column: 'name',
      value: `%${searchValue}%`,
      termType: 'like'
    }
  }
  let res = await getDataSourceGroup({
    terms: [searchObj],
    sorts: [
      {
        name: 'ordinal',
        order: 'desc'
      }
    ],
    paging: false
  })
  if (res.status === 200) {
    if (searchValue) {
      categoryList.value = res.result
    } else {
      categoryList.value = [
        {
          id: DEFAULT_CATEGORY_ID,
          name: $t('DataSource.index.100001-12')
        },
        ...res.result
      ]
      categoryListDeep.value = cloneDeep(categoryList.value)
    }

    if (categoryList.value.length > 0) {
      handleClick(categoryList.value[0])
    } else {
      clickItem.value = {}
    }
  }
}

const _handleAdd = () => {
  dataSourceListRef.value.handleAdd()
}

const handleChange = async (item: { id?: string; name: string }) => {
  try {
    const isEdit = !!item.id
    const successMessage = isEdit ? $t('DataSource.index.100001-3') : $t('DataSource.index.100001-4')
    const res = isEdit
      ? await updateDataSourceGroup(item.id!, { name: item.name })
      : await addDataSourceGroup({ name: item.name })
    if (res.status === 200) {
      clickItem.value = item
      onlyMessage(successMessage)
    } else {
      throw new Error(`API returned status ${res.status}`)
    }
  } catch (error) {
    const errorMessage = item.id ? $t('DataSource.index.100001-5') : $t('DataSource.index.100001-6')
    onlyMessage(errorMessage, 'error')
    console.error('Operation failed:', error)
  } finally {
    await getCategoryList()
  }
}

const handleSearch = (value: string) => {
  getCategoryList(value)
}

const handleClickDelete = async (id: string) => {
  const text = listLength.value === 0 ? $t('DataSource.index.100001-8') : $t('DataSource.index.100001-9')
  Modal.confirm({
    title: $t('DataSource.index.100001-7'),
    content: text,
    onOk: async () => {
      const res = await deleteDataSourceGroup(id)
      onlyMessage($t('DataSource.index.100001-11'))
      if (res.status === 200) {
        clickItem.value = {}
        await getCategoryList()
      }
    }
  })
}

const handleClick = (item: any) => {
  clickItem.value = item
}

onMounted(() => {
  getCategoryList()
})

provide('CATEGORY_LIST', categoryListDeep)
</script>

<style scoped lang="less">
.datasource-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 8px 20px;

  .datasource-title {
    font-size: 20px;
    font-weight: 500;
  }
}
.parameter-container {
  height: calc(100% - 40px);

  .fixed-width {
    box-sizing: border-box;
  }
}
:deep(.content-list-item) {
  padding: 0 12px !important;
}

:deep(.JSearch-warp) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
:deep(.jtable-body-header) {
  margin-bottom: 0;
}
</style>
