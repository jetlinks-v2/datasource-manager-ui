<template>
  <j-page-container>
    <FullPage>
      <div class="datasource-container">
        <div class="datasource-title">数据源</div>
        <j-permission-button
          type="primary"
          :hasPermission="`${permission}:add`"
          @click="_handleAdd"
        >
          <AIcon type="PlusOutlined" />
          新增
        </j-permission-button>
      </div>

      <div class="parameter-container">
        <div class="fixed-width">
          <CategorySelect
            ref="categorySelect"
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
        <a-divider
          type="vertical"
          style="height: calc(100% - 20px); margin: 0"
        ></a-divider>
        <div style="flex: 1">
          <DataSourceList
            v-model:value="listLength"
            :clickItem="clickItem"
            :permission="permission"
            ref="dataSourceListRef"
            @refreshCategoryList="getCategoryList"
          ></DataSourceList>
        </div>
      </div>
    </FullPage>
  </j-page-container>
</template>

<script setup lang="ts" name="Datasource">
import DataSourceList from './DataSourceList.vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { Modal } from 'ant-design-vue'
import { cloneDeep } from 'lodash-es'
import CategorySelect from '@datasource-manager-ui/components/CategorySelect/index.vue'
import {
  deleteDataSourceGroup,
  getDataSourceGroup,
  addDataSourceGroup,
  updateDataSourceGroup
} from '@datasource-manager-ui/api/data'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { Rule } from 'ant-design-vue/es/form'

const permission = 'system/DataSource'
const dataSourceListRef = ref()
const listLength = ref()
const categorySelect = ref()
const categoryList = ref([] as any)
const categoryListDeep = ref([] as any)
const clickItem = ref<any>({})
const router = useRouter()

const labelRules: Rule[] = [
  {
    validator: (_, value: string) => {
      const flag = categoryList.value
        .filter((item: any) => {
          return !clickItem.value?.id || item.id !== clickItem.value?.id
        })
        .find((i: any) => i.name === value)
      if (!flag && value !== '全部') {
        return Promise.resolve()
      } else {
        return Promise.reject('该名称重复')
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
          name: '全部'
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
    const successMessage = isEdit ? '编辑成功' : '新增成功'
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
    const errorMessage = item.id ? '编辑失败' : '新增失败'
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
  const text =
    listLength.value === 0
      ? '删除该分类？此操作不可撤销'
      : '将同步删除该分类下的所有数据，删除后可能导致错误或异常。谨慎操作，此操作不可撤销'
  Modal.confirm({
    title: '确定删除吗？',
    content: text,
    onOk: async () => {
      const res = await deleteDataSourceGroup(id)
      onlyMessage('操作成功')
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
  display: flex;
  padding: 0 0 20px 20px;

  .fixed-width {
    width: 280px;
    min-width: 280px;
    max-width: 280px;
    box-sizing: border-box;
  }
}
:deep(.content-list-item) {
  padding: 7px 12px !important;
}

:deep(.JSearch-warp) {
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
:deep(.jtable-body-header) {
  margin-bottom: 0;
}
</style>
