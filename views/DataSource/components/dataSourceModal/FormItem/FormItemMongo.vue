<template>
  <a-form
    :model="formData"
    ref="formRef"
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

    <!-- 连接URL模式 -->
    <div v-if="formData.connectionMode === 'url'">
      <a-form-item
        name="uri"
        :rules="[{ required: true, validator: validateUri, trigger: 'blur' }]"
        label="连接地址"
      >
        <a-textarea
          v-model:value="formData.uri"
          :autoSize="{ minRows: 6, maxRows: 6 }"
          placeholder="mongodb://user:pwd@host1:27017,host2:27017/db?authSource=admin&ssl=true"
        />
      </a-form-item>
    </div>

    <!-- 基本配置模式 -->
    <div v-else>
      <a-form-item
        name="host"
        :rules="[{ required: true, message: '请输入主机地址', trigger: 'blur' }]"
        label="主机地址"
      >
        <a-input
          v-model:value="formData.host"
          placeholder="例如：localhost 或 192.168.1.100"
        />
      </a-form-item>

      <a-form-item
        name="port"
        :rules="[{ required: true, validator: validatePort, trigger: ['blur', 'change'] }]"
        label="端口"
      >
        <a-input-number
          v-model:value="formData.port"
          :min="0"
          :max="65536"
          :precision="0"
          placeholder="例如：27017"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        name="database"
        :rules="[
          { required: true, message: '请输入数据库名称', trigger: 'blur' },
          { validator: spaceValidator, trigger: 'blur' }
        ]"
        label="数据库名称"
      >
        <a-input
          v-model:value="formData.database"
          placeholder="请输入数据库名称"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item
        name="username"
        label="用户名"
      >
        <a-input
          v-model:value="formData.username"
          placeholder="请输入用户名"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item label="密码">
        <a-input-password
          v-model:value="formData.password"
          placeholder="请输入密码"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item
        name="authDatabase"
        label="认证数据库"
      >
        <a-input
          v-model:value="formData.authDatabase"
          placeholder="默认：admin"
          :maxlength="64"
        />
      </a-form-item>

      <a-form-item name="sslEnabled">
        <template #label>
          <a-space>
            <span>启用SSL/TLS</span>
            <a-tooltip title="对接 MongoDB Atlas 或云服务时通常需要启用">
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
            <span>扩展参数</span>
            <a-tooltip title="额外的连接参数，例如：readPreference、replicaSet、connectTimeoutMS等">
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
import { MongoData } from '../../type'
import { spaceValidator } from '@datasource-manager-ui/utils/utils'
import HeaderParamsTable from './FormItemApi/HeaderParamsTable.vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const formRef = ref()
const optionsTableRef = ref()

const formData = ref<MongoData>({
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
    return Promise.reject('请输入端口号')
  }
  if (value < 0 || value > 65536) {
    return Promise.reject('端口号必须在0到65536之间')
  }
  return Promise.resolve()
}

const validateUri = (_rule: any, value: string) => {
  if (!value || !value.trim()) {
    return Promise.reject('请输入连接地址')
  }

  // 验证MongoDB URI格式
  const mongoUriPattern = /^mongodb(\+srv)?:\/\/.+/
  if (!mongoUriPattern.test(value)) {
    return Promise.reject('请输入有效的MongoDB连接地址，格式：mongodb://...')
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
          reject(new Error('扩展参数验证失败'))
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
    return Boolean(uri?.trim())
  } else {
    return Boolean(host?.trim()) && hasValue(port) && Boolean(database?.trim())
  }
})

const handleConnectionModeChange = () => {
  const isUrlMode = formData.value.connectionMode === 'url'

  Object.assign(
    formData.value,
    isUrlMode
      ? { uri: '' }
      : {
          host: '',
          port: undefined,
          database: '',
          username: '',
          password: '',
          authDatabase: '',
          sslEnabled: false
        }
  )
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
  width: 150px;
  text-align: center;
}

:deep(.ant-radio-group-outline .ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}
:deep(.ant-radio-group-outline .ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}
</style>
