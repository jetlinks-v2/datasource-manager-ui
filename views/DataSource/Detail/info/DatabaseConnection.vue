<template>
  <div>
    <TitleComponent
      data="数据连接"
      :style="{ fontSize: '16px' }"
    />
    <a-descriptions
      :column="3"
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
          <template v-if="item.label === '密码'">
            <a-space>
              <j-ellipsis>
                <span :class="{ 'password-mask': !showPassword && databaseData.password }">
                  {{ showPassword ? item.value : '********' }}
                </span>
              </j-ellipsis>
              <a-button
                type="text"
                size="small"
                @click="showPassword = !showPassword"
              >
                <template #icon>
                  <AIcon
                    :type="showPassword ? 'EyeOutlined' : 'EyeInvisibleOutlined'"
                    v-if="databaseData.password"
                  />
                </template>
              </a-button>
            </a-space>
          </template>
          <j-ellipsis v-else>{{ item.value }}</j-ellipsis>
        </a-descriptions-item>
      </template>
    </a-descriptions>
  </div>
</template>

<script lang="ts" name="DatabaseConnection" setup>
import { datasourceParseUrl, DATASOURCE_TYPE, typesData } from '../../components/table'

const props = defineProps<{ info: any }>()
const { info } = toRefs(props)

const showPassword = ref(false)

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
  {
    label: '端口',
    value: databaseData.port || '--',
    condition: databaseData.connectionMode === 'basic'
  },
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
  { label: '密码', value: databaseData.password || '--', condition: true }
])

watch(
  info,
  () => {
    if (Object.keys(info.value).length > 0 && info.value.shareConfig) {
      const { other, url, schema, username, password } = info.value.shareConfig
      const { types = [] } = typesData.find((item: any) => item.value === 'database') || {}
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
  },
  { deep: true, immediate: true }
)
</script>

<style lang="less" scoped>
.password-mask {
  -webkit-text-security: disc;
  font-family: 'PingFang SC';
}
</style>
