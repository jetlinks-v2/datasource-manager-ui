<template>
  <a-modal
    :title="isEditor ? '编辑' : '新增数据源连接'"
    :open="true"
    :width="700"
    @cancel="cancelModal"
    :maskClosable="false"
    centered
    :bodyStyle="{ maxHeight: '75vh', overflow: 'auto', padding: '8px' }"
  >
    <!-- 基础信息表单组件 -->
    <BaseFormInfo
      ref="baseFormRef"
      v-model="baseFormData"
      :datasourceName="datasourceName"
      :isEditor="isEditor"
      :permission="permission"
      :categoryList="categoryList"
      @refreshCategoryList="handleRefreshCategoryList"
    />

    <a-divider style="height: 1px; background-color: #dedede" />

    <FormItemApi
      v-if="formType === DATA_TYPE_ITEM.API_SEND"
      ref="FormItemApiRef"
      v-model:formData="formData.universalData"
      :editData="formData.universalData"
    />

    <FormItemRdb
      v-else-if="formType === DATA_TYPE_ITEM.RDB_DATASOURCE"
      ref="FormItemRdbRef"
      v-model:formData="formData.relationData"
      :active="activeType"
      :editData="formData.relationData"
      @test-connection="handleTestConnection"
    />

    <FormItemWebSocket
      v-else-if="formType === DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE"
      ref="formItemWebSocketRef"
      v-model="formData.websocketData"
      :editData="formData.websocketData"
    />

    <FormItemEs
      v-else-if="formType === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE"
      ref="formItemEsRef"
      v-model="formData.elasticsearchData"
      :editData="formData.elasticsearchData"
      @test-connection="handleTestESConnection"
    />

    <template #footer>
      <div
        :class="isEditor ? 'editor-footer' : 'add-footer'"
        style="display: flex; margin: 0 8px"
      >
        <a-button
          v-if="!isEditor"
          @click="handleClick"
        >
          上一步
        </a-button>
        <a-space>
          <a-button @click="cancelModal">取消</a-button>
          <a-button
            type="primary"
            @click="handleSubmit"
          >
            确定
          </a-button>
        </a-space>
      </div>
    </template>
  </a-modal>
</template>

<script lang="ts" name="SourceDetailsAdd" setup>
import BaseFormInfo from './BaseFormInfo.vue'
import FormItemApi from './FormItemApi.vue'
import FormItemRdb from './FormItemRdb.vue'
import FormItemWebSocket from './FormItemWebSocket.vue'
import FormItemEs from './FormItemEs.vue'

import { onlyMessage, randomString } from '@jetlinks-web/utils'
import {
  addDataSource,
  disableDataSource,
  enableDataSource,
  updateDataSource
} from '@datasource-manager-ui/api/data/datasource'
import { RelationData, WebSocketData, BaseFormData, UniversalData, ElasticsearchData } from '../type'
import { DATASOURCE_NAME, getTypesDataDetail, datasourceParseUrl, DATASOURCE_TYPE, DATA_TYPE_ITEM } from '../table'
import { cloneDeep } from 'lodash-es'
import { useSourceDetailStore } from '../../sourceDetail'
import { useTestConnection } from '../../composables/useTestConnection'

import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { getDataSourceGroup } from '@datasource-manager-ui/api/data'

const emit = defineEmits(['close', 'openType', 'update', 'refreshCategoryList'])
const props = defineProps({
  active: {
    type: Object,
    default: {
      value: DATASOURCE_TYPE.API
    }
  },
  editData: {
    type: Object,
    default: {}
  },
  permission: {
    type: String,
    default: ''
  }
})
// 详情数据
const { active, editData } = toRefs(props)
const activeType = ref<any>(active.value)
const baseFormRef = ref<any>()
const FormItemApiRef = ref<any>()
const FormItemRdbRef = ref<any>()
const formItemWebSocketRef = ref<any>()
const formItemEsRef = ref<any>()

const sourceDetailStore = useSourceDetailStore()
const { testConnection } = useTestConnection()

// 基础表单数据
const baseFormData = ref<BaseFormData>({
  name: '',
  id: '',
  group: undefined,
  description: ''
})

const formData = ref<any>({
  relationData: {} as RelationData,
  universalData: {} as UniversalData,
  websocketData: {} as WebSocketData,
  elasticsearchData: {
    uri: '',
    pathPrefix: '',
    username: '',
    password: ''
  } as ElasticsearchData
})

const formType = ref<any>(DATA_TYPE_ITEM.API_SEND)
const datasourceName = ref('')
const isEditor = ref(false)
const requestFlag = ref(false)

const categoryList = ref<any>([])
const activeGroup = computed(() => {
  const item = inject('CLICK_ITEM') as any
  return item.value.id === DEFAULT_CATEGORY_ID ? undefined : item.value.id
}) as Ref<string>

// 处理分类列表刷新
const handleRefreshCategoryList = async () => {
  await getCategoryList()
  emit('refreshCategoryList')
}

const getDataSourceName = (value: string) => {
  for (let key in DATASOURCE_NAME) {
    if (key === value) {
      datasourceName.value = DATASOURCE_NAME[key]
    }
  }
}

// 关闭弹窗
const cancelModal = () => {
  // 新增清除缓存数据
  sourceDetailStore.clearCache()
  emit('close')
}

//获取分类
const getCategoryList = async () => {
  let res = await getDataSourceGroup({
    sorts: [
      {
        name: 'ordinal',
        order: 'desc'
      }
    ],
    paging: false
  })
  if (res.status === 200) {
    categoryList.value = res.result
  }
}

// RDB 数据源测试连接
const handleTestConnection = async (_relationData: any) => {
  const setLoading = (loading: boolean) => FormItemRdbRef.value?.setLoading(loading)

  setLoading(true)
  const { name } = baseFormData.value
  const { type } = activeType.value

  await testConnection(DATA_TYPE_ITEM.RDB_DATASOURCE, name, _relationData, { type })

  setLoading(false)
}

// Elasticsearch 数据源测试连接
const handleTestESConnection = async (_esData: any) => {
  const setLoading = (loading: boolean) => formItemEsRef.value?.setLoading(loading)

  setLoading(true)
  const { name } = baseFormData.value
  const { type } = activeType.value

  await testConnection(DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE, name, _esData, { type })

  setLoading(false)
}

const handleClick = () => {
  sourceDetailStore.saveCache({
    ...baseFormData.value,
    ...formData.value,
    type: datasourceName.value
  })
  emit('openType', {
    ...activeType.value,
    group: baseFormData.value.group
  })
}

// 获取表单引用
const getFormItemRefByType = (type: string) => {
  const refMap: Record<string, any> = {
    [DATA_TYPE_ITEM.API_SEND]: FormItemApiRef,
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: FormItemRdbRef,
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: formItemWebSocketRef,
    [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: formItemEsRef
  }
  return refMap[type]?.value || null
}

// 数据处理函数映射
const getDataHandlerByType = (type: string) => {
  const handlerMap: Record<string, Function> = {
    [DATA_TYPE_ITEM.API_SEND]: universalDataAdd,
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: relationDataAdd,
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: websocketDataAdd,
    [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: elasticsearchDataAdd
  }
  return handlerMap[type]
}

const handleSubmit = async () => {
  if (requestFlag.value) return
  requestFlag.value = true

  const validateAndSubmit = async () => {
    const formItemRef = getFormItemRefByType(formType.value)
    const dataHandler = getDataHandlerByType(formType.value)

    // 禁用数据源（如果存在ID）
    const shouldToggleDataSource = !!baseFormData.value.id
    if (shouldToggleDataSource) {
      await disableDataSource(baseFormData.value.id)
    }

    try {
      await formItemRef?.validate()
      if (dataHandler) {
        await dataHandler()
      }
    } finally {
      // 恢复数据源状态
      if (shouldToggleDataSource) {
        await enableDataSource(baseFormData.value.id)
      }
    }
  }

  try {
    await baseFormRef.value.validate()
    await validateAndSubmit()
  } catch (err) {
    onlyMessage('请检查输入项', 'error')
    nextTick(() => {
      requestFlag.value = false
    })
  }
}

// 通用提交逻辑
const submitDataSource = async (params: any) => {
  const action = isEditor.value ? updateDataSource : addDataSource

  try {
    const res = await action(params)
    if (res?.success) {
      emit('close')
      emit('update')
      onlyMessage(isEditor.value ? '修改成功' : '新增成功')
    }
  } finally {
    nextTick(() => {
      requestFlag.value = false
    })
  }
}

// 抽取构建认证配置的逻辑
const buildAuthConfig = (authType: string, data: any) => {
  const { username, password, token: token1, OAuth2 } = data

  const configBuilders: Record<string, () => any> = {
    basic: () => ({
      authType: 'basic',
      basic: { username, password }
    }),
    bearer: () => ({
      authType: 'bearer',
      bearer: { token: token1 }
    }),
    OAuth2: () => ({
      authType: 'OAuth2',
      oauth2: {
        grantType: 'client_credentials',
        clientId: OAuth2.clientId,
        clientSecret: OAuth2.clientSecret,
        tokenUrl: OAuth2.token,
        tokenRequestType: OAuth2.request,
        scope: OAuth2.scope || '*'
      }
    }),
    none: () => ({ authType: 'none' })
  }

  return configBuilders[authType]?.() || { authType: 'none' }
}

const universalDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
  const { universalData } = formData.value
  const { api, authType, protocol, OAuth2 } = universalData

  const params: any = {
    name,
    typeId: DATA_TYPE_ITEM.API_SEND,
    id: id || `data_source_${randomString(4)}`,
    group,
    shareConfig: {
      baseUrl: protocol + api,
      authConfig: buildAuthConfig(authType, universalData),
      others: {}
    },
    shareCluster: true,
    description,
    searchCode: activeType.value.value
  }

  // OAuth2特殊处理
  if (authType === 'OAuth2' && OAuth2) {
    params.shareConfig.headers = [...OAuth2.headers]
    params.shareConfig.parameters = [...OAuth2.params]
  }

  await submitDataSource(params)
}

const relationDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
  const { relationData } = formData.value
  const { connectionMode, username, password, url, schema, dataBase } = relationData
  const { value: activeValue } = activeType.value

  const type = connectionMode === 'common' ? activeType.value.type : url.substring(0, url.indexOf(':'))

  const params: any = {
    name,
    typeId: DATA_TYPE_ITEM.RDB_DATASOURCE,
    id: id || `data_source_${randomString(4)}`,
    group,
    shareConfig: {
      type,
      username,
      password,
      schema,
      url,
      other: { connectionMode }
    },
    shareCluster: true,
    description,
    searchCode: activeValue
  }

  // SQL Server特殊处理
  if (activeValue === DATASOURCE_TYPE.SQLSERVER) {
    params.dataBase = dataBase
  }

  await submitDataSource(params)
}

const websocketDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
  const { websocketData } = formData.value
  const { value: activeValue } = activeType.value

  const params = {
    id: id || `data_source_${randomString(4)}`,
    name,
    typeId: DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE,
    group,
    shareConfig: { ...websocketData },
    shareCluster: true,
    description,
    searchCode: activeValue
  }

  await submitDataSource(params)
}

const elasticsearchDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
  const { elasticsearchData } = formData.value
  const { value: activeValue } = activeType.value

  const params = {
    id: id || `data_source_${randomString(4)}`,
    name,
    typeId: DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE,
    group,
    shareConfig: { ...elasticsearchData },
    shareCluster: true,
    description,
    searchCode: activeValue
  }

  await submitDataSource(params)
}

// 解析不同数据源类型的配置
const parseDataSourceConfig = (searchCode: string, shareConfig: any) => {
  const parsers: Record<string, () => any> = {
    [DATA_TYPE_ITEM.RDB_DATASOURCE]: () => {
      const { other, username, password, url, schema } = shareConfig
      const { protocol, host, port, path } = datasourceParseUrl(url, activeType.value)
      const isBasic = other.connectionMode === 'basic'

      return {
        relationData: {
          connectionMode: other.connectionMode,
          username,
          password,
          jdbcHeaders: protocol,
          schema,
          host: isBasic ? host : '',
          port: isBasic ? port : '',
          jdbcUrl: isBasic ? protocol : url,
          serviceName: isBasic && searchCode === DATASOURCE_TYPE.ORACLE ? path : '',
          url
        }
      }
    },
    [DATA_TYPE_ITEM.API_SEND]: () => {
      const { authConfig, baseUrl: api, headers, parameters } = shareConfig
      const { protocol } = datasourceParseUrl(api, activeType.value)

      const parseAuthData = () => {
        const baseData = { authType: authConfig.authType, api, protocol }

        switch (authConfig.authType) {
          case 'basic':
            return { ...baseData, ...authConfig.basic }
          case 'bearer':
            return { ...baseData, token: authConfig.bearer.token }
          case 'OAuth2':
            return {
              ...baseData,
              OAuth2: {
                mode: authConfig.oauth2.grantType,
                clientId: authConfig.oauth2.clientId,
                clientSecret: authConfig.oauth2.clientSecret,
                token: authConfig.oauth2.tokenUrl,
                request: authConfig.oauth2.tokenRequestType,
                scope: authConfig.oauth2.scope === '*' ? '' : authConfig.oauth2.scope,
                headers,
                params: parameters
              }
            }
          default:
            return baseData
        }
      }

      return { universalData: parseAuthData() }
    },
    [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: () => ({
      websocketData: {
        handshakeTimeout: shareConfig.handshakeTimeout,
        reconnectionAttempts: shareConfig.reconnectionAttempts,
        maxMessageSize: shareConfig.maxMessageSize,
        reconnectionIntervals: shareConfig.reconnectionIntervals,
        payloadType: shareConfig.payloadType
      }
    }),
    [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: () => ({
      elasticsearchData: {
        uri: shareConfig.uri || '',
        pathPrefix: shareConfig.pathPrefix || '',
        username: shareConfig.username || '',
        password: shareConfig.password || ''
      }
    })
  }

  return parsers[formType.value]?.() || {}
}

onMounted(() => {
  getCategoryList()

  if (editData.value?.id) {
    // 编辑模式初始化
    isEditor.value = true
    const { name, id, group, description, shareConfig, searchCode } = cloneDeep(editData.value)

    activeType.value = getTypesDataDetail(searchCode)
    datasourceName.value = DATASOURCE_NAME[searchCode]
    formType.value = activeType.value.formType

    // 设置基础数据
    Object.assign(baseFormData.value, {
      name,
      id,
      description,
      group: group === DEFAULT_CATEGORY_ID ? undefined : group
    })

    // 设置扩展数据
    const configData = parseDataSourceConfig(searchCode, shareConfig)
    Object.assign(formData.value, configData)
  } else {
    // 新增模式初始化
    getDataSourceName(activeType.value.value)
    formType.value = activeType.value.formType

    // 从缓存恢复数据
    const cache = sourceDetailStore.cachedData
    if (cache?.type === sourceDetailStore.checkType && sourceDetailStore.checkType) {
      const { name, id, description, group, ...otherData } = cloneDeep(cache)
      Object.assign(baseFormData.value, { name, id, description, group })
      Object.assign(formData.value, otherData)
    } else {
      baseFormData.value.group = activeGroup.value
    }
  }
})
</script>

<style lang="less" scoped>
.editor-footer {
  justify-content: flex-end;
}

.add-footer {
  justify-content: space-between;
}
</style>
