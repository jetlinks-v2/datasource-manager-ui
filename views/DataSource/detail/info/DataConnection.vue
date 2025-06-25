<template>
  <div>
    <div class="title">数据连接</div>
    <a-descriptions
      :column="3"
      v-if="isDatabase"
      bordered
    >
      <template
        v-for="(item, index) in databaseItems"
        :key="index"
      >
        <a-descriptions-item
          :label="item.label"
          v-if="item.condition"
        >
          <j-ellipsis>{{ item.value }}</j-ellipsis>
        </a-descriptions-item>
      </template>
    </a-descriptions>
    <div v-if="isCommon">
      <a-descriptions
        :column="3"
        bordered
      >
        <a-descriptions-item label="API地址">
          <j-ellipsis>{{ commonData?.baseUrl || '--' }}</j-ellipsis>
        </a-descriptions-item>
        <a-descriptions-item label="鉴权方式">
          <j-ellipsis>{{ authTypeText || '--' }}</j-ellipsis>
        </a-descriptions-item>

        <!-- 新——start -->
        <template
          v-for="(auth, index) in authTypes"
          :key="index"
        >
          <template
            v-for="(item, itemIndex) in auth.items"
            :key="itemIndex"
          >
            <a-descriptions-item :label="item.label">
              <j-ellipsis>{{ item.value }}</j-ellipsis>
            </a-descriptions-item>
          </template>
          <a-descriptions-item v-if="authType === 'OAuth2'">
            <template #label>
              <a-space>
                <span style="white-space: nowrap">Client ID</span>
                <a-tooltip>
                  <template #title>应用唯一标识</template>
                  <AIcon
                    type="QuestionCircleFilled"
                    style="color: #777"
                  />
                </a-tooltip>
              </a-space>
            </template>
            <j-ellipsis>
              {{ commonData.authConfig.oauth2.clientId || '--' }}
            </j-ellipsis>
          </a-descriptions-item>
          <a-descriptions-item v-if="authType === 'OAuth2'">
            <template #label>
              <a-space>
                <div style="white-space: nowrap">Client Secret</div>
                <a-tooltip>
                  <template #title>应用唯一标识的密钥</template>
                  <AIcon
                    type="QuestionCircleFilled"
                    style="color: #777"
                  />
                </a-tooltip>
              </a-space>
            </template>
            <j-ellipsis>
              {{ commonData.authConfig.oauth2.clientSecret ? '******' : '--' }}
            </j-ellipsis>
          </a-descriptions-item>
        </template>
      </a-descriptions>
      <!-- 新——end -->

      <div v-if="authType === 'OAuth2'">
        <TitleComponent
          data="请求头"
          style="margin-top: 24px"
        />
        <a-table
          :bordered="true"
          :columns="columns"
          :data-source="requestHeaderData"
          :pagination="false"
          :scroll="{ y: 240 }"
          size="small"
        />
        <TitleComponent
          data="参数"
          style="margin-top: 24px"
        />
        <a-table
          :bordered="true"
          :columns="columns"
          :data-source="argumentData"
          :pagination="false"
          :scroll="{ y: 240 }"
          size="small"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" name="DataConnection" setup>
import { datasourceParseUrl, DATASOURCE_TYPE, typesData } from '../../components/table'

const props = defineProps<{ info: any; sourceClassify: string }>()
const { info, sourceClassify } = toRefs(props)

const databaseData = reactive({
  host: '',
  url: '',
  port: '',
  connectionMode: '',
  schema: '',
  username: '',
  password: '',
  searchCode: '',
  databaseName: '',
  sqlServerDatabaseName: ''
})

const commonData = reactive({
  baseUrl: '',
  headers: [],
  parameters: [],
  authConfig: {
    authType: '',
    basic: {
      username: '',
      password: ''
    },
    bearer: {
      token: ''
    },
    oauth2: {
      clientId: '',
      clientSecret: '',
      grantType: '',
      tokenUrl: '',
      tokenRequestType: '',
      scope: ''
    }
  }
})

const authType = ref('')
const authTypeText = ref('')
const requestHeaderData = ref([{ key: '', value: '' }])
const argumentData = ref([{ key: '', value: '' }])
const columns = [
  { title: 'Key', dataIndex: 'key', width: '50%' },
  { title: 'Value', dataIndex: 'value', width: '50%' }
]

const authTypeDic = {
  basic: '基本认证',
  bearer: 'bearer认证',
  OAuth2: 'OAuth2认证',
  none: '不鉴权'
} as Record<string, string>

const isDatabase = computed(() => sourceClassify.value === 'database')
const isCommon = computed(() => sourceClassify.value === 'common')

const databaseItems = computed(() => [
  {
    label: '连接方式',
    value: databaseData.connectionMode === 'basic' ? '通过基本配置连接' : '连接URL',
    condition: true
  },
  {
    label: databaseData.connectionMode === 'basic' ? '数据库地址' : '连接地址',
    value: databaseData.connectionMode === 'basic' ? databaseData.host : databaseData.url,
    condition: true
  },
  { label: '端口', value: databaseData.port || '--', condition: databaseData.connectionMode === 'basic' },
  {
    label: '服务名',
    value: databaseData.databaseName,
    condition: databaseData.searchCode === DATASOURCE_TYPE.ORACLE && databaseData.connectionMode === 'basic'
  },
  {
    label: '数据库名称',
    value:
      databaseData.searchCode !== DATASOURCE_TYPE.SQLSERVER
        ? databaseData.databaseName
        : databaseData.sqlServerDatabaseName,
    condition:
      databaseData.searchCode !== DATASOURCE_TYPE.ORACLE &&
      databaseData.searchCode !== DATASOURCE_TYPE.DAMENG &&
      databaseData.connectionMode === 'basic'
  },
  { label: 'schema', value: databaseData.schema || '--', condition: true },
  { label: '用户名', value: databaseData.username || '--', condition: true },
  { label: '密码', value: databaseData.password ? '**********' : '--', condition: true }
])
const authTypes = ref<any[]>([])
const handleAuthType = () => {
  const basic = {
    type: 'basic',
    items: [
      { label: '用户名', value: commonData.authConfig.basic.username || '--' },
      { label: '密码', value: commonData.authConfig.basic.password ? '**********' : '--' }
    ]
  }

  const bearer = {
    type: 'bearer',
    items: [{ label: 'Token', value: commonData.authConfig.bearer.token || '--' }]
  }

  const oauth2 = {
    type: 'OAuth2',
    items: [
      { label: '模式', value: commonData.authConfig.oauth2.grantType === 'client_credentials' ? '客户端凭证' : '--' },
      { label: 'Token地址', value: commonData.authConfig.oauth2.tokenUrl || '--' },
      { label: '请求方式', value: commonData.authConfig.oauth2.tokenRequestType === 'POST_URI' ? 'URL参数' : '请求体' },
      { label: 'Scope', value: commonData.authConfig.oauth2.scope ? '******' : '--' }
    ]
  }
  if (authType.value === 'basic') authTypes.value = [basic]
  if (authType.value === 'bearer') authTypes.value = [bearer]
  if (authType.value === 'OAuth2') authTypes.value = [oauth2]
}

watch(
  info,
  () => {
    if (Object.keys(info.value).length > 0) {
      if (isCommon.value) {
        const { authConfig, baseUrl, headers, parameters } = info.value.shareConfig
        Object.assign(commonData.authConfig, authConfig)
        commonData.baseUrl = baseUrl
        commonData.headers = headers
        commonData.parameters = parameters
        authType.value = commonData.authConfig.authType
        authTypeText.value = authTypeDic[commonData.authConfig.authType]
        requestHeaderData.value = commonData.headers
        argumentData.value = commonData.parameters
        handleAuthType()
      } else {
        const { other, url, schema, username, password } = info.value.shareConfig
        const { types = [] } = typesData.find((item: any) => item.value === sourceClassify.value) || {}
        const active = types.find((item: any) => item.value === info.value.searchCode)
        const { host, port, path } = datasourceParseUrl(url, active)
        databaseData.connectionMode = other?.connectionMode
        databaseData.schema = schema
        databaseData.username = username
        databaseData.password = password
        databaseData.searchCode = info.value.searchCode
        databaseData.host = host
        databaseData.url = url
        databaseData.port = databaseData.searchCode === DATASOURCE_TYPE.SQLSERVER ? port.split(';')[0] : port
        databaseData.databaseName = path
        databaseData.sqlServerDatabaseName = path
      }
    }
  },
  { deep: true, immediate: true }
)
</script>

<style lang="less" scoped>
.title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5715;
  font-family: AliRegular !important;
  margin-bottom: 20px;
}
.hover-hidden {
  display: none;
}
.hover-show:hover > .hover-hidden {
  display: block;
}
</style>
