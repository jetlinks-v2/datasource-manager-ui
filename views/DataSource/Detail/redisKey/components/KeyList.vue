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
import { getToken } from '@jetlinks-web/utils'

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

const props = defineProps<{
  info: any
}>()

const emit = defineEmits(['select'])

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string
const scrollContainerRef = ref<HTMLElement>()
const loading = ref(false)
const total = ref(0)
const displayData = ref<KeyItem[]>([])
const selectedKey = ref('')
const searchQuery = ref('')

// 文件夹模式相关状态
const hasFolder = ref(false)
const currentLevel = ref(0)
const levelStack = ref<LevelData[]>([
  {
    prefix: '',
    cursor: '0',
    data: []
  }
])
const hasMore = ref(true)

// 判断是否为文件夹模式
const checkFolderMode = () => {
  const delimiter = props.info?.shareConfig?.delimiter
  hasFolder.value = delimiter && delimiter !== ''
}

// 获取键总数
const fetchKeyTotal = async () => {
  if (!typeId) return

  try {
    const { shareConfig } = props.info
    const res = await queryDataSource(typeId, dataSourceId, 'ServerInfo', {
      index: shareConfig.databaseIndex
    })
    if (res.status === 200 && res.result?.dbSize?.keys !== undefined) {
      total.value = res.result.dbSize.keys
    }
  } catch (error) {
    console.error('获取键总数失败:', error)
  }
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

      // 更新游标
      currentLevelData.cursor = nextCursor

      // 判断是否还有更多数据
      hasMore.value = nextCursor !== '0'

      if (append) {
        // 追加数据
        currentLevelData.data = [...currentLevelData.data, ...data]
        displayData.value = [...displayData.value, ...data]
      } else {
        // 重置数据
        currentLevelData.data = data
        displayData.value = data
      }

      // 默认选中第一个非文件夹项
      if (!append && data.length > 0 && currentLevel.value === 0) {
        const firstKey = data.find((item: KeyItem) => item.type === 'key')
        if (firstKey) {
          nextTick(() => {
            handleClick(firstKey)
          })
        }
      }
    }
  } catch (error) {
    console.error('加载键数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理滚动事件
const handleScroll = () => {
  if (!scrollContainerRef.value || loading.value || !hasMore.value) return

  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.value

  // 当滚动到距离底部 100px 时触发加载
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadKeyData(true)
  }
}

// 处理点击事件
const handleClick = (item: KeyItem) => {
  if (item.type === 'dir') {
    // 点击文件夹，进入下一层
    handleEnterFolder(item)
  } else {
    // 点击键，选中并触发事件
    if (item.name === selectedKey.value) return
    selectedKey.value = item.name
    emit('select', item)
  }
}

// 进入文件夹
const handleEnterFolder = (item: KeyItem) => {
  currentLevel.value++

  // 检查是否已经存在该层级的数据
  if (levelStack.value.length <= currentLevel.value) {
    levelStack.value.push({
      prefix: item.prefix || '',
      cursor: '0',
      data: []
    })
  } else {
    // 更新现有层级的 prefix
    levelStack.value[currentLevel.value].prefix = item.prefix || ''
    levelStack.value[currentLevel.value].cursor = '0'
    levelStack.value[currentLevel.value].data = []
  }

  // 重置状态
  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''

  // 加载新层级的数据
  loadKeyData()
}

// 返回上层
const handleBack = () => {
  if (currentLevel.value === 0) return

  currentLevel.value--
  const currentLevelData = levelStack.value[currentLevel.value]

  // 恢复上层数据
  displayData.value = currentLevelData.data
  hasMore.value = currentLevelData.cursor !== '0'
  selectedKey.value = ''

  // 滚动到顶部
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
  }
}

// 处理搜索
const handleSearch = (value: string) => {
  searchQuery.value = value.trim()

  // 重置当前层级的数据
  const currentLevelData = levelStack.value[currentLevel.value]
  currentLevelData.cursor = '0'
  currentLevelData.data = []

  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''

  // 重新加载数据
  loadKeyData()
}

// 刷新列表
const refresh = () => {
  // 重置到第一层
  currentLevel.value = 0
  levelStack.value = [
    {
      prefix: '',
      cursor: '0',
      data: []
    }
  ]
  hasMore.value = true
  displayData.value = []
  selectedKey.value = ''
  searchQuery.value = ''

  // 重新加载
  fetchKeyTotal()
  loadKeyData()
}

// 初始化
onMounted(() => {
  checkFolderMode()
  fetchKeyTotal()
  loadKeyData()
})

// 监听 info 变化
watch(
  () => props.info,
  () => {
    checkFolderMode()
    fetchKeyTotal()
  },
  { deep: true }
)

// 暴露方法给父组件
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
