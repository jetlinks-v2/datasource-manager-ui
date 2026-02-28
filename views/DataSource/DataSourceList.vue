<template>
  <div class="main">
    <pro-search
      :columns="dataSourceColumns"
      target="datasource-manager"
      @search="onSearch"
    />
    <FullPage>
      <j-pro-table
        ref="tableRef"
        :columns="dataSourceColumns"
        :params="queryParams"
        :request="handleSearch"
        mode="TABLE"
        :class="{ 'empty-table-cell': !showDataTable }"
      >
        <template #name="slotProps">
          <a-space @click="handleDetail(slotProps)">
            <AIcon :type="iconMaps[slotProps.searchCode]" />
            <a>
              <j-ellipsis>
                {{ slotProps.name }}
              </j-ellipsis>
            </a>
          </a-space>
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
          <div @click.stop>
            <!-- 编辑按钮 -->
            <j-permission-button
              style="padding: 4px 8px"
              :hasPermission="`${permission}:update`"
              :tooltip="{ title: $t('DataSource.List.100002-2') }"
              type="link"
              @click="handleEdit(slotProps)"
            >
              <AIcon type="EditOutlined" />
            </j-permission-button>

            <!-- 详情按钮 -->
            <j-permission-button
              style="padding: 4px 8px"
              :hasPermission="`${permission}:update`"
              :tooltip="{ title: $t('DataSource.List.100002-6') }"
              type="link"
              @click="handleDetail(slotProps)"
            >
              <AIcon type="ControlOutlined" />
            </j-permission-button>

            <!-- 删除按钮 -->
            <j-permission-button
              style="padding: 4px 8px"
              :hasPermission="`${permission}:delete`"
              :popConfirm="{
                title: $t('DataSource.index.100001-10'),
                content: $t('DataSource.List.100002-3'),
                onConfirm: () => handleDelete(slotProps.id)
              }"
              :tooltip="{ title: $t('DataSource.index.100001-10') }"
              danger
              type="link"
            >
              <AIcon type="DeleteOutlined" />
            </j-permission-button>
          </div>
        </template>

        <template #emptyText>
          <div class="empty-table">
            <j-empty>
              <template #description>
                <a-space direction="vertical">
                  <span style="font-size: 18px">{{ $t('DataSource.List.100002-0') }}</span>
                  <span style="font-size: 14px; color: rgba(0, 0, 0, 0.6)">{{ $t('DataSource.List.100002-1') }}</span>
                </a-space>
              </template>
            </j-empty>
          </div>
        </template>
      </j-pro-table>
    </FullPage>
  </div>

  <TypeAdd
    v-if="showTypeAdd"
    :active="activeKey"
    @close="handleClickNext"
  />

  <SourceDetailsAdd
    v-if="showSourceAdd"
    :active="activeKey"
    :editData="editData"
    :permission="permission"
    @close="handleClose"
    @openType="handleShowTypeAdd"
    @update="updateSourceList"
    @refreshCategoryList="refreshCategoryList"
    @success="handleCreateSuccess"
  />

  <DialogTips ref="dialogTipsRef" />
</template>
<script lang="ts" name="DataSourceList" setup>
import { dataSourceColumns, iconMaps } from './table'
import TypeAdd from './components/dataSourceModal/TypeAdd.vue'
import SourceDetailsAdd from './components/dataSourceModal/SourceDetailsAdd.vue'
import DialogTips from './components/dataSourceModal/DialogTips.vue'
import { deleteDataSource, disableDataSource, getDataSourceList } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { DATASOURCE_NAME, typesData } from './components/table'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { useSourceDetailStore } from './sourceDetail'
import { useI18n } from 'vue-i18n'
import { useMenuStore } from '@jetlinks-web-core/store'

const { t: $t } = useI18n()

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
const sourceDetailStore = useSourceDetailStore()

const menuStory = useMenuStore()
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
const dialogTipsRef = ref()
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
    ...typesData[0],
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

const handleDetail = (slotProps: any) => {
  menuStory.jumpPage('system/DataSource/Detail', { params: { id: slotProps.id }, query: { typeId: slotProps.typeId } })
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
      onlyMessage($t('DataSource.List.100002-4'))
    }
  }
}

const updateSourceList = () => {
  showDataTable.value = true
  tableRef.value?.reload()
}

const handleCreateSuccess = (payload: { id: string; typeId?: string }) => {
  dialogTipsRef.value?.show(payload)
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

onBeforeUnmount(() => {
  sourceDetailStore.clearCache()
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
    height: calc(100vh - 368px);
  }

  .empty-table-cell {
    :deep(.ant-table-cell) {
      border: none !important;
    }
  }
}

:deep(.full-page-warp) {
  flex: 1;
  overflow-y: auto;
}
</style>
