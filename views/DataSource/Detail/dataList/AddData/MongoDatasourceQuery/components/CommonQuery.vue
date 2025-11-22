<template>
  <div class="mongo-common-query-container">
    <div class="content">
      <!-- 可视化查询内容 -->
      <div class="content-item">
        <div class="visual-query-container">
          <CollectionList
            :initialSelectedCollection="initialCollectionName"
            @click="selectCollection"
            @loaded="handleCollectionsLoaded"
          >
            <template #header>
              <TitleComponent
                data="集合列表"
                :style="{ margin: 0 }"
              />
            </template>
          </CollectionList>

          <div class="filter-container">
            <div class="filter-container-header">
              <TitleComponent
                data="条件过滤"
                :style="{ margin: '0' }"
              />
            </div>

            <a-form
              v-if="filterFields.length > 0"
              layout="vertical"
            >
              <DataInputsItem
                v-model="filterFormData"
                :item="termsItem"
                :expands="{ formComponent: { fields: filterFields } }"
                :isDark="false"
              />
            </a-form>
            <a-empty
              v-else
              description="请选择集合"
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
            />
          </div>
        </div>
      </div>

      <!-- 查询结果预览 -->
      <QueryResults
        :columns="resultColumns"
        :params="resultQueryParams"
        :request="handleRequest"
        :query-key="queryKey"
        @query="handleQuery"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="MongoCommonQuery">
import { Empty } from 'ant-design-vue'
import { onlyMessage } from '@jetlinks-web/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { moduleRegistry } from '@/utils/module-registry'
import { convertObjectId } from '@datasource-manager-ui/views/DataSource/Detail/utils'
import CollectionList from '@datasource-manager-ui/views/DataSource/Detail/collection/components/CollectionList.vue'
import QueryResults from './QueryResults.vue'
import TitleComponent from '@/components/TitleComponent/index.vue'

const { DataInputsItem } = moduleRegistry.getResource('visualization-designer-ui', 'components')

interface FieldSchema {
  name: string
  type: string
  comment?: string
}

interface CollectionSchema {
  name: string
  fields: FieldSchema[]
}

interface Props {
  data?: {
    collection?: {
      name: string
      fields: FieldSchema[]
    }
    [key: string]: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits(['update:expression'])
const route = useRoute()
const typeId = route.query.typeId as string
const datasourceId = route.params.id as string

const selectedCollection = ref('')
const resultColumns = ref<any[]>([])
const filterFields = ref<any[]>([])
const filterFormData = ref<any>({ terms: [] })
const initLoading = ref(false)
const initialCollectionName = ref('')
const allCollectionsData = ref<CollectionSchema[]>([])
const isInitializing = ref(false)
const queryKey = ref(0)

const resultQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})

// 定义 terms 字段项
const termsItem = {
  id: 'terms',
  name: '过滤条件',
  valueType: {
    type: 'object'
  },
  expands: {}
}

const handleCollectionsLoaded = (collections: CollectionSchema[]) => {
  allCollectionsData.value = collections
  isInitializing.value = false
}

const handleQuery = () => {
  // 点击查询按钮时触发查询
  queryKey.value = Date.now()

  nextTick(() => {
    const modalBody = document.querySelector('.ant-modal-body')
    if (modalBody) {
      modalBody.scrollTop = modalBody.scrollHeight
    }
  })
}

// 选择集合
const selectCollection = async (data: { clickItem: CollectionSchema; sourceData: CollectionSchema[] }) => {
  const { clickItem } = data
  selectedCollection.value = clickItem.name

  // 加载集合数据以获取字段信息
  initLoading.value = true
  try {
    const resp = await queryDataSource(typeId, datasourceId, 'QueryPager', {
      collection: clickItem.name,
      pageIndex: 0,
      pageSize: 12,
      paging: true
    })

    if (resp.success && resp.result && resp.result.data && resp.result.data.length > 0) {
      // 从第一条数据中提取字段
      const firstRecord = resp.result.data[0]
      const fields = Object.keys(firstRecord).map((key) => {
        const value = firstRecord[key]
        let valueType = 'string'

        // 判断字段类型
        if (typeof value === 'number') {
          valueType = Number.isInteger(value) ? 'int' : 'long'
        } else if (typeof value === 'boolean') {
          valueType = 'boolean'
        } else if (value && typeof value === 'object' && value.timestamp) {
          // MongoDB 的日期对象
          valueType = 'date'
        }

        return {
          id: key,
          name: key,
          valueType: {
            type: valueType
          }
        }
      })

      filterFields.value = fields

      // 构建表格列
      resultColumns.value = fields.map((field) => ({
        title: field.name,
        dataIndex: field.name,
        key: field.name,
        width: 150,
        ellipsis: true
      }))
    } else {
      filterFields.value = []
      resultColumns.value = []
    }
  } catch (error) {
    console.error('加载集合数据失败:', error)
    filterFields.value = []
    resultColumns.value = []
  } finally {
    initLoading.value = false
  }

  // 重置过滤条件
  filterFormData.value = { terms: [] }

  resultQueryParams.value = {
    collection: selectedCollection.value,
    pageIndex: 0,
    pageSize: 12
  }

  // 选择集合后自动查询一次（空条件）
  queryKey.value = Date.now()
}

const processData = (data: any[]) => {
  return data.map((item) => {
    const processedItem: any = { ...item }

    // 转换 _id 字段
    if (item._id) {
      processedItem._id = convertObjectId(item._id)
    }

    return processedItem
  })
}

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (request?.collection) {
      const params = {
        collection: request.collection,
        terms: filterFormData.value.terms?.filter((t: any) => t.column && t.termType) || [],
        pageIndex: request.pageIndex || 0,
        pageSize: request.pageSize || 12,
        paging: true
      }

      queryDataSource(typeId, datasourceId, 'QueryPager', params)
        .then((resp: any) => {
          const rawData = resp.result?.data || []
          const processedData = processData(rawData)

          resolve({
            code: resp.status,
            status: resp.status,
            success: resp.success,
            result: {
              data: processedData,
              pageSize: resp.result?.pageSize || request.pageSize,
              pageIndex: resp.result?.pageIndex || request.pageIndex,
              total: resp.result?.total || 0
            }
          })
        })
        .catch(() => {
          resolve({ code: 'error', status: 500, success: false })
        })
    } else {
      resolve({
        code: 200,
        status: 200,
        success: true,
        result: {
          data: [],
          pageSize: 0,
          pageIndex: 0,
          total: 0
        }
      })
    }
  })

const validateAll = async () => {
  if (!selectedCollection.value) {
    onlyMessage('请选择集合', 'error')
    return false
  }

  emit(
    'update:expression',
    {
      collection: selectedCollection.value,
      others: {
        terms: filterFormData.value.terms?.filter((t: any) => t.column && t.termType) || []
      },
      provider: 'generalQuery'
    },
    {},
    {}
  )
  return true
}

onMounted(() => {
  nextTick(async () => {
    try {
      if (props.data?.collection) {
        const collectionName =
          typeof props.data.collection === 'string' ? props.data.collection : props.data.collection.name

        if (collectionName) {
          isInitializing.value = true
          initialCollectionName.value = collectionName
          selectedCollection.value = collectionName
        }

        if (props.data.others?.terms) {
          filterFormData.value.terms = props.data.others.terms
        } else if (props.data.terms) {
          filterFormData.value.terms = props.data.terms
        }
      }
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
.mongo-common-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 400px;

  .content {
    flex: 1;

    .content-item {
      height: 400px;
      margin-bottom: 12px;
    }

    .visual-query-container {
      display: flex;
      height: 100%;
    }

    .filter-container {
      flex: 1;
      padding-left: 12px;
      border-left: 1px solid #e8e8e8;
      overflow-y: auto;

      &-header {
        display: flex;
        align-items: center;
        height: 32px;
        line-height: 32px;
        margin-bottom: 6px;
      }
    }
  }
}
</style>
