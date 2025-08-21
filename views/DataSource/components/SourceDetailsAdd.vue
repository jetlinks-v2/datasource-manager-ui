<template>
  <a-modal
    :title="isEditor ? '编辑' : '新增数据源连接'"
    :open="true"
    :width="700"
    @cancel="cancelModal"
    :maskClosable="false"
    centered
    :bodyStyle="{ maxHeight: '80vh', overflow: 'auto' }"
  >
    <a-form
      ref="formRef"
      :model="formData"
      layout="vertical"
      labelAlign="left"
      size="small"
    >
      <a-form-item label="类型">
        <a-input
          :value="datasourceName"
          disabled
        />
      </a-form-item>
      <a-form-item
        label="数据源名称"
        :rules="[
          { required: true, message: '请输入数据源名称!', trigger: 'blur' },
          { max: 64, message: '最多可输入64个字符', trigger: 'change' },
          {
            validator: spaceValidator,
            trigger: 'blur'
          }
        ]"
        :validateFirst="true"
        name="name"
      >
        <a-input
          v-model:value="formData.name"
          placeholder="请输入数据源名称"
        />
      </a-form-item>
      <a-form-item
        :rules="[
          { max: 64, message: '最多可输入64个字符', trigger: 'change' },
          {
            pattern: /^[a-z][a-zA-Z0-9_]*$/,
            message: '只能以小写字母开头且由数字、字母、下划线组成',
            trigger: 'change'
          },
          {
            validator: labelKeyValidator,
            trigger: 'blur'
          }
        ]"
        name="id"
        label="数据源标识"
      >
        <a-input
          v-model:value="formData.id"
          placeholder="不填则自动生成"
          :disabled="isEditor"
        />
      </a-form-item>
      <a-form-item
        label="分类"
        name="group"
        :rules="[{ required: true, message: '请选择分类' }]"
      >
        <div class="select-with-button">
          <a-select
            v-model:value="formData.group"
            placeholder="请选择分类"
            allow-clear
          >
            <a-select-option
              v-for="item in categoryList"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </a-select-option>
          </a-select>
          <j-permission-button
            type="dashed"
            :hasPermission="`${permission}:add` || true"
            @click="addCategory"
          >
            <template #icon>
              <AIcon
                type="PlusOutlined"
                style="color: var(--ant-primary-color)"
              />
            </template>
          </j-permission-button>
        </div>
      </a-form-item>
      <a-form-item
        :rules="[{ max: 200, message: '最多可输入200个字符' }]"
        :validateFirst="true"
        name="description"
        label="说明"
      >
        <a-textarea
          v-model:value="formData.description"
          placeholder="请输入说明"
          :rows="3"
        />
      </a-form-item>
      <a-divider style="height: 1px; background-color: #dedede" />
    </a-form>
    <FormItemUniversal
      v-if="sourceClassify === 'common'"
      ref="formItemUniversalRef"
      v-model:formData="formData.universalData"
      :editData="formData.universalData"
    />

    <FormItemRelation
      v-else
      ref="formItemRelationRef"
      v-model:formData="formData.relationData"
      :active="activeType"
      :editData="formData.relationData"
      @test-connection="handleTestConnection"
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

  <a-modal
    title="新增分类"
    :open="showAddCategory"
    @cancel="handleCancelAddCategory"
    @ok="handleAddCategory"
    :width="400"
  >
    <a-form
      ref="categoryFormRef"
      :model="categoryFormState"
      layout="vertical"
      labelAlign="left"
      size="small"
    >
      <a-form-item
        label="分类名称"
        name="name"
        :rules="[
          { required: true, message: '请输入分类名称' },
          { max: 64, message: '最多可输入64个字符', trigger: 'change' },
          {
            validator: nameValidator,
            trigger: 'blur'
          }
        ]"
      >
        <a-input
          v-model:value="categoryFormState.name"
          placeholder="请输入分类名称"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" name="SourceDetailsAdd" setup>
import FormItemUniversal from './FormItemUniversal.vue'
import FormItemRelation from './FormItemRelation.vue'
import { Rule } from 'ant-design-vue/es/form'
import { onlyMessage, randomString } from '@jetlinks-web/utils'
import {
  addDataSource,
  getDataSourceRepeat,
  testDataSource,
  disableDataSource,
  enableDataSource,
  updateDataSource,
  addAPIDataSource_api,
  editAPIDataSource_api
} from '@datasoureceManager/api/data/datasource'
import { RelationData } from './type'
import { DATASOURCE_NAME, getSourceClassify, getTypesDataDetail, datasourceParseUrl, DATASOURCE_TYPE } from './table'
import { cloneDeep } from 'lodash-es'
import { useSourceDetailStore } from '@datasoureceManager/stores/sourceDetail'
import { spaceValidator } from '@datasoureceManager/utils/utils'
import { DEFAULT_CATEGORY_ID } from '@datasoureceManager/utils/const'
import { addDataSourceGroup, getDataSourceGroup } from '@datasoureceManager/api/data'

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
const sourceDetailStore = useSourceDetailStore()
const { active, editData } = toRefs(props)
const activeType = ref<any>(active.value)
const formRef = ref<any>()
const categoryFormRef = ref<any>()
const formItemUniversalRef = ref<any>()
const formItemRelationRef = ref<any>()

const formData = ref<any>({
  name: '',
  id: '',
  group: undefined,
  description: '',
  relationData: {} as RelationData,
  universalData: {}
})

const categoryFormState = ref<any>({
  name: ''
})

const sourceClassify = ref('common')
const datasourceName = ref('')
const isEditor = ref(false)
const authConfigObj = ref<Record<string, any>>({})
const requestFlag = ref(false)
const showAddCategory = ref(false)

const categoryList = ref<any>([])
const activeGroup = computed(() => {
  const item = inject('CLICK_ITEM') as any
  return item.value.id === DEFAULT_CATEGORY_ID ? undefined : item.value.id
}) as Ref<string>

const addCategory = () => {
  showAddCategory.value = true
}

const handleCancelAddCategory = () => {
  showAddCategory.value = false
  categoryFormRef.value.resetFields()
}

const handleAddCategory = async () => {
  try {
    const res = await addDataSourceGroup({ name: categoryFormState.value.name })
    if (res.status === 200) {
      onlyMessage('新增成功')
    }
  } catch (error) {
    onlyMessage('新增失败', 'error')
    console.error('Operation failed:', error)
  } finally {
    await getCategoryList()
    formData.value.group = categoryList.value.find((item: any) => item.name === categoryFormState.value.name)?.id
    showAddCategory.value = false
    categoryFormRef.value.resetFields()
    emit('refreshCategoryList')
  }
}

const nameValidator = async (_: Rule, value: string) => {
  if (value) {
    const res = categoryList.value.find((item: any) => item.name === value)
    if (res) {
      return Promise.reject('分类名称重复')
    }
    return Promise.resolve()
  }
}

const getDataSourceName = (value: string) => {
  for (let key in DATASOURCE_NAME) {
    if (key === value) {
      datasourceName.value = DATASOURCE_NAME[key]
    }
  }
}

const labelKeyValidator = async (_: Rule, value: string) => {
  if (value)
    if (!isEditor.value) {
      const resp = await getDataSourceRepeat(value)
      if (resp.status === 200) {
        if (resp.result) return Promise.reject('标识重复')
        else return Promise.resolve()
      }
    }
}

const handleTestConnection = async (_relationData: any) => {
  formItemRelationRef.value.setLoading(true)
  const { name, relationData } = formData.value
  const { url, username, password, schema } = _relationData
  const { type } = activeType.value
  const res = await testDataSource({
    typeId: 'rdb',
    name,
    // 数据源配置，详情参考新增数据源的shareConfig
    shareConfig: {
      type,
      url,
      username,
      password,
      schema,
      others: {}
    },
    shareCluster: true
  }).catch((err: any) => {
    formItemRelationRef.value.setLoading(false)
  })
  if (res?.result.ok === true) {
    onlyMessage('连接数据源成功!')
    formItemRelationRef.value.setLoading(false)
  } else {
    const errorMessage = getLastCauseMessage(res?.result?.reason) ?? '请求超时'
    onlyMessage(`连接数据源失败,${errorMessage}`, 'error')
    formItemRelationRef.value.setLoading(false)
  }
}

const getLastCauseMessage = (error: any) => {
  if (error.cause) {
    return getLastCauseMessage(error.cause)
  }
  return error.message ?? error.localizedMessage
}

const handleClick = () => {
  // 缓存当前数据
  sourceDetailStore.saveCache({ ...formData.value, type: datasourceName.value })
  emit('openType', activeType.value)
}

const handleSubmit = async () => {
  if (requestFlag.value) return
  requestFlag.value = true
  const formItemRef = sourceClassify.value === 'common' ? formItemUniversalRef.value : formItemRelationRef.value

  formRef.value
    .validate()
    .then(async () => {
      if (formData.value.id) {
        await disableDataSource(formData.value.id)
      }
      formItemRef
        .validate()
        .then(async () => {
          sourceClassify.value === 'common' ? await universalDataAdd() : await relationDataAdd()
        })
        .catch((err: any) => {
          onlyMessage('请检查输入项', 'error')
          nextTick(() => {
            requestFlag.value = false
          })
        })
        .finally(async () => {
          if (formData.value.id) {
            await enableDataSource(formData.value.id)
          }
        })
    })
    .catch((err: any) => {
      onlyMessage('请检查输入项', 'error')
      nextTick(() => {
        requestFlag.value = false
      })
    })
}

const universalDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description, universalData } = formData.value
  const { api, authType, password, protocol, username, OAuth2, token: token1 } = universalData as any

  const { clientId, clientSecret, headers, mode, params, request, scope, token: token2 } = OAuth2
  const { value: activeValue } = activeType.value
  const url = protocol + api
  const tokenUrl = token2
  const idParam = id ? { id } : { id: `data_source_${randomString(4)}` }
  authConfigObj.value = {
    basic: {
      // 基本鉴权
      authType: 'basic',
      basic: {
        username: username,
        password: password
      }
    },
    bearer: {
      // bearer鉴权
      authType: 'bearer',
      bearer: {
        token: token1
      }
    },
    OAuth2: {
      // OAuth2
      authType: 'OAuth2',
      oauth2: {
        // oauth2模式：暂时只有这种客户端模式
        grantType: 'client_credentials',
        // 客户端ID
        clientId: clientId,
        // 客户端密钥
        clientSecret: clientSecret,
        // 获取token的接口地址
        tokenUrl,
        // tokenUrl请求方式 POST_URI（url传参）,POST_BODY（body传参）
        tokenRequestType: request,
        // 权限范围
        scope: scope || '*'
      }
    },
    none: {
      authType: 'none'
    }
  }
  const _params = {
    name,
    typeId: DATASOURCE_TYPE.API,
    ...idParam,
    group,
    // API数据源配置
    shareConfig: {
      // API根路径一般为ip：端口或者域名
      baseUrl: url,
      // 鉴权配置
      authConfig: authConfigObj.value[authType],
      others: {}
    },
    shareCluster: true,
    description: description,
    searchCode: activeValue
  } as any
  if (authType === 'OAuth2') {
    // API数据源配置
    _params.shareConfig.headers = [...headers]
    _params.shareConfig.parameters = [...params]
  }
  const action = isEditor.value ? editAPIDataSource_api : addAPIDataSource_api
  const res = await action(_params).finally(() => {
    nextTick(() => {
      requestFlag.value = false
    })
  })
  if (res?.success) {
    emit('close')
    emit('update')
    onlyMessage(isEditor.value ? '修改成功' : '新增成功')
  }
}

const relationDataAdd = async () => {
  const { name, id, group = DEFAULT_CATEGORY_ID, description, relationData } = formData.value
  const { connectionMode, username, password, url, schema, dataBase } = relationData

  const { value: activeValue } = activeType.value
  const type = connectionMode === 'common' ? activeType.value.type : url.substring(0, url.indexOf(':'))
  const idParam = id ? { id } : { id: `data_source_${randomString(4)}` }

  const data = {
    name,
    typeId: 'rdb',
    ...idParam,
    group,
    shareConfig: {
      type,
      username,
      password,
      schema,
      url,
      other: {
        connectionMode
      }
    },
    shareCluster: true,
    description,
    searchCode: activeValue
  } as any
  if (data.searchCode === DATASOURCE_TYPE.SQLSERVER) {
    data.dataBase = dataBase
  }
  const action = isEditor.value ? updateDataSource : addDataSource
  const res = await action(data).finally(() => {
    nextTick(() => {
      requestFlag.value = false
    })
  })

  if (res?.success) {
    emit('close')
    emit('update')
    onlyMessage(isEditor.value ? '修改成功' : '新增成功')
  }
}
// 关闭弹窗
const cancelModal = () => {
  // 新增清除缓存数据
  sourceDetailStore.saveCache({})
  sourceDetailStore.saveType('')
  sourceDetailStore.saveGenericData({})
  sourceDetailStore.saveRelationData({})
  sourceDetailStore.saveHeaderData({})
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

onMounted(() => {
  getCategoryList()
  if (!!editData.value?.id) {
    isEditor.value = true
    const { name, id, group, description, shareConfig, searchCode } = cloneDeep(editData.value)
    activeType.value = getTypesDataDetail(searchCode)
    datasourceName.value = DATASOURCE_NAME[searchCode]
    sourceClassify.value = getSourceClassify(searchCode)

    let relationData = {},
      universalData = {}
    if (sourceClassify.value !== 'common') {
      const { other, username, password, url, schema } = shareConfig
      const { protocol, host, port, path } = datasourceParseUrl(url, activeType.value)
      const { connectionMode } = other
      const isBasic = connectionMode === 'basic'

      relationData = {
        connectionMode,
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
    } else {
      const { authConfig, baseUrl: api, headers, parameters } = shareConfig
      const { authType } = authConfig
      const { protocol } = datasourceParseUrl(api, activeType.value)

      switch (authType) {
        case 'basic':
          const { username, password } = authConfig.basic
          universalData = {
            authType,
            api,
            protocol,
            username,
            password
          }
          break
        case 'bearer':
          universalData = {
            authType,
            api,
            protocol,
            token: authConfig.bearer.token
          }
          break
        case 'OAuth2':
          const { grantType, clientId, clientSecret, tokenUrl, tokenRequestType, scope } = authConfig.oauth2
          universalData = {
            authType,
            api,
            protocol,
            OAuth2: {
              mode: grantType,
              clientId,
              clientSecret,
              token: tokenUrl,
              request: tokenRequestType,
              scope: scope === '*' ? '' : scope,
              headers,
              params: parameters
            }
          }
          break
        case 'none':
          universalData = {
            authType,
            api,
            protocol
          }
          break
      }
    }
    Object.assign(formData.value, {
      name,
      id,
      description,
      relationData,
      universalData
    })
    formData.value.group = group === DEFAULT_CATEGORY_ID ? undefined : group
  } else {
    getDataSourceName(activeType.value.value)
    sourceClassify.value = getSourceClassify(activeType.value.value)
    if (sourceDetailStore.cachedData?.type === sourceDetailStore.checkType && sourceDetailStore.checkType) {
      formData.value = cloneDeep(sourceDetailStore.cachedData)
    }
    formData.value.group = activeGroup.value
  }
})
</script>

<style lang="less" scoped>
.select-with-button {
  display: flex;
  gap: 4px;

  .ant-select {
    flex: 1;
  }

  .ant-btn {
    flex-shrink: 0;
  }
}

.editor-footer {
  justify-content: flex-end;
}

.add-footer {
  justify-content: space-between;
}

.ant-modal-footer {
  padding: 16px !important;
}
</style>
