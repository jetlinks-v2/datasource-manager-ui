<template>
  <div class="stats-container">
    <a-spin :spinning="loading">
      <template v-if="stats">
        <!-- 基本信息 -->
        <div class="stats-section">
          <TitleComponent data="基本信息" />
          <div class="info-grid">
            <div
              v-for="item in infoItems"
              :key="item.key"
              class="info-item"
            >
              <span class="info-label">{{ item.label }}</span>
              <span class="info-value">
                <a-tag
                  v-if="item.tag"
                  :color="item.tagColor"
                >
                  {{ item.value }}
                </a-tag>
                <template v-else>{{ item.value }}</template>
              </span>
            </div>
          </div>
        </div>

        <!-- 索引列表 -->
        <div class="stats-section">
          <TitleComponent data="索引列表" />
          <a-table
            :columns="indexColumns"
            :data-source="stats.indexList"
            :pagination="false"
            size="small"
            :scroll="{ y: 'calc(100vh - 600px)' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'unique'">
                <a-tag :color="record.unique ? 'green' : 'default'">
                  {{ record.unique ? '是' : '否' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'sparse'">
                <a-tag :color="record.sparse ? 'orange' : 'default'">
                  {{ record.sparse ? '是' : '否' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'expire'">
                {{ record.expire ? `${record.expire}s` : '-' }}
              </template>
              <template v-else-if="column.key === 'keys'">
                <IndexKeysPreview :keys="record.keys" />
              </template>
            </template>
          </a-table>
        </div>
      </template>
      <div
        v-else
        class="empty-stats"
      >
        <j-empty description="暂无统计信息" />
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts" name="CollectionStats">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import IndexKeysPreview from './IndexKeysPreview.vue'
import TitleComponent from '@jetlinks-web-core/components/TitleComponent/index.vue'

interface CollectionStats {
  ns: string
  count: number
  size: number
  avgObjSize: number
  storageSize: number
  indexList: IndexInfo[]
}

interface IndexInfo {
  name: string
  keys: Record<string, any>
  unique: boolean
  sparse: boolean
  expire?: number
}

const props = defineProps<{
  currentCollection: string
}>()

const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string

const stats = ref<CollectionStats | null>(null)
const loading = ref(false)

// 基本信息项配置
const infoItems = computed(() => {
  if (!stats.value) return []
  return [
    {
      key: 'ns',
      label: '命名空间',
      value: stats.value.ns
    },
    {
      key: 'count',
      label: '文档数',
      value: formatNumber(stats.value.count),
      tag: true,
      tagColor: 'blue'
    },
    {
      key: 'size',
      label: '数据总大小',
      value: formatBytes(stats.value.size)
    },
    {
      key: 'avgObjSize',
      label: '平均文档大小',
      value: formatBytes(stats.value.avgObjSize)
    },
    {
      key: 'storageSize',
      label: '存储大小',
      value: formatBytes(stats.value.storageSize)
    }
  ]
})

// 索引表格列定义
const indexColumns = [
  {
    title: '索引名',
    dataIndex: 'name',
    key: 'name',
    width: 100
  },
  {
    title: '唯一索引',
    dataIndex: 'unique',
    key: 'unique',
    width: 100,
    align: 'center' as const
  },
  {
    title: '稀疏索引',
    dataIndex: 'sparse',
    key: 'sparse',
    width: 100,
    align: 'center' as const
  },
  {
    title: '过期时间',
    dataIndex: 'expire',
    key: 'expire',
    width: 100,
    align: 'center' as const
  },
  {
    title: '索引字段',
    dataIndex: 'keys',
    key: 'keys',
    width: 80,
    align: 'center' as const
  }
]

// 格式化数字
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

// 格式化字节大小
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 查询集合统计信息
const fetchStats = async () => {
  if (!props.currentCollection) return

  loading.value = true
  try {
    const resp = await queryDataSource(typeId, dataSourceId, 'CollectionStats', {
      collection: props.currentCollection
    })

    if (resp.success && resp.result) {
      stats.value = resp.result
    } else {
      stats.value = null
    }
  } catch (error) {
    console.error('查询集合统计信息失败:', error)
    stats.value = null
  } finally {
    loading.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  fetchStats
})

watch(
  () => props.currentCollection,
  () => {
    stats.value = null
  }
)
</script>

<style scoped lang="less">
.stats-container {
  height: 100%;
  overflow: auto;

  .stats-section {
    margin-bottom: 24px;

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px 24px;
      padding: 16px;
      background-color: #fafafa;
      border-radius: 8px;

      .info-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background-color: #fff;
        border-radius: 6px;
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .info-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(0, 0, 0, 0.65);
        }

        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: rgba(0, 0, 0, 0.85);
          text-align: right;
        }
      }
    }
  }

  .empty-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 450px);
  }
}
</style>
