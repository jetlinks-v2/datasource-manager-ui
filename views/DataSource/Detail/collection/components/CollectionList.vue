<template>
  <div class="collection-sidebar">
    <ListHeader
      search-placeholder="请输入集合名"
      @search="handleSearch"
    >
      <template #count>
        <slot name="header">
          共
          <a>&nbsp;{{ listData.length }}&nbsp;</a>
          个集合
        </slot>
      </template>
    </ListHeader>

    <div class="collection-list">
      <a-spin :spinning="loading">
        <a-list
          v-if="filteredListData.length > 0"
          size="small"
          :data-source="filteredListData"
          :split="false"
        >
          <template #renderItem="{ item }">
            <a-list-item
              class="collection-item"
              @click="handleClick(item)"
              :class="selectedItem === item.name ? 'collection-item-active' : ''"
            >
              <div class="collection-item-content">
                <a-space>
                  <AIcon type="DatabaseOutlined" />
                  <j-ellipsis>{{ item.name }}</j-ellipsis>
                </a-space>
                <span
                  v-if="item.fields?.length > 0"
                  class="collection-count"
                >
                  {{ item.fields.length }}个字段
                </span>
              </div>
            </a-list-item>
          </template>
        </a-list>
        <div
          v-else
          class="empty-collection"
        >
          <j-empty />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts" name="CollectionList">
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'

interface CollectionSchema {
  name: string
  fields: any[]
}

interface Props {
  initialSelectedCollection?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialSelectedCollection: ''
})

const emit = defineEmits(['click', 'loaded'])

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

const searchQuery = ref('')
const sourceData = ref<CollectionSchema[]>([])
const listData = ref<CollectionSchema[]>([])
const selectedItem = ref('')
const loading = ref(false)

// 过滤后的数据
const filteredListData = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return listData.value
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase().trim()

  return listData.value.filter((item) => {
    return item.name.toLowerCase().includes(lowerCaseQuery)
  })
})

const handleSearch = (value: string) => {
  searchQuery.value = value
  if (filteredListData.value.length > 0) {
    handleClick(filteredListData.value[0])
  }
}

const handleClick = (clickItem: CollectionSchema) => {
  selectedItem.value = clickItem.name
  emit('click', {
    clickItem,
    sourceData: sourceData.value
  })
}

// 初始加载数据
const loadInitialData = async () => {
  loading.value = true
  try {
    const resp = await queryDataSource(typeId, dataSourceId, 'GetCollectionNames', {})
    if (resp.success && resp.result) {
      // 将集合名称数组转换为 CollectionSchema 格式
      const collections = Array.isArray(resp.result) ? resp.result : []
      sourceData.value = collections.map((name: string) => ({
        name,
        fields: []
      }))
      listData.value = sourceData.value

      // 通知父组件集合已加载
      emit('loaded', listData.value)

      if (listData.value.length > 0) {
        // 如果有初始选中的集合，选中它；否则选中第一个
        if (props.initialSelectedCollection) {
          const targetCollection = listData.value.find(
            (item) => item.name === props.initialSelectedCollection
          )
          if (targetCollection) {
            handleClick(targetCollection)
          } else {
            handleClick(listData.value[0])
          }
        } else {
          handleClick(listData.value[0])
        }
      }
    }
  } catch (error) {
    console.error('加载集合失败:', error)
    emit('loaded', [])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInitialData()
})
</script>

<style scoped lang="less">
.collection-sidebar {
  width: 250px !important;
  flex: 0 0 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px 0 0 8px;
  margin-right: 4px;
}

.collection-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  scrollbar-gutter: stable;
  min-height: 0;

  :deep(.ant-list) {
    padding-right: 4px;
  }
}

.collection-item {
  width: 100%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin: 0 0 4px 0;

  &:hover {
    background-color: #f5f5f5;
  }

  .collection-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .collection-count {
      color: #999;
      font-size: 12px;
      white-space: nowrap;
      margin-left: 8px;
    }
  }
}

.collection-item-active {
  background-color: #f0f9ff;
  border-color: #d0ebff;

  .anticon {
    color: #1890ff;
  }

  :deep(.j-ellipsis) {
    color: #1890ff;
  }
}

.empty-collection {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  min-height: 300px;
}
</style>
