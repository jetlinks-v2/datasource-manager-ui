<template>
  <div class="rdb-datasource-query-container">
    <div class="segmented-control">
      <a-button
        class="segmented-control__button"
        :class="{ active: activeTab === 'visual' }"
        @click="handleActiveTabChange('visual')"
      >
        可视化查询
      </a-button>
      <a-button
        class="segmented-control__button"
        :class="{ active: activeTab === 'sql' }"
        @click="handleActiveTabChange('sql')"
      >
        SQL查询
      </a-button>
    </div>

    <div class="content">
      <!-- 可视化查询内容 -->
      <div
        class="content-item"
        v-show="activeTab === 'visual'"
      >
        <div class="visual-query-container">
          <TableSelector
            :tables="tables"
            :selectedTable="selectedTable"
            :loading="initLoading"
            @select="selectTable"
            @refresh="refreshTable"
          />

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
          style="padding: 24px 0 16px 0"
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
import { getDataSourceTables, queryByPage } from '@datasoureceManager/api/data/datasource'
import { ColumnSchema, Key, TableSchema } from './type'
import { useSqlKeywords } from '@datasoureceManager/hooks/useSqlKeywords'
import TableSelector from './components/TableSelector.vue'
import FieldSelector from './components/FieldSelector.vue'
import SqlEditor from './components/SqlEditor.vue'
import QueryResults from './components/QueryResults.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  dataSourceId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:configuration'])
const sqlKeywords = useSqlKeywords()
const sqlValue = ref<string>('')
const tips = ref()
const activeTab = ref('visual')
const selectedTable = ref('')
const resultColumns = ref<any[]>([])
const selectedRowKeys = ref<Key[]>([])

const refreshLoading = ref(false)
const testQueryLoading = ref(false)
const initLoading = ref(false)

// 数据库表
const tables = ref<TableSchema[]>([])
// 当前表的字段
const fieldsData = ref<ColumnSchema[]>([])

//刷新表
const refreshTable = async () => {
  refreshLoading.value = true
  await getDataSourceTablesData()
    .then(() => {
      onlyMessage('刷新成功', 'success')
    })
    .catch(() => {
      onlyMessage('刷新失败', 'error')
    })
    .finally(() => {
      refreshLoading.value = false
    })
}

// 获取数据库表数据
const getDataSourceTablesData = async () => {
  initLoading.value = true
  try {
    const res = await getDataSourceTables(props.dataSourceId)
    if (res.status === 200) {
      tables.value = res.result || []
      selectedTable.value = tables.value[0]?.name || ''
      fieldsData.value = tables.value[0]?.columns || []
      selectAllRows()
      handleRegistrationTips()
    }
  } catch (error) {
    console.error('获取数据库表数据失败', error)
  } finally {
    initLoading.value = false
  }
}

const selectAllRows = () => {
  selectedRowKeys.value = fieldsData.value.map((field: any) => field.name)
  onSelectChange(selectedRowKeys.value)
}

const onSelectChange = (keys: Key[]) => {
  selectedRowKeys.value = keys
  resultQueryParams.value = {
    ...resultQueryParams.value,
    table: selectedTable.value,
    columns: selectedRowKeys.value
  }
  resultColumns.value = keys.map((key: any) => ({
    title: key,
    dataIndex: key,
    key: key,
    width: 100,
    ellipsis: true,
    search: {
      type: 'string'
    }
  }))

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
const selectTable = (table: TableSchema) => {
  selectedTable.value = table.name
  fieldsData.value = table.columns
  selectAllRows()
  resultQueryParams.value = {
    ...resultQueryParams.value,
    table: selectedTable.value,
    columns: selectedRowKeys.value
  }
}

const handleRegistrationTips = () => {
  tips.value = sqlKeywords.getTableSuggestions(tables.value)
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
      queryByPage(props.dataSourceId, request)
        .then((resp: any) => {
          if (activeTab.value === 'sql') {
            const _columns = Object.keys(resp.result.data[0] || {}).map((key: any) => ({
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

const handleActiveTabChange = (tab: string) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
  const params = resultQueryParams.value

  if (activeTab.value === 'sql') {
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
}

onMounted(() => {
  nextTick(async () => {
    try {
      if (props.data.rdbDefinition) {
        const { table, sql } = props.data.rdbDefinition
        if (table) {
          selectedTable.value = table.name
          selectedRowKeys.value = table.columns.map((column: any) => column.name)

          const res = await getDataSourceTables(props.dataSourceId)
          if (res.status === 200) {
            tables.value = res.result || []
            const _table = tables.value.find((item: any) => item.name === selectedTable.value) as TableSchema
            selectedTable.value = _table?.name || ''
            fieldsData.value = _table?.columns || []

            onSelectChange(selectedRowKeys.value)
          }
        }
        if (sql) {
          await getDataSourceTablesData()
          sqlValue.value = sql
          handleActiveTabChange('sql')
          testQuery()
        }
      } else {
        await getDataSourceTablesData()
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

  .segmented-control {
    display: inline-flex;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
    background-color: #f5f5f5;
    margin-bottom: 16px;
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
    }
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
