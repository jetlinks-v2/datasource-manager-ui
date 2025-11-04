<template>
  <div class="redis-datasource-query-container">
    <div class="header">
      <div class="segmented-control">
        <a-button
          class="segmented-control__button"
          :class="{ active: activeTab === 'pattern' }"
          @click="handleActiveTabChange('pattern')"
        >
          通用查询
        </a-button>
        <a-button
          class="segmented-control__button"
          :class="{ active: activeTab === 'script' }"
          disabled
        >
          脚本查询
        </a-button>
      </div>

      <div class="search-section">
        <a-input-search
          v-model:value="searchPattern"
          placeholder="请输入通配符模式（例如：user:*）"
          :style="{ width: '100%' }"
          @search="handleSearch"
          @change="handlePatternChange"
        />
      </div>
    </div>

    <div class="content">
      <!-- 通配符查询内容 -->
      <div
        class="content-item"
        v-show="activeTab === 'pattern'"
      >
        <!-- 结果表格 -->
        <div class="table-section">
          <a-table
            :data-source="queryResultList"
            :loading="queryResultLoading"
            :columns="tableColumns"
            :pagination="false"
            :scroll="{ y: 'calc(100vh - 400px)' }"
            bordered
            row-key="key"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'key'">
                {{ record.key }}
              </template>
              <template v-else-if="column.key === 'type'">
                <a-tag :color="getTypeColor(record.type)">
                  {{ record.type?.toUpperCase() }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'value'">
                {{ record.value }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-popover
                  placement="leftTop"
                  trigger="click"
                >
                  <template #content>
                    <div
                      class="preview-content"
                      style="width: 400px; height: 300px"
                    >
                      <StringType
                        v-if="record.type === 'string'"
                        :data="[{ value: record.value }]"
                      />
                      <HashType
                        v-else-if="record.type === 'hash'"
                        :data="[{ value: record.value }]"
                        :scroll="{ y: '250px' }"
                      />
                      <ListType
                        v-else-if="record.type === 'list'"
                        :data="[{ value: record.value }]"
                        :scroll="{ y: '250px' }"
                      />
                      <SetType
                        v-else-if="record.type === 'set'"
                        :data="[{ value: record.value }]"
                        :scroll="{ y: '250px' }"
                      />
                      <ZsetType
                        v-else-if="record.type === 'zset'"
                        :data="[{ value: record.value }]"
                        :scroll="{ y: '250px' }"
                      />
                    </div>
                  </template>
                  <AIcon
                    type="EyeOutlined"
                    class="preview-icon"
                  />
                </a-popover>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RedisDatasourceQuery">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { ColumnType } from 'ant-design-vue/es/table'
import StringType from '../../../redisKey/components/dataTypes/StringType.vue'
import HashType from '../../../redisKey/components/dataTypes/HashType.vue'
import ListType from '../../../redisKey/components/dataTypes/ListType.vue'
import SetType from '../../../redisKey/components/dataTypes/SetType.vue'
import ZsetType from '../../../redisKey/components/dataTypes/ZsetType.vue'

interface QueryResultItem {
  name: string
  type: string
  value: string
}

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  formRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:configuration'])

const route = useRoute()
const activeTab = ref('pattern')
const searchPattern = ref('')

// 查询结果相关数据
const queryResultLoading = ref(false)
const queryResultList = ref<QueryResultItem[]>([])

// 表格列定义
const tableColumns = [
  {
    title: 'Key',
    dataIndex: 'key',
    key: 'key',
    width: '20%',
    ellipsis: true
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: '10%',
    align: 'center'
  },
  {
    title: 'Value',
    dataIndex: 'value',
    key: 'value',
    width: '55%',
    ellipsis: true
  },
  {
    title: '查看',
    key: 'actions',
    width: '5%',
    align: 'center'
  }
] as ColumnType<QueryResultItem>[]

// 类型颜色映射
const typeColorMap: Record<string, string> = {
  string: 'blue',
  hash: 'green',
  list: 'orange',
  set: 'purple',
  zset: 'cyan'
}

const typeId = computed(() => route.query.typeId as string)
const datasourceId = computed(() => route.params.id as string)

const handleActiveTabChange = (tab: string) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  updateConfiguration()
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  return typeColorMap[type?.toLowerCase()] || 'default'
}

// 搜索方法
const handleSearch = () => {
  const pattern = searchPattern.value?.trim()
  loadQueryResults(pattern)
}

// 查询键数据列表
const loadQueryResults = async (pattern: string) => {
  // 重置状态
  queryResultLoading.value = true
  queryResultList.value = []

  try {
    // 使用查询数据源接口
    const res = await queryDataSource(typeId.value, datasourceId.value, 'GeneralQuery', {
      pattern: pattern || '*'
    })

    if (res.status === 200) {
      queryResultList.value = res.result || []
    }
  } catch (error) {
    console.error('查询键数据失败:', error)
    queryResultList.value = []
  } finally {
    queryResultLoading.value = false
  }
}

const updateConfiguration = () => {
  const config = {
    pattern: searchPattern.value,
    provider: activeTab.value,
    description: ''
  }
  emit('update:configuration', config)
}

const validateAll = async () => {
  return true
}

const handlePatternChange = () => {
  searchPattern.value = searchPattern.value
  updateConfiguration()
}

onMounted(() => {
  nextTick(() => {
    try {
      if (props.data.pattern) {
        searchPattern.value = props.data.pattern
      }
      // 初始化时加载数据
      loadQueryResults(searchPattern.value)
      updateConfiguration()
    } catch (error) {
      console.error('初始化数据失败', error)
    }
  })
})

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.redis-datasource-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0 16px;

    .segmented-control {
      display: inline-flex;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f5f5f5;
      width: fit-content;
      white-space: nowrap;

      &__button {
        background-color: transparent;
        color: #595959;
        border: none;
        flex: 1;
        min-width: 80px;
        transition: all 0.3s ease;

        &:not(:first-child) {
          border-left: 1px solid #d9d9d9;
        }

        &.active {
          background-color: #ffffff;
          color: #2f54eb;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .search-section {
      width: 300px;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      justify-content: end;
    }
  }

  .content {
    flex: 1;
    overflow: hidden;

    .content-item {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }

  .table-section {
    flex: 1;
    overflow: hidden;
    padding: 16px;
  }

  .preview-icon {
    color: #1890ff;
    cursor: pointer;
    font-size: 16px;
  }

  .preview-content {
    padding: 8px;
    overflow: hidden;
  }
}
</style>
