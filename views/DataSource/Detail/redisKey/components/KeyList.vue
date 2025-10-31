<template>
  <div class="sidebar">
    <ListHeader
      search-placeholder="请输入键名"
      @search="handleSearch"
    >
      <template #count>
        <div
          v-if="currentLevel === 0"
          class="count-text"
        >
          共
          <span class="total">{{ total }}</span>
          个键
        </div>
        <a-button
          v-else
          type="text"
          size="small"
          class="back-icon-btn"
          @click="handleBack"
        >
          <AIcon type="ArrowLeftOutlined" />
        </a-button>
      </template>

      <template #actions>
        <a-button
          type="text"
          size="small"
          @click="fetchKeyTotal(false)"
        >
          <AIcon :type="refreshLoading ? 'LoadingOutlined' : 'SyncOutlined'" />
        </a-button>
      </template>
    </ListHeader>

    <div
      class="list"
      ref="scrollContainerRef"
      @scroll="handleScroll"
    >
      <!-- 文件夹/键列表 -->
      <a-list
        v-if="displayData.length > 0"
        size="small"
        :data-source="displayData"
        :split="false"
      >
        <template #renderItem="{ item }">
          <a-list-item
            class="item"
            :class="{ 'item-active': selectedKey === item.name, 'item-folder': item.type === 'dir' }"
            @click="handleClick(item)"
          >
            <a-space>
              <AIcon
                v-if="item.type === 'dir'"
                type="FolderOutlined"
              />
              <AIcon
                v-else
                type="KeyOutlined"
              />
              <j-ellipsis style="max-width: 180px">{{ item.name }}</j-ellipsis>
            </a-space>
          </a-list-item>
        </template>
      </a-list>

      <div
        v-else-if="!loading"
        class="empty-index"
      >
        <j-empty description="暂无数据" />
      </div>

      <div
        v-if="loading"
        class="loading-more"
      >
        <a-spin size="small" />
        <span style="margin-left: 8px">加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="KeyList">
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { getToken, onlyMessage } from '@jetlinks-web/utils'
import { throttle } from 'lodash-es'

interface KeyItem {
  type: 'dir' | 'key'
  name: string
  prefix?: string
}

interface LevelData {
  prefix: string
  cursor: string
  data: KeyItem[]
}

interface DataSourceInfo {
  shareConfig: {
    delimiter?: string
    databaseIndex?: number
  }
}

const props = defineProps<{
  info: DataSourceInfo
}>()

const emit = defineEmits<{
  select: [item: KeyItem]
}>()

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string
const scrollContainerRef = ref<HTMLElement>()
const loading = ref(false)
const total = ref(0)
const displayData = ref<KeyItem[]>([])
const selectedKey = ref('')
const searchQuery = ref('')

const hasFolder = ref(false)
const currentLevel = ref(0)
const hasMore = ref(true)
const refreshLoading = ref(false)

// 创建层级数据对象
const createLevelData = (prefix: string): LevelData => ({
  prefix,
  cursor: '0',
  data: []
})

const levelStack = ref<LevelData[]>([createLevelData('')])

const checkFolderMode = () => {
  const delimiter = props.info?.shareConfig?.delimiter
  hasFolder.value = Boolean(delimiter && delimiter !== '')
}

// 选中第一个合适的键
const selectFirstAvailableKey = (data: KeyItem[]) => {
  if (data.length === 0) return

  nextTick(() => {
    const firstKey = data.find((item: KeyItem) => item.type === 'key')
    const targetItem = firstKey || data[0]

    if (targetItem && targetItem.type === 'key') {
      handleClick(targetItem)
    }
  })
}

// 重置当前层级状态
const resetCurrentLevelState = () => {
  const currentLevelData = levelStack.value[currentLevel.value]
  currentLevelData.cursor = '0'
  currentLevelData.data = []
  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''
}

// 获取键总数
const fetchKeyTotal = throttle(async (auto: boolean = true) => {
  if (!typeId) return

  try {
    refreshLoading.value = true
    const { shareConfig } = props.info
    const res = await queryDataSource(typeId, dataSourceId, 'ServerInfo', {
      index: shareConfig.databaseIndex
    })
    if (res.status === 200 && res.result?.dbSize?.keys !== undefined) {
      total.value = res.result.dbSize.keys
      if (!auto) onlyMessage('操作成功')
    }
  } catch (error) {
    console.error('获取键总数失败:', error)
    onlyMessage('获取键总数失败', 'error')
  } finally {
    refreshLoading.value = false
  }
}, 1000)

// 数据排序：目录在前，键在后
const sortData = (data: KeyItem[]): KeyItem[] => {
  return data.sort((a, b) => {
    if (a.type === 'dir' && b.type === 'key') return -1
    if (a.type === 'key' && b.type === 'dir') return 1
    return a.name.localeCompare(b.name)
  })
}

// 加载键数据
const loadKeyData = async (append = false) => {
  if (loading.value || !hasMore.value) return

  const token = getToken()
  const currentLevelData = levelStack.value[currentLevel.value]

  loading.value = true

  try {
    // 构建 pattern：如果有搜索内容，拼接 *，否则默认为 *
    const pattern = searchQuery.value ? `${searchQuery.value}*` : '*'

    const params = {
      sessionId: token,
      pattern,
      cursor: append ? currentLevelData.cursor : '0',
      prefix: currentLevelData.prefix
    }

    const res = await queryDataSource(typeId, dataSourceId, 'QueryKey', params)

    if (res.status === 200) {
      const { nextCursor = '0', data = [] } = res.result

      currentLevelData.cursor = nextCursor
      hasMore.value = nextCursor !== '0'
      const sortedData = sortData(data)

      if (append) {
        currentLevelData.data = [...currentLevelData.data, ...sortedData]
        displayData.value = [...displayData.value, ...sortedData]
      } else {
        currentLevelData.data = sortedData
        displayData.value = sortedData
        selectFirstAvailableKey(sortedData)
      }
    }
  } catch (error) {
    console.error('加载键数据失败:', error)
    onlyMessage('加载键数据失败', 'error')
  } finally {
    loading.value = false
  }
}

const handleScroll = () => {
  if (!scrollContainerRef.value || loading.value || !hasMore.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.value

  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadKeyData(true)
  }
}

const handleClick = (item: KeyItem) => {
  if (item.type === 'dir') {
    handleEnterFolder(item)
  } else {
    if (item.name === selectedKey.value) return
    selectedKey.value = item.name
    emit('select', item)
  }
}

const handleEnterFolder = (item: KeyItem) => {
  currentLevel.value++

  if (levelStack.value.length <= currentLevel.value) {
    levelStack.value.push(createLevelData(item.prefix || ''))
  } else {
    const levelData = levelStack.value[currentLevel.value]
    levelData.prefix = item.prefix || ''
    levelData.cursor = '0'
    levelData.data = []
  }

  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''

  loadKeyData()
}

const handleBack = () => {
  if (currentLevel.value === 0) return

  currentLevel.value--
  const currentLevelData = levelStack.value[currentLevel.value]

  displayData.value = currentLevelData.data
  hasMore.value = currentLevelData.cursor !== '0'
  selectedKey.value = ''

  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }

  selectFirstAvailableKey(currentLevelData.data)
}

const handleSearch = (value: string) => {
  searchQuery.value = value.trim()
  resetCurrentLevelState()
  loadKeyData()
}

const refresh = () => {
  currentLevel.value = 0
  levelStack.value = [createLevelData('')]
  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''
  searchQuery.value = ''

  loadKeyData()
}

onMounted(() => {
  checkFolderMode()
  fetchKeyTotal()
  loadKeyData()
})

watch(
  () => props.info,
  () => {
    checkFolderMode()
  },
  { deep: true }
)

defineExpose({
  refresh
})
</script>

<style scoped lang="less">
.sidebar {
  width: 250px;
  flex: 0 0 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-right: 4px;
}

.count-text {
  .total {
    margin: 0 4px;
    color: #1890ff;
  }
}

.back-icon-btn {
  color: #1890ff;
  transition: all 0.2s ease;

  &:hover {
    color: #40a9ff;
    background-color: #e6f7ff;
  }

  &:active {
    color: #096dd9;
  }
}

.list {
  flex: 1;
  overflow: auto;
  position: relative;

  :deep(.ant-list) {
    padding-right: 4px;
  }
}

.item {
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

  &.item-folder {
    .anticon {
      color: #faad14;
      font-size: 14px;
    }
  }

  .anticon {
    font-size: 12px;
  }
}

.item-active {
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
  height: 100%;
  min-height: 200px;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  color: #999;
  font-size: 14px;
}
</style>
