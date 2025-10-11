<template>
  <div class="index-sidebar">
    <ListHeader
      search-placeholder="index-name-*"
      @search="handleSearch"
    >
      <template #count>
        <slot name="header">
          共
          <a>&nbsp;{{ total }}&nbsp;</a>
          个索引
        </slot>
      </template>
    </ListHeader>

    <div
      class="index-list"
      ref="scrollContainerRef"
      @scroll="handleScroll"
    >
      <a-list
        v-if="allData.length > 0"
        size="small"
        :data-source="allData"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item
            class="index-item"
            @click="handleClick(item)"
            :class="selectedIndex === item.index ? 'index-item-active' : ''"
          >
            <a-space>
              <AIcon type="DatabaseOutlined" />
              <j-ellipsis>{{ item.index }}</j-ellipsis>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
      <div
        v-else
        class="empty-index"
        style="height: 100%"
      >
        <j-empty description="暂无数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="IndexList">
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'
import { queryEsIndexPager } from '@datasource-manager-ui/api/data/datasource'

const emit = defineEmits(['select'])
const props = defineProps<{
  selectedIndex: string
}>()

const route = useRoute()
const scrollContainerRef = ref<HTMLElement>()
const loading = ref(false)
const total = ref(0)
const pageIndex = ref(0)
const pageSize = 12
const hasMore = ref(true)
const allData = ref<any[]>([])
const searchQuery = ref('')

// 加载索引数据
const loadIndexData = async (append = false) => {
  if (loading.value) return
  if (append && !hasMore.value) return

  const id = route.params.id as string
  loading.value = true

  try {
    // 构建请求参数
    const params: any = {
      pageIndex: pageIndex.value,
      pageSize: append ? pageSize : 50
    }

    // 如果有搜索值，添加 indexPattern 参数
    if (searchQuery.value && searchQuery.value.trim()) {
      params.indexPattern = searchQuery.value.trim()
    }

    const res = await queryEsIndexPager(id, params)

    if (res.status === 200) {
      const { data = [], total: totalCount = 0 } = res.result
      total.value = totalCount

      if (append) {
        allData.value = [...allData.value, ...data]
      } else {
        allData.value = data
      }

      // 判断是否还有更多数据
      hasMore.value = allData.value.length < totalCount

      // 默认选中第一个
      if (!append && data.length > 0 && !props.selectedIndex) {
        nextTick(() => {
          handleClick(data[0])
        })
      }
    }
  } catch (error) {
    console.error('加载索引失败:', error)
  } finally {
    loading.value = false
  }
}

// 滚动加载更多
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  // 滚动到距离底部 50px 时加载更多
  if (scrollHeight - scrollTop - clientHeight < 50 && hasMore.value && !loading.value) {
    pageIndex.value++
    loadIndexData(true)
  }
}

const handleClick = (item: any) => {
  if (item.index === props.selectedIndex) return
  emit('select', item)
}

const handleSearch = (value: string) => {
  searchQuery.value = value
  // 重置分页和数据
  pageIndex.value = 0
  allData.value = []
  hasMore.value = true
  // 重新加载数据
  loadIndexData()
}

onMounted(() => {
  loadIndexData()
})
</script>

<style scoped lang="less">
.index-sidebar {
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px 0 0 8px;
  margin-right: 4px;
}

.index-list {
  flex: 1;
  overflow: auto;

  :deep(.ant-list) {
    padding-right: 4px;
  }
}

.index-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  margin: 0 0 4px 0;

  &:hover {
    background-color: #f5f5f5;
  }
}

.index-item-active {
  background-color: #f0f9ff;
  border-color: #d0ebff;

  .anticon {
    color: #1890ff;
  }

  :deep(.j-ellipsis) {
    color: #1890ff;
  }
}

.empty-index {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  color: #999;
  flex: 1;
}
</style>
