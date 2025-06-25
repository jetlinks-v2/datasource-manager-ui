<template>
  <a-form
    :model="formData"
    ref="formRef"
    size="small"
    layout="vertical"
  >
    <a-form-item label="连接方式">
      <a-radio-group
        v-model:value="formData.connectionMode"
        @change="handleConnectionModeChange"
      >
        <a-radio-button
          class="button-width basic"
          value="basic"
        >
          通过基本配置连接
        </a-radio-button>
        <a-radio-button
          class="button-width url"
          value="url"
        >
          连接URL
        </a-radio-button>
      </a-radio-group>
    </a-form-item>

    <div v-if="formData?.connectionMode === 'basic'">
      <a-form-item
        name="host"
        :rules="[
          {
            required: true,
            message: '请输入数据库网络地址',
            trigger: 'blur'
          },
          {
            pattern: /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/,
            message: '请输入正确的IP地址',
            trigger: ['blur', 'change']
          }
        ]"
        label="数据库地址"
      >
        <a-input
          v-model:value="formData.host"
          placeholder="请输入数据库网络地址，例：192.168.1.100"
        />
      </a-form-item>
      <a-form-item
        name="port"
        :rules="[{ validator: validatePort, trigger: ['blur', 'change'] }]"
        label="端口"
      >
        <a-input
          v-model:value="formData.port"
          :placeholder="`请输入端口号（0-65536），例：${active.placeholderPort}`"
        />
      </a-form-item>
      <a-form-item
        v-if="active.value === DATASOURCE_TYPE.ORACLE"
        name="serviceName"
        :rules="[{ required: true, message: '请输入服务名' }]"
        label="服务名"
      >
        <a-input
          v-model:value="formData.serviceName"
          placeholder="请输入服务名"
          :maxlength="64"
        />
      </a-form-item>
    </div>
    <div v-else>
      <a-form-item
        name="jdbcUrl"
        :rules="[{ required: true, validator: validateJdbcUrl, trigger: 'blur' }]"
        label="连接地址"
      >
        <a-textarea
          v-model:value="formData.jdbcUrl"
          :autoSize="{ minRows: 6, maxRows: 6 }"
          :defaultValue="formData.jdbcHeaders"
        />
      </a-form-item>
    </div>
    <a-form-item
      name="dataBase"
      :rules="[
        { required: true, message: '请输入数据库名称', trigger: 'blur' },
        {
          validator: spaceValidator,
          trigger: 'blur'
        }
      ]"
      v-if="
        formData.connectionMode === 'basic' &&
        active.value !== DATASOURCE_TYPE.ORACLE &&
        active.value !== DATASOURCE_TYPE.DAMENG
      "
      label="数据库名称"
    >
      <a-input
        v-model:value="formData.dataBase"
        placeholder="请输入数据库名称"
      />
    </a-form-item>
    <a-form-item
      name="schema"
      :rules="[{ required: true, message: '请输入Schema', trigger: 'blur' }]"
      label="Schema"
    >
      <a-input
        v-model:value="formData.schema"
        placeholder="请输入Schema"
        :maxlength="64"
      />
    </a-form-item>
    <a-form-item
      name="username"
      :rules="[{ required: true, message: '请输入用户名', trigger: 'blur' }]"
      label="用户名"
    >
      <a-input
        v-model:value="formData.username"
        placeholder="请输入连接数据库的用户名"
        :maxlength="64"
      />
    </a-form-item>
    <a-form-item label="密码">
      <a-input-password
        v-model:value="formData.password"
        placeholder="请输入连接数据库的密码"
        :maxlength="64"
      />
    </a-form-item>
    <a-button
      :disabled="!canTestConnection"
      @click="emit('testConnection', formData)"
      :loading="connectionLoading"
    >
      测试连接
    </a-button>
  </a-form>
</template>

<script setup lang="ts" name="FormItemRelation">
import { RelationData } from './type'
import { DATASOURCE_TYPE, datasourceParseUrl } from './table'
import { useSourceDetailStore } from '@datasoureceManager/stores/sourceDetail'
import { cloneDeep } from 'lodash-es'
import { ConnectionMode } from '@datasourceManager/views/dataSource/detail/type.d'
import { spaceValidator } from '@datasoureceManager/utils/validate'

const emit = defineEmits(['update:formData', 'testConnection'])
const props = defineProps({
  active: {
    type: Object,
    default: {}
  },
  editData: {
    type: Object,
    default: {}
  }
})
const connectionLoading = ref(false)
const sourceDetailStore = useSourceDetailStore()
const { active } = toRefs(props)
const formRef = ref()
const formData = ref<RelationData>({
  connectionMode: 'basic' as ConnectionMode,
  host: '',
  port: '',
  schema: '',
  username: '',
  dataBase: '',
  password: '',
  serviceName: '',
  jdbcHeaders: active.value.jdbcHeaders,
  jdbcUrl: active.value.jdbcHeaders,
  url: ''
})
const canTestConnection = computed(() => {
  const { schema, username, connectionMode, host, port, serviceName, jdbcUrl, dataBase } = formData.value
  const { value: activeValue } = active.value
  const isOracle = activeValue === DATASOURCE_TYPE.ORACLE
  const isDB = activeValue === DATASOURCE_TYPE.DAMENG
  const isBasicMode = connectionMode === 'basic'
  const jdbcHeaders = active.value.jdbcHeaders

  // 必填字段校验
  if (!schema || !username) return false

  // 基础连接模式校验
  if (isBasicMode) {
    if (!host || !port) return false
    if (!isDB) {
      if (isOracle && !serviceName) return false
      if (!isOracle && !dataBase) return false
    }
  } else {
    // JDBC URL 校验
    if (jdbcUrl === jdbcHeaders) return false
  }

  return true
})

const setLoading = (val: boolean) => {
  connectionLoading.value = val
}
const handleConnectionModeChange = () => {
  if (formData.value?.connectionMode === 'basic') {
    const { host, port, path, protocol } = datasourceParseUrl(formData.value.jdbcUrl, active.value)
    formData.value.host = host
    formData.value.port = port
    formData.value.dataBase = path
    formData.value.serviceName = path
    // formData.value.jdbcHeaders = protocol
  } else {
    const { value: dbType } = active.value
    let newJdbcUrl = formData.value.jdbcHeaders
    const { host, port, serviceName, dataBase } = formData.value
    if (host) {
      newJdbcUrl += `${host}`
      if (port) {
        newJdbcUrl += `:${port}`
        if (dbType !== DATASOURCE_TYPE.DAMENG) {
          if ((dataBase || serviceName) && dbType !== DATASOURCE_TYPE.SQLSERVER) {
            if (dbType === DATASOURCE_TYPE.ORACLE) {
              newJdbcUrl += `/${serviceName}`
            } else {
              newJdbcUrl += `/${dataBase}`
            }
          }
          if (dbType === DATASOURCE_TYPE.SQLSERVER) {
            newJdbcUrl = newJdbcUrl + `;database=${dataBase}`
          }
        }
      }
    }
    formData.value.jdbcUrl = newJdbcUrl
  }
}

const validatePort = (rule: any, value: string) => {
  if (!value) {
    return Promise.reject('请输入端口号')
  }
  if (!/^-?\d+$/.test(value)) {
    return Promise.reject('端口号仅可输入数字（可包含负号）')
  }
  if (Number(value) < 0 || Number(value) > 65536) {
    return Promise.reject('端口号必须在0到65536之间')
  }
  return Promise.resolve()
}

const validate = () => {
  return new Promise((resolve, reject) => {
    formRef.value
      .validate()
      .then(() => {
        emit('update:formData', formData.value)
        resolve(true)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

const validateJdbcUrl = (rule: any, value: string) => {
  const { headersEnum, value: dbType, jdbcHeaders } = active.value

  if (!value) {
    formData.value.jdbcUrl = jdbcHeaders
    return Promise.reject('请输入连接地址')
  }

  // 预编译正则表达式中的特殊字符转义
  const escapeRegExp = (str: string) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  // 构建IP和端口验证部分的正则
  const ipPortPattern = '(\\d{1,3}\\.){3}\\d{1,3}:\\d{1,5}'

  let regex: RegExp

  if (dbType === DATASOURCE_TYPE.ORACLE) {
    // Oracle 特殊处理
    const oraclePattern = '^jdbc:oracle:thin:[^/]+/[^@]+@//'
    const { protocol } = datasourceParseUrl(value, active.value)

    if (new RegExp(oraclePattern).test(protocol)) {
      regex = new RegExp(`^${protocol}${ipPortPattern}`)
    } else {
      const headersPattern = headersEnum.map(escapeRegExp).join('|')
      regex = new RegExp(`^${headersPattern}${ipPortPattern}`)
    }
  } else {
    // 其他数据库类型的验证
    const headersPattern = headersEnum.map(escapeRegExp).join('|')
    regex = new RegExp(`^(${headersPattern})${ipPortPattern}`)
  }

  return regex.test(value) ? Promise.resolve() : Promise.reject(`请输入有效的${dbType}地址`)
}

const handleEditor = () => {
  for (const key in props.editData) {
    formData.value[key] = props.editData[key]
  }
  let urls = formData.value.url
  const { port, path } = datasourceParseUrl(urls, active.value)
  formData.value.port = port
  formData.value.dataBase = path
}

watch(
  formData,
  () => {
    const { connectionMode, host, port, serviceName, jdbcUrl, dataBase } = formData.value
    const { value: activeValue } = active.value
    const jdbcHeaders = active.value.jdbcHeaders
    let newUrl = ''
    if (connectionMode === 'basic') {
      newUrl = `${jdbcHeaders}${host}:${port}` //DM数据库
      if (
        activeValue === DATASOURCE_TYPE.MYSQL ||
        activeValue === DATASOURCE_TYPE.MARIADB ||
        activeValue === DATASOURCE_TYPE.POSTGRESQL
      )
        newUrl += `/${dataBase}`
      if (activeValue === DATASOURCE_TYPE.ORACLE) newUrl += `/${serviceName}`
      if (activeValue === DATASOURCE_TYPE.SQLSERVER) newUrl += `;database=${dataBase};encrypt=false`
      formData.value.url = newUrl
    } else {
      const lastIndexSlash = jdbcUrl.lastIndexOf('/')
      if (lastIndexSlash !== -1) {
        // const lastIndexQuestionMark = jdbcUrl.indexOf('?', lastIndexSlash)
        // newUrl = lastIndexQuestionMark !== -1 ? jdbcUrl.split('?')[0] : jdbcUrl
        // formData.value.url = newUrl
        formData.value.url = jdbcUrl
      }
    }
  },
  { deep: true }
)

onMounted(() => {
  handleEditor()
  if (sourceDetailStore.cachedData?.type === sourceDetailStore.checkType && sourceDetailStore.checkType) {
    formData.value = cloneDeep(sourceDetailStore.relationData)
  }
})

onBeforeUnmount(() => {
  // 缓存数据
  sourceDetailStore.saveRelationData({ ...formData.value })
})

defineExpose({
  validate,
  setLoading
})
</script>

<style scoped lang="less">
.button-width {
  width: 150px;
  text-align: center;
}

:deep(.ant-radio-group-outline .ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0px 0px 6px;
}
:deep(.ant-radio-group-outline .ant-radio-button-wrapper:last-child) {
  border-radius: 0px 6px 6px 0px;
}
</style>
