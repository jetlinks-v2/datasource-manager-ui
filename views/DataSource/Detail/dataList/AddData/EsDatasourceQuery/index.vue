<template>
  <div class="es-datasource-query-container">
    <div class="content">
      <!-- 可视化查询内容 -->
      <div class="visual-query-container">
        <IndexList
          :selectedIndex="selectedIndex"
          @select="selectIndex"
        >
          <template #header>
            <TitleComponent
              :data="$t('DataSource.EsDatasourceQuery.100061-0')"
              :style="{ margin: 0 }"
            />
          </template>
        </IndexList>

        <EsFieldSelector
          :fields="fieldsData"
          :loading="fieldLoading"
        />
      </div>

      <!-- 条件过滤组件 -->
      <div
        v-if="resultColumns.length > 0"
        :key="randomString(6)"
      >
        <ProSearch
          :columns="resultColumns"
          type="simple"
          target="es-datasource-query"
          @search="handleSearch"
          style="padding: 24px 0 8px 0"
        />
      </div>

      <!-- 查询结果预览 -->
      <QueryResults
        :columns="resultColumns"
        :params="resultQueryParams"
        :request="handleRequest"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="EsDatasourceQuery">
import { message } from 'ant-design-vue'
import { randomString } from '@jetlinks-web/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { EsField } from './type'
import IndexList from '@datasource-manager-ui/views/DataSource/Detail/esIndex/components/IndexList.vue'
import EsFieldSelector from './components/EsFieldSelector.vue'
import QueryResults from '../RdbDatasourceQuery/components/QueryResults.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:configuration'])
const route = useRoute()
const typeId = route.query.typeId as string
const dataSourceId = route.params.id as string
const { t: $t } = useI18n()
const selectedIndex = ref('')
const fieldLoading = ref(false)
const resultColumns = ref<any[]>([])
const selectedFields = ref<string[]>([])
const fieldsData = ref<EsField[]>([])

// 获取索引字段数据
const getIndexFieldsData = async (index: string) => {
  fieldLoading.value = true
  try {
    const res = await queryDataSource(typeId, dataSourceId, 'QueryMetadata', { index })
    if (res.status === 200 && res.result && res.result.length > 0) {
      fieldsData.value = res.result[0].properties || []
      selectedFields.value = fieldsData.value.map((field: EsField) => field.id) // 默认全选所有字段
      updateResultColumns()
      updateConfiguration()
    }
  } catch (error) {
    console.error('获取索引字段失败', error)
    fieldsData.value = []
    selectedFields.value = []
  } finally {
    fieldLoading.value = false
  }
}

const updateResultColumns = () => {
  resultColumns.value = fieldsData.value.map((field: EsField) => ({
    title: field.name || field.id,
    dataIndex: field.id,
    key: field.id,
    width: 100,
    ellipsis: true,
    search: {
      type: 'string'
    }
  }))
}

const updateConfiguration = () => {
  const config = {
    index: [selectedIndex.value]
  }
  emit('update:configuration', config)
}

const resultQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12,
  terms: []
})

// 选择索引
const selectIndex = async (indexData: any) => {
  selectedIndex.value = indexData.index
  await getIndexFieldsData(indexData.index)

  resultQueryParams.value = {
    index: selectedIndex.value,
    pageIndex: 0,
    pageSize: 12,
    terms: []
  }
}

const handleSearch = (e: any) => {
  resultQueryParams.value.terms = e.terms || []
}

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (request?.index) {
      const params = {
        index: request.index,
        pageIndex: request.pageIndex,
        pageSize: request.pageSize,
        terms: request.terms || []
      }

      queryDataSource(typeId, dataSourceId, 'QueryPager', params)
        .then((resp: any) => {
          resolve({
            code: resp.status,
            status: resp.status,
            success: resp.success,
            result: {
              data: resp.result.data || [],
              pageSize: resp.result.pageSize || 0,
              pageIndex: resp.result.pageIndex || 0,
              total: resp.result.total || 0
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
  if (!selectedIndex.value) {
    message.error($t('DataSource.EsDatasourceQuery.100061-1'))
    return false
  }

  if (selectedFields.value.length === 0) {
    message.error($t('DataSource.EsDatasourceQuery.100061-2'))
    return false
  }

  return true
}

onMounted(() => {
  nextTick(async () => {
    try {
      if (props.data?.elasticsearchConfig) {
        await selectIndex({
          index: props.data.elasticsearchConfig.index[0]
        })
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
.es-datasource-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  margin: 8px;

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .visual-query-container {
    display: flex;
    gap: 0;
    height: 350px;
    margin-bottom: 16px;
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>
