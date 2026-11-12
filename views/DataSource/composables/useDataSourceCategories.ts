import { computed, onBeforeUnmount, onMounted, provide, reactive, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { useI18n } from 'vue-i18n'
import { filterTreeNodes, onlyMessage } from '@jetlinks-web/utils'
import { addDataSourceGroup, deleteDataSourceGroup, getDataSourceGroup, updateDataSourceGroup } from '@datasource-manager-ui/api/data'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { spaceValidator } from '@datasource-manager-ui/utils/utils'
import type { DataSourceCategory, DataSourceCategoryState } from '../types'

/** 分类数据、编辑命令和列表选中项保持在同一个页面会话内。 */
export function useDataSourceCategories() {
  const { t } = useI18n()
  const state = reactive<DataSourceCategoryState>({
    items: [], selected: {}, keyword: '', loading: false, error: false,
    editor: { open: false, name: '', saving: false },
  })
  const allCategories = ref<DataSourceCategory[]>([])
  const listLength = ref(0)
  let requestId = 0
  let disposed = false

  const treeData = computed(() => {
    const nodes = state.items.map(item => ({ ...item, key: item.id }))
    const root = nodes.find(item => item.id === DEFAULT_CATEGORY_ID)
    const tree = root
      ? [{ ...root, children: nodes.filter(item => item.id !== DEFAULT_CATEGORY_ID) }]
      : nodes
    // 公共过滤工具会修改 children；这里每次派生新节点，保留完整分类与当前选中项。
    const keyword = state.keyword.trim()
    return keyword ? filterTreeNodes(tree, keyword, 'name') : tree
  })
  const nameRules = computed<Rule[]>(() => [
    { required: true, message: t('DataSource.BaseForm.100071-12'), trigger: 'blur' },
    { max: 64, message: t('DataSource.BaseForm.100071-4'), trigger: 'blur' },
    { validator: spaceValidator, trigger: 'blur' },
    {
      trigger: 'blur',
      validator: async (_, name: string) => {
        const duplicate = allCategories.value.some(item => item.id !== state.editor.id && item.name === name)
        if (duplicate || name === t('DataSource.index.100001-12')) {
          throw new Error(t('DataSource.index.100001-2'))
        }
      },
    },
  ])

  const loadCategories = async () => {
    if (disposed) return
    const current = ++requestId
    state.loading = true
    state.error = false
    try {
      const response = await getDataSourceGroup({
        terms: [],
        sorts: [{ name: 'ordinal', order: 'desc' }], paging: false,
      })
      // 多次刷新时，旧请求不能覆盖当前分类和选中项。
      if (current !== requestId) return
      if (response.status !== 200) throw new Error('Unable to load data source categories')
      const categories = response.result as DataSourceCategory[]
      state.items = [{ id: DEFAULT_CATEGORY_ID, name: t('DataSource.index.100001-12') }, ...categories]
      allCategories.value = state.items.map(item => ({ ...item }))
      state.selected = state.items[0] || {}
    } catch {
      if (current === requestId) state.error = true
    } finally {
      if (current === requestId) state.loading = false
    }
  }
  const searchCategories = (keyword: string) => {
    state.keyword = keyword
  }
  const refreshCategories = () => {
    state.keyword = ''
    return loadCategories()
  }
  const selectCategory = (category: DataSourceCategory) => {
    if (state.selected.id !== category.id) state.selected = category
  }
  const openEditor = (category?: DataSourceCategory) => {
    if (category?.id === DEFAULT_CATEGORY_ID) return
    state.editor = { open: true, id: category?.id, name: category?.name || '', saving: false }
  }
  const closeEditor = () => {
    if (!state.editor.saving) state.editor.open = false
  }
  const saveCategory = async () => {
    if (state.editor.saving) return
    const { id, name } = state.editor
    state.editor.saving = true
    try {
      const response = id ? await updateDataSourceGroup(id, { name }) : await addDataSourceGroup({ name })
      if (response.status !== 200) throw new Error('Unable to save data source category')
      onlyMessage(t(id ? 'DataSource.index.100001-3' : 'DataSource.index.100001-4'))
      state.editor.open = false
      await refreshCategories()
    } catch {
      onlyMessage(t(id ? 'DataSource.index.100001-5' : 'DataSource.index.100001-6'), 'error')
    } finally {
      state.editor.saving = false
    }
  }
  const removeCategory = (id: string) => {
    if (id === DEFAULT_CATEGORY_ID) return
    Modal.confirm({
      title: t('DataSource.index.100001-7'),
      content: t(listLength.value === 0 ? 'DataSource.index.100001-8' : 'DataSource.index.100001-9'),
      onOk: async () => {
        const response = await deleteDataSourceGroup(id)
        if (response.status === 200) {
          onlyMessage(t('DataSource.index.100001-11'))
          await refreshCategories()
        }
      },
    })
  }

  provide('CATEGORY_LIST', allCategories)
  onMounted(() => loadCategories())
  onBeforeUnmount(() => { disposed = true; ++requestId })

  return { state, treeData, nameRules, listLength, loadCategories, searchCategories, refreshCategories, selectCategory, openEditor, closeEditor, saveCategory, removeCategory }
}
