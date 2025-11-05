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

    <component
      :is="registry[formType]?.component"
      v-if="registry[formType]"
      :ref="registry[formType].ref"
      v-model="formData[registry[formType].formKey]"
      :active="activeType"
    />

    <template #footer>
      <div
        :class="isEditor ? (showTestConnection ? 'add-footer' : 'editor-footer') : 'add-footer'"
        style="display: flex; margin: 0 8px"
      >
        <a-space>
          <a-button
            v-if="!isEditor"
            @click="handleClick"
          >
            上一步
          </a-button>
          <j-permission-button
            v-if="showTestConnection"
            :disabled="!canTestConnection"
            :hasPermission="`${permission}:state`"
            @click="handleTestConnection()"
            :loading="testLoading"
            type="primary"
            ghost
          >
            连接测试
          </j-permission-button>
        </a-space>

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
import { BaseFormInfo, FormItemApi, FormItemRdb, FormItemWebSocket, FormItemEs, FormItemRedis } from './FormItem'
import { RelationData, WebSocketData, BaseFormData, UniversalData, ElasticsearchData, RedisData } from '../type'
import { DATASOURCE_NAME, getTypesDataDetail, DATASOURCE_TYPE, DATA_TYPE_ITEM } from '../table'
import { useSourceDetailStore } from '../../sourceDetail'
import { useTestConnection } from '../../composables/useTestConnection'
import { useDataSource, type EmitFn } from '../../composables/useDataSource'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { getDataSourceGroup } from '@datasource-manager-ui/api/data'
import { onlyMessage } from '@jetlinks-web/utils'
import { cloneDeep } from 'lodash-es'

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
const emit = defineEmits(['close', 'openType', 'update', 'refreshCategoryList']) as EmitFn

const activeType = ref<any>(active.value)
const baseFormRef = ref<any>()
const FormItemApiRef = ref<any>()
const FormItemRdbRef = ref<any>()
const formItemWebSocketRef = ref<any>()
const formItemEsRef = ref<any>()
const formItemRedisRef = ref<any>()

const sourceDetailStore = useSourceDetailStore()
const { loading: testLoading, testConnection } = useTestConnection()

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
  websocketData: cloneDeep(activeType.value.defaultConfig) as WebSocketData,
  elasticsearchData: {
    uri: '',
    pathPrefix: '',
    username: '',
    password: ''
  } as ElasticsearchData,
  redisData: {
    host: '',
    port: undefined,
    userName: '',
    password: '',
    databaseIndex: undefined,
    delimiter: ':'
  } as unknown as RedisData
})

const registry = {
  [DATA_TYPE_ITEM.API_SEND]: {
    component: FormItemApi,
    ref: FormItemApiRef,
    formKey: 'universalData'
  },
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: {
    component: FormItemRdb,
    ref: FormItemRdbRef,
    formKey: 'relationData'
  },
  [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: {
    component: FormItemWebSocket,
    ref: formItemWebSocketRef,
    formKey: 'websocketData'
  },
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: {
    component: FormItemEs,
    ref: formItemEsRef,
    formKey: 'elasticsearchData'
  },
  [DATA_TYPE_ITEM.REDIS_DATASOURCE]: {
    component: FormItemRedis,
    ref: formItemRedisRef,
    formKey: 'redisData'
  }
} as Record<string, { component: any; ref: any; formKey: string }>

const formType = ref<string>(DATA_TYPE_ITEM.API_SEND)
const datasourceName = ref('')
const isEditor = ref(false)
const requestFlag = ref(false)
const showTestConnection = computed(() => {
  return (
    formType.value === DATA_TYPE_ITEM.RDB_DATASOURCE ||
    formType.value === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE ||
    formType.value === DATA_TYPE_ITEM.REDIS_DATASOURCE
  )
})

const categoryList = ref<any>([])
const activeGroup = computed(() => {
  const item = inject('CLICK_ITEM') as any
  return item.value.id === DEFAULT_CATEGORY_ID ? undefined : item.value.id
}) as Ref<string>

const canTestConnection = computed(() => {
  if (!showTestConnection.value) return false
  const formItemRef = registry[formType.value]?.ref?.value
  return formItemRef?.canTestConnection
})

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

// 通用测试连接
const handleTestConnection = async () => {
  const entry = registry[formType.value]
  const formItemRef = entry?.ref?.value

  //表单验证
  await formItemRef?.validate?.()
  const { name } = baseFormData.value
  await testConnection(formType.value, name, {
    ...formData.value[entry?.formKey],
    type: activeType.value.type
  })
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

// 下沉提交/解析逻辑到 composable
const { getDataHandlerByType, parseDataSourceConfig, withDisableDuringEdit } = useDataSource({
  baseFormData,
  formData,
  activeType,
  formType,
  isEditor,
  requestFlag,
  emit
})

const handleSubmit = async () => {
  if (requestFlag.value) return
  requestFlag.value = true

  const validateAndSubmit = async () => {
    const entry = registry[formType.value]
    const formItemRef = entry?.ref?.value
    const dataHandler = getDataHandlerByType(formType.value)

    await withDisableDuringEdit(async () => {
      await formItemRef?.validate?.()
      if (dataHandler) {
        await dataHandler()
      }
    })
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
