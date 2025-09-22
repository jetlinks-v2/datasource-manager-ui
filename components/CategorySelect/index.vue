<template>
  <div class="category-select-container">
    <!-- 分类标题栏和搜索 -->
    <CategoryHeader
      ref="headerRef"
      :count="listData?.length || 0"
      :permission="permission"
      :removeEdit="removeEdit"
      @search="handleSearch"
      @add="handleAdd"
    />

    <!-- 分类列表内容 -->
    <div class="category-content">
      <div
        class="content-list"
        :style="bodyStyle"
      >
        <template v-if="listData.length !== 0">
          <CategoryItem
            v-for="item in listData"
            :key="item[idKey]"
            :item="item"
            :active="activeId === item[idKey]"
            :idKey="idKey"
            :valueKey="valueKey"
            :defaultKey="defaultKey"
            :removeEdit="removeEdit"
            :removeDefaultMore="removeDefaultMore"
            :permission="permission"
            @click="handleClickItem"
            @edit="handleMenuClick"
            @delete="handleDelete"
          >
            <template
              #content
              v-if="$slots.content"
            >
              <slot
                name="content"
                :item="item"
              ></slot>
            </template>
            <template
              #action
              v-if="$slots.action"
            >
              <slot
                name="action"
                :item="item"
              ></slot>
            </template>
          </CategoryItem>
        </template>
        <div
          v-else
          class="empty-container"
        >
          <j-empty />
        </div>
      </div>
    </div>

    <!-- 分类编辑弹窗 -->
    <CategoryModal
      v-model:visible="categoryModelVisible"
      :title="categoryModelTitle"
      :formState="categoryFormState"
      :labelKey="labelKey"
      :valueKey="valueKey"
      :idKey="idKey"
      :labelRules="labelRules"
      :valueRules="valueRules"
      :showId="showId"
      ref="categoryModal"
      @ok="handleCategoryModelOk"
    />
  </div>
</template>

<script setup lang="ts" name="CategorySelect">
import { cloneDeep } from 'lodash-es'
import { Rule } from 'ant-design-vue/es/form'
import { useDebounceFn } from '@vueuse/core'
import CategoryHeader from './components/CategoryHeader.vue'
import CategoryItem from './components/CategoryItem.vue'
import CategoryModal from './components/CategoryModal.vue'

interface CategoryData {
  [key: string]: any
}

interface Props {
  data: CategoryData[]
  defaultKey?: string
  labelKey?: string
  labelRules?: Rule[]
  valueKey?: string
  valueRules?: Rule[]
  idKey?: string
  showId?: boolean
  removeEdit?: boolean
  bodyStyle?: Record<string, any>
  removeDefaultMore?: boolean
  activeId?: string
  permission?: string
}

const emit = defineEmits(['more', 'click', 'change', 'delete', 'search'])
const props = withDefaults(defineProps<Props>(), {
  defaultKey: 'default',
  labelKey: 'text',
  labelRules: () => [],
  valueKey: 'value',
  valueRules: () => [],
  idKey: 'id',
  showId: true,
  removeEdit: false,
  bodyStyle: () => ({}),
  removeDefaultMore: false
})

// 组件引用
const categoryModal = ref()
const headerRef = ref()

// 状态变量
const listData = ref<CategoryData[]>([])
const activeId = ref('')
const categoryModelVisible = ref(false)
const categoryModelTitle = ref('')
const categoryFormState = ref({
  [props.labelKey]: '',
  [props.valueKey]: '',
  [props.idKey]: ''
})

// 防抖搜索
const debouncedSearch = useDebounceFn((value: string) => {
  emit('search', value)
}, 300)

// 处理搜索
const handleSearch = (value: string) => {
  debouncedSearch(value)
}

// 关闭搜索
const handleCloseSearch = () => {
  if (headerRef.value?.closeSearch) {
    headerRef.value.closeSearch()
  }
}

// 处理添加分类
const handleAdd = () => {
  categoryModelTitle.value = '新增分类'
  categoryModelVisible.value = true
  resetForm()
  nextTick(() => {
    emit('more')
  })
}

// 重置表单
const resetForm = () => {
  if (categoryModal.value?.reset) {
    categoryModal.value.reset()
    categoryFormState.value = {
      [props.labelKey]: '',
      [props.valueKey]: '',
      [props.idKey]: ''
    }
  }
}

// 处理点击分类项
const handleClickItem = (item: CategoryData) => {
  if (item[props.idKey] === activeId.value) return
  activeId.value = item[props.idKey]
  emit('click', item)
}

// 设置当前活动分类ID
const setActiveId = (item: CategoryData) => {
  activeId.value = item[props.idKey]
}

// 处理菜单点击
const handleMenuClick = (key: number, item: CategoryData) => {
  if (key === 1) {
    categoryModelTitle.value = '重命名'
    categoryModelVisible.value = true
    nextTick(() => {
      categoryModal.value.reset()
      categoryFormState.value[props.idKey] = item[props.idKey]
      categoryFormState.value[props.valueKey] = item[props.valueKey]
      categoryFormState.value[props.labelKey] = item[props.labelKey]
      emit('more', categoryFormState.value[props.idKey])
    })
  }
}

// 处理删除分类
const handleDelete = (item: CategoryData) => {
  emit('delete', item[props.idKey])
}

// 处理分类表单确认
const handleCategoryModelOk = async () => {
  try {
    await categoryModal.value.validate()
    const activeItem = props.data.find((item) => item[props.idKey] === activeId.value)
    emit('change', { ...activeItem, ...cloneDeep(categoryFormState.value) })
    categoryModelVisible.value = false
  } catch (error) {
    // 表单验证失败
    return
  }
}

// 监听数据变化
watch(
  () => props.data,
  (newValue) => {
    if (newValue) {
      listData.value = newValue || []
      if (newValue?.length > 0) {
        if (props.activeId) {
          activeId.value = props.activeId
        } else {
          const item = newValue[0]
          activeId.value = item ? item[props.idKey] : ''
        }
      }
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// 暴露方法
defineExpose({
  setActiveId,
  handleCloseSearch,
  handleAdd
})
</script>

<style scoped lang="less">
.category-select-container {
  width: 100%;
  height: calc(100% - 40px);
  --primary-color: #1677ff;
  --hover-bg: #fafafa;
  --active-bg: #f5f5f5;
  --border-radius: 4px;
  --transition-duration: 0.3s;

  .category-content {
    overflow: hidden;
    height: 100%;
    display: flex;

    .content-list {
      overflow: auto;
      display: flex;
      flex-direction: column;
      flex: 1;
      margin-right: 4px;
      gap: 4px;

      .empty-container {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>
