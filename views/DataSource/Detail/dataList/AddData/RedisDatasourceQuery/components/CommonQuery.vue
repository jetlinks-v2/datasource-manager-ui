<template>
  <div class="common-query">
    <div class="search-section">
      <TitleComponent
        data="键列表"
        class="section-title"
      />
      <a-input-search
        v-model:value="searchPattern"
        placeholder="请输入通配符模式（例如：user:*）"
        :style="{ width: '400px' }"
        @search="handleSearch"
      />
    </div>

    <!-- 结果表格 -->
    <div class="table-section">
      <a-table
        :data-source="queryResultList"
        :loading="queryResultLoading"
        :columns="tableColumns"
        :pagination="false"
        :scroll="{ y: 'calc(100vh - 430px)' }"
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
                  <component
                    :is="getDataTypeComponent(record.type)"
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
</template>

<script setup lang="ts" name="CommonQuery">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { ColumnType } from 'ant-design-vue/es/table'
import {
  StringType,
  HashType,
  ListType,
  SetType,
  ZsetType
} from '@datasource-manager-ui/views/DataSource/Detail/redisKey/components/dataTypes'
import { convertParamsToObject } from '../../components/utils'
import { cloneDeep } from 'lodash-es'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:expression'])
const route = useRoute()
const typeId = route.query.typeId as string
const datasourceId = route.params.id as string

const searchPattern = ref('')
const queryResultLoading = ref(false)
const queryResultList = ref([])

// 数据类型组件映射
const dataTypeComponentMap: Record<string, any> = {
  string: StringType,
  hash: HashType,
  list: ListType,
  set: SetType,
  zset: ZsetType
}

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
] as ColumnType[]

// 类型颜色映射
const typeColorMap: Record<string, string> = {
  string: 'blue',
  hash: 'green',
  list: 'orange',
  set: 'purple',
  zset: 'cyan'
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  return typeColorMap[type?.toLowerCase()] || 'default'
}

// 获取数据类型组件
const getDataTypeComponent = (type: string) => {
  return dataTypeComponentMap[type?.toLowerCase()] || StringType
}

// 搜索方法
const handleSearch = () => {
  const pattern = searchPattern.value?.trim()
  loadQueryResults(pattern)
}

// 查询键数据列表
const loadQueryResults = async (pattern: string) => {
  queryResultLoading.value = true
  queryResultList.value = []

  try {
    const res = await queryDataSource(typeId, datasourceId, 'GeneralQuery', {
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

const validateAll = async () => {
  emit(
    'update:expression',
    {
      pattern: searchPattern.value || '*',
      provider: 'pattern'
    },
    cloneDeep(queryResultList.value[0]),
    convertParamsToObject([{ name: 'pattern', value: searchPattern.value || '*' }])
  )
  return true
}

watch(
  () => props.data,
  (newData) => {
    if (newData?.pattern) {
      searchPattern.value = newData.pattern
      loadQueryResults(newData.pattern)
    }
  },
  { immediate: true }
)

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.common-query {
  height: 100%;
  display: flex;
  flex-direction: column;

  .search-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    margin-top: 14px;
    .section-title {
      margin: 0;
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
