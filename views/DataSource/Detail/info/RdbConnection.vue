<template>
  <DescriptionItemList
    :title="$t('DataSource.Info.Rdb.100066-0')"
    :column="3"
    :items="visibleItems"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { datasourceParseUrl, DATASOURCE_TYPE, typesData } from '../../components/table'
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'

const { t: $t } = useI18n()

interface DatabaseConfig {
  host: string
  url: string
  port: string
  connectionMode: 'basic' | 'url' | ''
  schema: string
  username: string
  password: string
  searchCode: string
  databaseName: string
  sqlServerDatabaseName: string
}

interface ShareConfig {
  other?: { connectionMode: string }
  url: string
  schema: string
  username: string
  password: string
}

interface InfoProps {
  shareConfig?: ShareConfig
  searchCode?: string
  [key: string]: any
}

const props = defineProps<{
  info: InfoProps
}>()

const { info } = toRefs(props)

const databaseData = reactive<DatabaseConfig>({
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

const isBasicMode = computed(() => databaseData.connectionMode === 'basic')

const isOracle = computed(() => databaseData.searchCode === DATASOURCE_TYPE.ORACLE)
const isSqlServer = computed(() => databaseData.searchCode === DATASOURCE_TYPE.SQLSERVER)
const isDameng = computed(() => databaseData.searchCode === DATASOURCE_TYPE.DAMENG)

const getDatabaseName = computed(() => {
  return !isSqlServer.value ? databaseData.databaseName : databaseData.sqlServerDatabaseName
})

const databaseItems = computed<DescriptionItem[]>(() => [
  {
    key: 'connectionMode',
    label: $t('DataSource.Info.Rdb.100066-1'),
    value: isBasicMode.value ? $t('DataSource.Info.Rdb.100066-2') : $t('DataSource.Info.Rdb.100066-3'),
    condition: true
  },
  {
    key: 'address',
    label: isBasicMode.value ? $t('DataSource.Info.Rdb.100066-4') : $t('DataSource.Info.Rdb.100066-5'),
    value: isBasicMode.value ? databaseData.host : databaseData.url,
    condition: true
  },
  {
    key: 'port',
    label: $t('DataSource.Info.Rdb.100066-6'),
    value: databaseData.port || '--',
    condition: isBasicMode.value
  },
  {
    key: 'serviceName',
    label: $t('DataSource.Info.Rdb.100066-7'),
    value: databaseData.databaseName,
    condition: isOracle.value && isBasicMode.value
  },
  {
    key: 'databaseName',
    label: $t('DataSource.Info.Rdb.100066-8'),
    value: getDatabaseName.value,
    condition: !isOracle.value && !isDameng.value && isBasicMode.value
  },
  {
    key: 'schema',
    label: $t('DataSource.Info.Rdb.100066-9'),
    value: databaseData.schema || '--',
    condition: true
  },
  {
    key: 'username',
    label: $t('DataSource.Info.Rdb.100066-10'),
    value: databaseData.username || '--',
    condition: true
  },
  {
    key: 'password',
    label: $t('DataSource.Info.Rdb.100066-11'),
    component: MaskDisplay,
    componentProps: {
      value: databaseData.password,
      placeholder: '--'
    },
    condition: true
  }
])

const visibleItems = computed(() =>
  databaseItems.value
    .filter((item) => item.condition)
    .map((item) => ({
      ...item,
      value: item.value || '--'
    }))
)

const parseDatabaseConfig = (shareConfig: ShareConfig, searchCode: string) => {
  const { other, url, schema, username, password } = shareConfig
  const { types = [] } = typesData.find((item: any) => item.value === 'database') || {}
  const activeType = types.find((item: any) => item.value === searchCode)
  const { host, port, path } = datasourceParseUrl(url, activeType)

  return {
    host,
    port: searchCode === DATASOURCE_TYPE.SQLSERVER ? port.split(';')[0] : port,
    url,
    schema,
    username,
    password,
    connectionMode: other?.connectionMode || '',
    searchCode,
    databaseName: path,
    sqlServerDatabaseName: path
  }
}

watch(
  () => info.value,
  (newInfo) => {
    if (newInfo?.shareConfig) {
      const config = parseDatabaseConfig(newInfo.shareConfig, newInfo.searchCode || '')
      Object.assign(databaseData, config)
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped></style>
