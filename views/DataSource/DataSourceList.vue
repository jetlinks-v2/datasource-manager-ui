<template>
  <div class="main">
    <pro-search
      :columns="dataSourceColumns"
      target="datasource-manager"
      @search="onSearch"
    />
    <FullPage>
      <template v-if="showDataTable">
        <j-pro-table
          ref="tableRef"
          :columns="dataSourceColumns"
          :params="queryParams"
          :request="handleSearch"
          mode="TABLE"
        >
          <template #name="slotProps">
            <router-link :to="`/system/DataSource/Detail/${slotProps.id}?typeId=${slotProps.typeId}`">
              <a-space>
                <AIcon :type="iconMaps[slotProps.searchCode]" />
                <j-ellipsis>
                  <span>{{ slotProps.name }}</span>
                </j-ellipsis>
              </a-space>
            </router-link>
          </template>
          <template #searchCode="{ searchCode }">
            <span>{{ getDataSourceName(searchCode) }}</span>
          </template>
          <template #id="slotProps">
            <j-ellipsis>
              <span>{{ slotProps.id }}</span>
            </j-ellipsis>
          </template>
          <template #description="slotProps">
            <j-ellipsis>
              <span>{{ slotProps.description || '--' }}</span>
            </j-ellipsis>
          </template>
          <template #action="slotProps">
            <!-- 编辑按钮 -->
            <j-permission-button
              style="padding: 4px 8px"
              :hasPermission="`${permission}:update`"
              :tooltip="{ title: '编辑' }"
              type="link"
              @click="handleEdit(slotProps)"
            >
              <AIcon type="EditOutlined" />
            </j-permission-button>
            <!-- 删除按钮 -->
            <j-permission-button
              style="padding: 4px 8px"
              :hasPermission="`${permission}:delete`"
              :popConfirm="{
                title: '删除该数据源后，相关数据将被删除，请谨慎操作',
                onConfirm: () => handleDelete(slotProps.id)
              }"
              :tooltip="{ title: '删除' }"
              danger
              type="link"
            >
              <AIcon type="DeleteOutlined" />
            </j-permission-button>
          </template>

          <template #emptyText></template>
        </j-pro-table>
      </template>

      <template v-else>
        <div class="empty-table">
          <j-empty>
            <template #description>
              <a-space direction="vertical">
                <span style="font-size: 18px">暂无数据</span>
                <span style="font-size: 14px; color: rgba(0, 0, 0, 0.6)">点击右上角「新增数据源」</span>
              </a-space>
            </template>
          </j-empty>
        </div>
      </template>
    </FullPage>
  </div>

  <TypeAdd
    v-if="showTypeAdd"
    :active="activeKey"
    @close="handleClickNext"
  ></TypeAdd>

  <SourceDetailsAdd
    v-if="showSourceAdd"
    :active="activeKey"
    :editData="editData"
    :permission="permission"
    @close="handleClose"
    @openType="handleShowTypeAdd"
    @update="updateSourceList"
    @refreshCategoryList="refreshCategoryList"
  ></SourceDetailsAdd>
</template>
<script lang="ts" name="DataSourceList" setup>
import { dataSourceColumns, iconMaps } from './table'
import TypeAdd from './components/TypeAdd.vue'
import SourceDetailsAdd from './components/SourceDetailsAdd.vue'
import { deleteDataSource, disableDataSource, getDataSourceList } from '@datasoureceManager/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { DATASOURCE_NAME, DATASOURCE_TYPE } from './components/table'
import { DEFAULT_CATEGORY_ID } from '@datasoureceManager/utils/const'

const props = defineProps({
  clickItem: {
    type: Object,
    default: {}
  },
  value: {
    type: Number,
    default: 0
  },
  permission: {
    type: String,
    default: ''
  }
})
const emits = defineEmits(['update:value', 'refreshCategoryList'])
const { clickItem } = toRefs(props)
const tableRef = ref()
const showTypeAdd = ref(false)
const showSourceAdd = ref(false)
const editData = ref({})
const activeKey = ref({})
const terms = ref<any[]>([])
const pageIndex = ref(0)
const pageSize = ref(12)
const showDataTable = ref(false)
const queryParams = computed(() => ({
  sorts: [
    {
      name: 'createTime',
      order: 'desc'
    }
  ],
  terms: terms.value,
  pageIndex: pageIndex.value,
  pageSize: pageSize.value
}))

const refreshCategoryList = () => {
  emits('refreshCategoryList')
}

const onSearch = (params: any) => {
  showDataTable.value = true
  const searchTerms = params.terms || []

  terms.value = [
    ...searchTerms,
    ...(clickItem.value.id === DEFAULT_CATEGORY_ID
      ? []
      : [
          {
            column: 'group',
            termType: 'eq',
            value: clickItem.value.id
          }
        ])
  ]
}

const handleSearch = (tableInfo: any) =>
  new Promise((resolve) => {
    if (clickItem.value.name) {
      pageIndex.value = tableInfo.pageIndex
      pageSize.value = tableInfo.pageSize
      getDataSourceList(queryParams.value).then((resp: any) => {
        emits('update:value', resp.result.data.length)
        showDataTable.value = resp.result.data.length > 0
        resolve({
          success: resp.success,
          status: resp.status,
          result: resp.result
        })
      })
    } else {
      emits('update:value', 0)
      resolve({
        success: true,
        status: 200,
        result: {
          data: [],
          pageSize: 0,
          pageIndex: 0
        }
      })
    }
  })

const getDataSourceName = (value: string) => {
  if (value)
    for (let key in DATASOURCE_NAME) {
      if (key === value) {
        return DATASOURCE_NAME[key]
      }
    }
}

const handleAdd = () => {
  activeKey.value = {
    value: DATASOURCE_TYPE.API,
    group: clickItem.value
  }
  showTypeAdd.value = true
}

const handleClickNext = (active: string) => {
  showTypeAdd.value = false
  activeKey.value = {}
  if (active) {
    activeKey.value = active
    showSourceAdd.value = true
  }
}

const handleClose = () => {
  showSourceAdd.value = false
  editData.value = {}
}

const handleShowTypeAdd = (active: string) => {
  activeKey.value = active
  showSourceAdd.value = false
  showTypeAdd.value = true
}

const handleEdit = (slotProps: any) => {
  editData.value = slotProps
  showSourceAdd.value = true
}

const handleDelete = async (id: string) => {
  const res = await disableDataSource(id)
  if (res.success) {
    const res = await deleteDataSource(id)
    if (res.success) {
      updateSourceList()
      onSearch({ terms: [] })
      onlyMessage('删除成功')
    }
  }
}

const updateSourceList = () => {
  showDataTable.value = true
  tableRef.value?.reload()
}

watch(
  () => clickItem.value,
  (item: any) => {
    showDataTable.value = true
    terms.value =
      item.id === DEFAULT_CATEGORY_ID
        ? []
        : [
            {
              column: 'group',
              termType: 'eq',
              value: item.id
            }
          ]
  }
)

provide('CLICK_ITEM', clickItem)

defineExpose({
  handleAdd
})
</script>

<style lang="less" scoped>
.main {
  display: flex;
  flex-direction: column;
  height: 100%;

  .empty-table {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 360px);
  }
}

:deep(.full-page-warp) {
  flex: 1;
  overflow-y: auto;
}
</style>
