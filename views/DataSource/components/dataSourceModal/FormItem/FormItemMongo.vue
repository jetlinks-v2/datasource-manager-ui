<template>
  <a-form
    :model="formData"
    ref="formRef"
    layout="vertical"
  >
    <a-form-item :label="$t('DataSource.FormItemMongo.100074-0')">
      <a-radio-group
        v-model:value="formData.connectionMode"
        @change="handleConnectionModeChange"
      >
        <a-radio-button
          class="button-width basic"
          value="basic"
        >
          {{ $t('DataSource.FormItemMongo.100074-1') }}
        </a-radio-button>
        <a-radio-button
          class="button-width url"
          value="url"
        >
          {{ $t('DataSource.FormItemMongo.100074-2') }}
        </a-radio-button>
      </a-radio-group>
    </a-form-item>

    <!-- 连接URL模式 -->
    <div v-if="formData.connectionMode === 'url'">
      <a-form-item
        name="uri"
        :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
        :label="$t('DataSource.FormItemMongo.100074-3')"
      >
        <a-textarea
          v-model:value="formData.uri"
          :autoSize="{ minRows: 6, maxRows: 6 }"
          :placeholder="$t('DataSource.FormItemMongo.100074-4')"
        />
      </a-form-item>

      <a-form-item
        name="database"
        :rules="[
          { required: true, message: $t('DataSource.FormItemMongo.100074-5'), trigger: 'blur' },
          { validator: spaceValidator, trigger: 'blur' }
        ]"
        :label="$t('DataSource.FormItemMongo.100074-6')"
      >
        <a-input
          v-model:value="formData.database"
          :placeholder="$t('DataSource.FormItemMongo.100074-7')"
          :maxlength="64"
        />
      </a-form-item>
    </div>

    <!-- 基本配置模式 -->
    <div v-else>
      <a-form-item
        name="host"
        :rules="[{ required: true, message: $t('DataSource.FormItemMongo.100074-8'), trigger: 'blur' }]"
        :label="$t('DataSource.FormItemMongo.100074-9')"
      >
        <a-input
          v-model:value="formData.host"
          :placeholder="$t('DataSource.FormItemMongo.100074-10')"
        />
      </a-form-item>

      <a-form-item
        name="port"
        :rules="[{ required: true, validator: validatePort, trigger: ['blur', 'change'] }]"
        :label="$t('DataSource.FormItemMongo.100074-11')"
      >
        <a-input-number
          v-model:value="formData.port"
          :min="0"
          :max="65536"
          :precision="0"
          :placeholder="$t('DataSource.FormItemMongo.100074-12')"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        name="database"
        :rules="[
          { required: true, message: $t('DataSource.FormItemMongo.100074-13'), trigger: 'blur' },
          { validator: spaceValidator, trigger: 'blur' }
        ]"
        :label="$t('DataSource.FormItemMongo.100074-14')"
      >
        <a-input
          v-model:value="formData.database"
          :placeholder="$t('DataSource.FormItemMongo.100074-15')"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item
        name="username"
        :label="$t('DataSource.FormItemMongo.100074-16')"
      >
        <a-input
          v-model:value="formData.username"
          :placeholder="$t('DataSource.FormItemMongo.100074-17')"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item :label="$t('DataSource.FormItemMongo.100074-18')">
        <a-input-password
          v-model:value="formData.password"
          :placeholder="$t('DataSource.FormItemMongo.100074-19')"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item
        name="authDatabase"
        :label="$t('DataSource.FormItemMongo.100074-20')"
      >
        <a-input
          v-model:value="formData.authDatabase"
          :placeholder="$t('DataSource.FormItemMongo.100074-21')"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item name="sslEnabled">
        <template #label>
          <a-space>
            <span>{{ $t('DataSource.FormItemMongo.100074-22') }}</span>
            <a-tooltip :title="$t('DataSource.FormItemMongo.100074-23')">
              <a-icon
                type="QuestionCircleFilled"
                style="color: #777"
              />
            </a-tooltip>
          </a-space>
        </template>
        <a-switch v-model:checked="formData.sslEnabled" />
      </a-form-item>

      <a-form-item>
        <template #label>
          <a-space>
            <span>{{ $t('DataSource.FormItemMongo.100074-24') }}</span>
            <a-tooltip :title="$t('DataSource.FormItemMongo.100074-25')">
              <a-icon
                type="QuestionCircleFilled"
                style="color: #777"
              />
            </a-tooltip>
          </a-space>
        </template>
        <HeaderParamsTable
          v-model="optionsArray"
          ref="optionsTableRef"
        />
      </a-form-item>
    </div>
  </a-form>
</template>

<script setup lang="ts" name="FormItemMongo">
import { useI18n } from 'vue-i18n'
import { MongoData } from '../../type'
import { spaceValidator } from '@datasource-manager-ui/utils/utils'
import HeaderParamsTable from './FormItemApi/HeaderParamsTable.vue'

const { t: $t } = useI18n()

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const formRef = ref()
const optionsTableRef = ref()

const formData = ref<Partial<MongoData>>({
  connectionMode: 'basic'
})

// 扩展参数数组，初始包含一个空项
const optionsArray = ref<any[]>([
  {
    key: '',
    value: '',
    id: Date.now()
  }
])

const validatePort = (_rule: any, value: number) => {
  if (!value && value !== 0) {
    return Promise.reject($t('DataSource.FormItemMongo.100074-26'))
  }
  if (value < 0 || value > 65536) {
    return Promise.reject($t('DataSource.FormItemMongo.100074-27'))
  }
  return Promise.resolve()
}

const validateUri = (_rule: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject($t('DataSource.FormItemMongo.100074-28'))
  }

  // 验证MongoDB URI格式
  const mongoUriPattern = /^mongodb(\+srv)?:\/\/.+/
  if (!mongoUriPattern.test(value)) {
    return Promise.reject($t('DataSource.FormItemMongo.100074-29'))
  }

  return Promise.resolve()
}

const validate = () => {
  return new Promise((resolve, reject) => {
    formRef.value
      .validate()
      .then(() => {
        // 验证扩展参数表格
        const isOptionsValid = optionsTableRef.value?.validate() ?? true
        if (!isOptionsValid) {
          reject(new Error($t('DataSource.FormItemMongo.100074-30')))
          return
        }

        // 过滤掉空的 key-value 对，转换为对象格式
        const options: Record<string, string> = {}
        optionsArray.value.forEach((item) => {
          if (item.key && item.key.trim()) {
            options[item.key] = item.value || ''
          }
        })

        // 只有当有有效的选项时才设置
        if (Object.keys(options).length > 0) {
          formData.value.options = options
        } else {
          delete formData.value.options
        }

        emit('update:modelValue', formData.value)
        resolve(true)
      })
      .catch((error: any) => {
        reject(error)
      })
  })
}

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== ''

const canTestConnection = computed(() => {
  const { connectionMode, uri, host, port, database } = formData.value

  if (connectionMode === 'url') {
    // URL模式下需要uri和database都有值
    return Boolean(uri?.trim()) && Boolean(database?.trim())
  } else {
    return Boolean(host?.trim()) && hasValue(port) && Boolean(database?.trim())
  }
})

// 从基本配置构建URI（不包含database）
const buildUriFromBasic = () => {
  const { host, port, username, password, authDatabase, sslEnabled } = formData.value

  if (!host || !port) {
    return ''
  }

  // 构建认证部分
  const auth = username ? `${username}${password ? ':' + password : ''}@` : ''

  // 构建主机部分
  const hostPart = `${host}:${port}`

  // 构建查询参数
  const params: string[] = []
  if (authDatabase) {
    params.push(`authSource=${authDatabase}`)
  }
  if (sslEnabled) {
    params.push('ssl=true')
  }

  // 添加扩展参数
  if (formData.value.options && Object.keys(formData.value.options).length > 0) {
    Object.entries(formData.value.options).forEach(([key, value]) => {
      if (key) {
        params.push(`${key}=${value || ''}`)
      }
    })
  }

  const queryString = params.length > 0 ? '?' + params.join('&') : ''

  return `mongodb://${auth}${hostPart}${queryString}`
}

// 从URI解析基本配置（不解析database，保留原有database值）
const parseUriToBasic = (uri: string) => {
  try {
    // 移除 mongodb:// 或 mongodb+srv:// 前缀
    const cleanUri = uri.replace(/^mongodb(\+srv)?:\/\//, '')

    // 解析认证信息
    let auth = ''
    let hostAndPath = cleanUri
    if (cleanUri.includes('@')) {
      ;[auth, hostAndPath] = cleanUri.split('@')
    }

    const [username, password] = auth ? auth.split(':') : ['', '']

    // 解析主机、端口和查询参数（URI中可能有或没有路径部分）
    let hostPart = hostAndPath
    let queryString = ''

    // 检查是否有查询参数
    const queryIndex = hostAndPath.indexOf('?')
    if (queryIndex !== -1) {
      hostPart = hostAndPath.substring(0, queryIndex)
      queryString = hostAndPath.substring(queryIndex + 1)
    }

    // 移除可能存在的路径部分（/之后的内容，但在?之前）
    const slashIndex = hostPart.indexOf('/')
    if (slashIndex !== -1) {
      hostPart = hostPart.substring(0, slashIndex)
    }

    const [host, portStr] = hostPart.split(',')[0].split(':') // 只取第一个主机

    // 解析查询参数
    const params = new URLSearchParams(queryString)
    const authDatabase = params.get('authSource') || ''
    const sslEnabled = params.get('ssl') === 'true'

    // 提取扩展参数（排除已知参数）
    const knownParams = ['authSource', 'ssl']
    const options: Record<string, string> = {}
    params.forEach((value, key) => {
      if (!knownParams.includes(key)) {
        options[key] = value
      }
    })

    return {
      host: host || '',
      port: portStr ? parseInt(portStr, 10) : undefined,
      username: username || '',
      password: password || '',
      authDatabase: authDatabase || '',
      sslEnabled: sslEnabled || false,
      options: Object.keys(options).length > 0 ? options : undefined
    }
  } catch (error) {
    console.error($t('DataSource.FormItemMongo.100074-31'), error)
    return {
      host: '',
      port: undefined,
      username: '',
      password: '',
      authDatabase: '',
      sslEnabled: false
    }
  }
}

const handleConnectionModeChange = () => {
  const isUrlMode = formData.value.connectionMode === 'url'

  if (isUrlMode) {
    // 从基本配置切换到URL模式：构建URI
    const uri = buildUriFromBasic()
    Object.assign(formData.value, { uri })
  } else {
    // 从URL切换到基本配置模式：解析URI
    const uri = formData.value.uri || ''
    const basicConfig = parseUriToBasic(uri)
    Object.assign(formData.value, basicConfig)

    // 更新扩展参数数组
    if (basicConfig.options && Object.keys(basicConfig.options).length > 0) {
      optionsArray.value = Object.entries(basicConfig.options).map(([key, value], index) => ({
        key,
        value,
        id: Date.now() + index
      }))
    } else {
      optionsArray.value = [
        {
          key: '',
          value: '',
          id: Date.now()
        }
      ]
    }
  }
}

// 同步 props.modelValue 到内部状态
const syncFormData = (newValue: any) => {
  if (newValue && Object.keys(newValue).length > 0) {
    Object.assign(formData.value, newValue)

    // 如果有 options 数据，转换为数组格式
    if (newValue.options && Object.keys(newValue.options).length > 0) {
      optionsArray.value = Object.entries(newValue.options).map(([key, value], index) => ({
        key,
        value,
        id: Date.now() + index
      }))
    } else {
      // 没有 options 时，保持初始空项
      optionsArray.value = [
        {
          key: '',
          value: '',
          id: Date.now()
        }
      ]
    }
  }
}

watch(
  () => props.modelValue,
  (newValue) => syncFormData(newValue),
  { immediate: true, deep: true }
)

defineExpose({ validate, canTestConnection })
</script>

<style scoped lang="less">
.button-width {
  min-width: 150px;
  text-align: center;
}

:deep(.ant-radio-group-outline .ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}
:deep(.ant-radio-group-outline .ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}
</style>
