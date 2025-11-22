<template>
  <div class="rdb-datasource-query-container">
    <a-segmented
      v-model:value="activeTab"
      :options="tabOptions"
      block
      class="query-tabs"
    />

    <div class="content">
      <!-- 可视化查询内容 -->
      <div
        class="content-item"
        v-show="activeTab === 'visual'"
      >
        <div class="visual-query-container">
          <TableList
            :showFieldCount="true"
            :initialSelectedTable="initialTableName"
            @click="selectTable"
            @loaded="handleTablesLoaded"
          >
            <template #header>
              <TitleComponent
                data="数据库表"
                :style="{ margin: 0 }"
              />
            </template>
          </TableList>

          <FieldSelector
            :fields="fieldsData"
            v-model:selectedKeys="selectedRowKeys"
            :loading="initLoading"
            @selectChange="onSelectChange"
          />
        </div>
      </div>

      <!-- SQL查询内容 -->
      <div
        class="content-item"
        v-show="activeTab === 'sql'"
      >
        <SqlEditor
          v-model="sqlValue"
          :registrationTips="tips"
          :loading="testQueryLoading"
          @run="testQuery"
          @change="updateConfiguration"
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
          target="rdb-datasource-query"
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

<script setup lang="ts" name="RdbDatasourceQuery">
import { onlyMessage, randomString } from '@jetlinks-web/utils'
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { ColumnSchema, Key, TableSchema } from './type'
import { useSqlKeywords } from '@datasource-manager-ui/hooks/useSqlKeywords'
import TableList from '@datasource-manager-ui/views/DataSource/Detail/table/components/TableList.vue'
import FieldSelector from './components/FieldSelector.vue'
import SqlEditor from './components/SqlEditor.vue'
import QueryResults from './components/QueryResults.vue'

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
const sqlKeywords = useSqlKeywords()
const sqlValue = ref<string>('')
const tips = ref()
const activeTab = ref('visual')
const selectedTable = ref('')
const resultColumns = ref<any[]>([])
const selectedRowKeys = ref<Key[]>([])

const tabOptions = [
  { label: '可视化查询', value: 'visual' },
  { label: 'SQL查询', value: 'sql' }
]

const testQueryLoading = ref(false)
const initLoading = ref(false)

const fieldsData = ref<ColumnSchema[]>([])
const initialTableName = ref('')
const initialColumnNames = ref<string[]>([])
const allTablesData = ref<TableSchema[]>([])
const isInitializing = ref(false)

const selectAllRows = () => {
  selectedRowKeys.value = fieldsData.value.map((field: any) => field.name)
  onSelectChange(selectedRowKeys.value)
}

const handleTablesLoaded = (tables: TableSchema[]) => {
  allTablesData.value = tables

  // 如果有保存的字段配置，在表选中后回显字段
  if (initialColumnNames.value.length > 0 && initialTableName.value) {
    nextTick(() => {
      selectedRowKeys.value = initialColumnNames.value
      onSelectChange(selectedRowKeys.value)
      isInitializing.value = false
    })
  } else {
    isInitializing.value = false
  }
}

const onSelectChange = (keys: Key[]) => {
  selectedRowKeys.value = keys
  resultQueryParams.value = {
    ...resultQueryParams.value,
    table: selectedTable.value,
    columns: selectedRowKeys.value
  }

  const buildColumn = (key: any) => ({
    title: key,
    dataIndex: key,
    key: key,
    width: 100,
    ellipsis: true,
    search: {
      type: 'string'
    }
  })

  if (keys.length > 0) {
    resultColumns.value = keys.map((key: any) => buildColumn(key))
  } else if (activeTab.value === 'visual') {
    resultColumns.value = fieldsData.value.map((field: any) => buildColumn(field.name))
  }

  updateConfiguration()
}

const updateConfiguration = () => {
  const config =
    activeTab.value === 'sql'
      ? { sql: sqlValue.value }
      : {
          table: {
            name: selectedTable.value,
            columns: fieldsData.value.filter((field: any) => selectedRowKeys.value.includes(field.name))
          }
        }
  emit('update:configuration', config)
}

const resultQueryParams = ref<any>({
  pageIndex: 0,
  pageSize: 12
})

// 选择表
const selectTable = (data: { clickItem: TableSchema; sourceData: TableSchema[] }) => {
  const { clickItem, sourceData } = data
  selectedTable.value = clickItem.name
  fieldsData.value = clickItem.columns

  // 如果不是初始化回显，则自动选中所有字段
  if (!isInitializing.value) {
    selectAllRows()
  }

  resultQueryParams.value = {
    ...resultQueryParams.value,
    table: selectedTable.value,
    columns: selectedRowKeys.value
  }

  // 更新 SQL 提示
  tips.value = sqlKeywords.getTableSuggestions(sourceData)
}

const validateSql = () => {
  const sql = sqlValue.value.trim()
  const sqlUpper = sql.toUpperCase()

  // 检查是否只包含一条SQL语句
  const sqlStatements = sql.split(';').filter((stmt) => stmt.trim() !== '')
  if (sqlStatements.length > 1) {
    onlyMessage('当前列表只能输入一条SQL语句', 'error')
    return false
  }

  if (!sqlUpper.startsWith('SELECT')) {
    onlyMessage('SQL语句必须以SELECT开头', 'error')
    return false
  }

  if (!sqlUpper.includes('FROM')) {
    onlyMessage('SQL语句缺少FROM子句', 'error')
    return false
  }

  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE', 'INSERT']
  if (dangerousKeywords.some((keyword) => sqlUpper.includes(keyword))) {
    onlyMessage('SQL语句不允许包含修改数据的操作', 'error')
    return false
  }
  return true
}

// 测试查询
const testQuery = () => {
  if (!validateSql()) return

  testQueryLoading.value = true
  resultQueryParams.value = {
    sql: sqlValue.value,
    pageIndex: 0,
    pageSize: 12
  }

  updateConfiguration()

  handleRequest(resultQueryParams.value).finally(() => {
    testQueryLoading.value = false
  })
}

const handleSearch = (e: any) => {
  resultQueryParams.value.terms = e.terms
}

const handleRequest = (request: any) =>
  new Promise((resolve) => {
    if (request?.table || request?.sql) {
      queryDataSource(typeId, dataSourceId, 'QueryPager', request)
        .then((resp: any) => {
          if (activeTab.value === 'sql') {
            const resultData = resp.result?.data || []
            if (resultData.length > 0) {
              const _columns = Object.keys(resultData[0] || {}).map((key: any) => ({
                title: key,
                dataIndex: key,
                key: key,
                width: 100,
                search: { type: 'string' }
              }))

              if (JSON.stringify(_columns) !== JSON.stringify(resultColumns.value)) {
                resultColumns.value = _columns
              }
            }
          }
          resolve({
            code: resp.status,
            status: resp.status,
            success: resp.success,
            result: {
              data: activeTab.value === 'visual' && selectedRowKeys.value.length === 0 ? [] : resp.result.data,
              pageSize: resp.result.pageSize,
              pageIndex: resp.result.pageIndex,
              total: resp.result.total
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
  if (activeTab.value === 'sql') {
    if (!validateSql()) return false
  }

  if (activeTab.value === 'visual') {
    if (selectedRowKeys.value.length === 0) {
      onlyMessage('至少选择一个字段', 'error')
      return false
    }
  }

  return true
}

// 监听 tab 切换，更新查询参数
watch(activeTab, (newTab, oldTab) => {
  if (newTab === oldTab) return

  const params = resultQueryParams.value
  if (newTab === 'sql') {
    delete params.table
    delete params.columns
    params.sql = sqlValue.value
    resultColumns.value = []
  } else {
    delete params.sql
    params.table = selectedTable.value
    if (selectedRowKeys.value.length === 0 && fieldsData.value.length > 0) {
      selectAllRows()
    }
    params.columns = selectedRowKeys.value
    resultColumns.value = selectedRowKeys.value.map((key: any) => ({
      title: key,
      dataIndex: key,
      key: key,
      width: 100,
      ellipsis: true,
      search: {
        type: 'string'
      }
    }))
  }

  updateConfiguration()
})

onMounted(() => {
  nextTick(async () => {
    try {
      if (props.data.rdbDefinition) {
        const { table, sql } = props.data.rdbDefinition
        if (table) {
          // 保存回显配置
          isInitializing.value = true
          initialTableName.value = table.name
          initialColumnNames.value = table.columns.map((column: any) => column.name)
          selectedTable.value = table.name
        }
        if (sql) {
          // SQL 查询模式
          sqlValue.value = sql
          activeTab.value = 'sql'
          testQuery()
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
.rdb-datasource-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  margin: 8px;

  .query-tabs {
    margin-bottom: 16px;
    width: 350px;
  }

  .content {
    flex: 1;

    .content-item {
      height: 400px;
    }

    .visual-query-container {
      display: flex;
      height: 100%;
    }
  }
}
</style>
