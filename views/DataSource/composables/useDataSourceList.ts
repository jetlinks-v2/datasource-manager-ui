import { computed, onBeforeUnmount, provide, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { onlyMessage } from '@jetlinks-web/utils'
import { useMenuStore } from '@jetlinks-web-core/store'
import type { ConditionFilterLegacySearchPayload, ConditionFilterTerm } from '@jetlinks-web-core/components/ConditionFilter'
import { deleteDataSource, disableDataSource, getDataSourceList } from '@datasource-manager-ui/api/data/datasource'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { typesData } from '../components/table'
import { useSourceDetailStore } from '../sourceDetail'
import type { DataSourceCategory, DataSourcePage, DataSourceRecord, DataSourceTypeSelection } from '../types'

interface TableQuery {
  pageIndex?: number
  pageSize?: number
}

/** 表格负责分页和请求状态，页面会话负责分类范围及数据源编辑流程。 */
export function useDataSourceList(category: Ref<Partial<DataSourceCategory>>, updateCount: (count: number) => void) {
  const { t } = useI18n()
  const menuStore = useMenuStore()
  const sourceDetailStore = useSourceDetailStore()
  const tableRef = ref<{ reload: () => void }>()
  const dialogTipsRef = ref<{ show: (payload: { id: string; typeId?: string }) => void }>()
  const showTypeAdd = ref(false)
  const showSourceAdd = ref(false)
  const editData = ref<Partial<DataSourceRecord>>({})
  const activeKey = ref<DataSourceTypeSelection>({})
  const filterModel = ref<ConditionFilterTerm[]>([])
  const searchTerms = ref<ConditionFilterLegacySearchPayload['terms']>([])
  const loadError = ref(false)
  let requestId = 0
  const queryParams = computed(() => ({
    sorts: [{ name: 'createTime', order: 'desc' }],
    terms: [
      ...searchTerms.value,
      ...(category.value.id && category.value.id !== DEFAULT_CATEGORY_ID
        ? [{ column: 'group', termType: 'eq', value: category.value.id }] : []),
    ],
  }))

  const onSearch = (params: ConditionFilterLegacySearchPayload) => {
    searchTerms.value = (params.terms || []).filter(group => group.terms.length > 0)
  }
  const handleSearch = async (tableInfo: TableQuery) => {
    const current = ++requestId
    loadError.value = false
    if (!category.value.name) {
      updateCount(0)
      return { success: true, status: 200, result: { data: [], total: 0, pageIndex: 0, pageSize: tableInfo.pageSize || 12 } }
    }
    try {
      const response = await getDataSourceList({
        ...queryParams.value, pageIndex: tableInfo.pageIndex ?? 0, pageSize: tableInfo.pageSize ?? 12,
      })
      if (response.status !== 200) throw new Error('Unable to load data sources')
      const result = response.result as DataSourcePage
      if (current === requestId) updateCount(result.data.length)
      return { success: response.success, status: response.status, result }
    } catch (error) {
      if (current === requestId) loadError.value = true
      throw error
    }
  }
  const handleAdd = () => {
    activeKey.value = { ...typesData[0], group: category.value }
    showTypeAdd.value = true
  }
  const handleClickNext = (active?: DataSourceTypeSelection) => {
    showTypeAdd.value = false
    activeKey.value = active || {}
    if (active) showSourceAdd.value = true
  }
  const handleClose = () => {
    showSourceAdd.value = false
    editData.value = {}
  }
  const handleShowTypeAdd = (active: DataSourceTypeSelection) => {
    activeKey.value = active
    showSourceAdd.value = false
    showTypeAdd.value = true
  }
  const handleDetail = (row: DataSourceRecord) => {
    menuStore.jumpPage('system/DataSource/Detail', { params: { id: row.id }, query: { typeId: row.typeId } })
  }
  const handleEdit = (row: DataSourceRecord) => {
    editData.value = row
    showSourceAdd.value = true
  }
  const updateSourceList = () => tableRef.value?.reload()
  const handleDelete = async (id: string) => {
    const disabled = await disableDataSource(id)
    if (!disabled.success) return
    const removed = await deleteDataSource(id)
    if (removed.success) {
      // 清空可见筛选和实际查询后，交给表格的参数监听刷新；无条件时手动刷新。
      const hadSearch = searchTerms.value.length > 0
      filterModel.value = []
      if (hadSearch) searchTerms.value = []
      else updateSourceList()
      onlyMessage(t('DataSource.List.100002-4'))
    }
  }
  const getActions = (row: DataSourceRecord) => [
    { key: 'edit', permission: 'update', icon: 'EditOutlined', text: t('DataSource.List.100002-2'), onClick: () => handleEdit(row) },
    { key: 'configure', permission: 'update', icon: 'ControlOutlined', text: t('DataSource.List.100002-6'), onClick: () => handleDetail(row) },
    {
      key: 'delete', permission: 'delete', icon: 'DeleteOutlined', text: t('DataSource.index.100001-10'),
      popConfirm: {
        title: t('DataSource.index.100001-10'), content: t('DataSource.List.100002-3'),
        onConfirm: () => handleDelete(row.id),
      },
    },
  ]
  const handleCreateSuccess = (payload: { id: string; typeId?: string }) => dialogTipsRef.value?.show(payload)

  watch(category, () => {
    ++requestId
    filterModel.value = []
    searchTerms.value = []
  })
  provide('CLICK_ITEM', category)
  onBeforeUnmount(() => { ++requestId; sourceDetailStore.clearCache() })

  return { tableRef, dialogTipsRef, showTypeAdd, showSourceAdd, editData, activeKey, filterModel, searchTerms, loadError, queryParams, onSearch, handleSearch, handleAdd, handleClickNext, handleClose, handleShowTypeAdd, handleDetail, getActions, updateSourceList, handleCreateSuccess }
}
