<template>
  <div class="query-container">
    <div class="top">
      <a-button
        @click="handleSQL"
        :disabled="!queryData"
        type="primary"
      >
        <AIcon type="PlayCircleOutlined" />
        运行
      </a-button>
    </div>

    <div class="container">
      <div class="expression">
        <div class="edit-code">
          <AIcon type="ConsoleSqlOutlined" />
          SQL表达式
        </div>
        <MonacoEditor
          v-model="queryData"
          style="flex: 1"
          theme="vs-white"
          :registrationTips="tips"
          language="sql"
        ></MonacoEditor>
      </div>
      <div class="result-container">
        <div
          v-if="!errorMessage"
          style="height: 100%"
        >
          <div class="tip-container">
            <div
              class="edit-code"
              v-if="initialize"
            >
              <AIcon type="TableOutlined" />
              运行结果
            </div>
            <div
              class="tip"
              v-if="initialize"
            >
              请点击&nbsp;&nbsp;
              <span>【运行】</span>
              &nbsp;&nbsp;按钮，运行结果将在此处展示
            </div>
            <a-tabs
              v-model:activeKey="activeKey"
              @tabClick="tabClick"
              v-else
              size="small"
              type="card"
            >
              <template
                #leftExtra
                class="edit-code"
              >
                <div style="margin-right: 40px">运行结果</div>
              </template>
              <a-tab-pane
                :key="index + 1"
                :tab="`结果${index + 1}`"
                v-for="(item, index) in executionResult"
              >
                <a-table
                  :columns="columns"
                  :dataSource="item"
                  v-if="item.length"
                  :pagination="false"
                  rowKey="id"
                  size="small"
                  :scroll="{ y: 180 }"
                ></a-table>
                <div v-else-if="typeof item === 'number'">影响行数：{{ item }}行</div>
                <j-empty v-else />
              </a-tab-pane>
            </a-tabs>
          </div>
        </div>

        <div v-else>
          {{ errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { handleSQL_api } from '@datasource-manager-ui/api/data/datasource'
import { useSqlKeywords } from '@datasource-manager-ui/hooks/useSqlKeywords'
import { onlyMessage } from '@jetlinks-web/utils'

const props = defineProps({
  sourceData: Object
})
const route = useRoute()
const sqlKeywords = useSqlKeywords()
const activeKey = ref(1)
const queryData = ref()
const executionResult = ref([])
const errorMessage = ref('')
const initialize = ref(true)
const tips = ref()
//表头
const columns = ref([])

const tabClick = (a) => {
  activeKey.value = a
}

const validateSql = (sqlValue) => {
  if (!sqlValue) {
    onlyMessage('请先输入SQL语句', 'error')
    return false
  }

  // 拆分多条SQL语句
  let sqlArr = sqlValue.trim().split(';')
  // 过滤掉空语句
  sqlArr = sqlArr.filter((sql) => sql.trim() !== '')

  if (sqlArr.length === 0) {
    onlyMessage('请输入有效的SQL语句', 'error')
    return false
  }

  // 逐条验证SQL语句
  for (let i = 0; i < sqlArr.length; i++) {
    const sql = sqlArr[i].trim().toUpperCase()

    if (!sql.startsWith('SELECT')) {
      onlyMessage(`第${i + 1}条SQL语句必须以SELECT开头`, 'error')
      return false
    }

    if (!sql.includes('FROM')) {
      onlyMessage(`第${i + 1}条SQL语句缺少FROM子句`, 'error')
      return false
    }

    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'UPDATE', 'INSERT']
    if (dangerousKeywords.some((keyword) => sql.includes(keyword))) {
      onlyMessage(`第${i + 1}条SQL语句不允许包含修改数据的操作`, 'error')
      return false
    }
  }

  return true
}

const handleSQL = async () => {
  // 验证SQL
  if (!validateSql(queryData.value)) {
    return
  }

  executionResult.value.length = 0
  errorMessage.value = ''
  initialize.value = false

  // 数据拆分
  let sqlArr = queryData.value.trim().split(';')
  // 过滤掉空语句
  sqlArr = sqlArr.filter((sql) => sql.trim() !== '')

  const results = []

  // 顺序执行每条SQL语句，确保结果顺序正确
  for (let i = 0; i < sqlArr.length; i++) {
    const params = {
      sqlRequests: [
        {
          sql: sqlArr[i],
          parameter: {}
        }
      ]
    }

    try {
      const res = await handleSQL_api(route.params.id, params)
      if (res?.success && res.result?.[0]) {
        results.push(res.result[0].data)
      } else {
        results.push([])
      }
    } catch (err) {
      if (err.request.responseText) {
        errorMessage.value = JSON.parse(err.request.responseText).message
        return
      } else {
        results.push([])
      }
    }
  }

  executionResult.value = results

  // 查找第一个有效的数组结果来生成表头
  let firstValidResult = null
  for (let i = 0; i < results.length; i++) {
    if (results[i] && results[i].constructor === Array && results[i].length > 0) {
      firstValidResult = results[i][0]
      break
    }
  }

  if (firstValidResult) {
    columns.value = Object.keys(firstValidResult).map((key) => ({
      title: key,
      dataIndex: key,
      ellipsis: true,
      key: key
    }))
  }

  activeKey.value = 1
}

const handleRegistrationTips = () => {
  tips.value = sqlKeywords.getTableSuggestions(props.sourceData)
}

watch(
  () => activeKey.value,
  () => {
    if (executionResult.value[activeKey.value - 1]) {
      const data = executionResult.value[activeKey.value - 1]
      if (data.constructor === Array) {
        const obj = data[0]
        columns.value = Object.keys(obj).map((key) => ({
          title: key,
          dataIndex: key,
          ellipsis: true,
          key: key
        }))
      }
    }
  }
)

watch(
  () => props.sourceData,
  (oldValue, newValue) => {
    if (oldValue !== newValue) {
      handleRegistrationTips()
    }
  },
  {
    deep: true
  }
)

onMounted(() => {
  if (props.sourceData) {
    handleRegistrationTips()
  }
})
</script>

<style scoped lang="less">
.query-container {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.top {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 10px;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;

  .expression {
    display: flex;
    flex: 1;
    flex-direction: column;
    border: 1px solid #ccc;
    box-sizing: border-box;
    border-radius: 4px;
  }

  .result-container {
    width: 100%;
    height: 272px;
    border: 1px solid #ccc;
    border-top: none;
    .tip-container {
      display: flex;
      flex-direction: column;
      height: 100%;

      .tip {
        display: flex;
        flex: 1;
        justify-content: center;
        align-items: center;
        height: 100%;
        color: #777777;
        span {
          color: #1a1a1a;
        }
      }
    }
  }
}
.edit-code {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ccc;
  background-color: #fafafa;
}
:deep(.ant-tabs-nav) {
  background-color: #fafafa;
  height: 40px;
  box-sizing: border-box;
  padding: 8px 16px;
  .ant-tabs-tab-active {
    background-color: var(--ant-primary-color) !important;
    .ant-tabs-tab-btn {
      color: #fff !important;
    }
  }
  .ant-tabs-tab {
    margin-right: 8px;
    border-radius: 2px !important;
    background-color: #fff;
    padding: 0 8px !important;
  }
}

:deep(.ant-tabs-content-holder) {
  padding: 0 16px 16px !important;
}
</style>
