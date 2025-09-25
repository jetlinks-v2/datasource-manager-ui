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
      <a-descriptions-item label="API地址">
        <j-ellipsis>{{ commonData?.baseUrl || '--' }}</j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="鉴权方式">
        <j-ellipsis>{{ authTypeText || '--' }}</j-ellipsis>
      </a-descriptions-item>

      <!-- 鉴权配置信息 -->
      <template
        v-for="(auth, index) in authTypes"
        :key="index"
      >
        <template
          v-for="(item, itemIndex) in auth.items"
          :key="itemIndex"
        >
          <a-descriptions-item :label="item.label">
            <template v-if="item.label === '密码'">
              <a-space>
                <j-ellipsis>
                  <span :class="{ 'password-mask': !item.showEye && commonData.authConfig.basic.password }">
                    {{ item.showEye ? item.value : '********' }}
                  </span>
                </j-ellipsis>
                <a-button
                  type="text"
                  size="small"
                  @click="item.showEye = !item.showEye"
                >
                  <template #icon>
                    <AIcon
                      :type="item.showEye ? 'EyeOutlined' : 'EyeInvisibleOutlined'"
                      v-if="commonData.authConfig.basic.password"
                    />
                  </template>
                </a-button>
              </a-space>
            </template>
            <template v-else-if="item.label === 'Scope'">
              <a-space v-if="item.value">
                <j-ellipsis>
                  <span :class="{ 'password-mask': !item.showEye && item.value }">
                    {{ item.showEye ? item.value : '********' }}
                  </span>
                </j-ellipsis>
                <a-button
                  type="text"
                  size="small"
                  @click="item.showEye = !item.showEye"
                >
                  <template #icon>
                    <AIcon
                      :type="item.showEye ? 'EyeOutlined' : 'EyeInvisibleOutlined'"
                      v-if="item.value"
                    />
                  </template>
                </a-button>
              </a-space>
              <span v-else>--</span>
            </template>
            <j-ellipsis v-else>{{ item.value }}</j-ellipsis>
          </a-descriptions-item>
        </template>

        <!-- OAuth2 特殊字段 -->
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
          <a-space>
            <j-ellipsis>
              <span :class="{ 'password-mask': !showSecret && commonData.authConfig.oauth2.clientSecret }">
                {{ showSecret ? commonData.authConfig.oauth2.clientSecret || '--' : '********' }}
              </span>
            </j-ellipsis>
            <a-button
              type="text"
              size="small"
              @click="showSecret = !showSecret"
            >
              <template #icon>
                <AIcon
                  :type="showSecret ? 'EyeOutlined' : 'EyeInvisibleOutlined'"
                  v-if="commonData.authConfig.oauth2.clientSecret"
                />
              </template>
            </a-button>
          </a-space>
        </a-descriptions-item>
      </template>
    </a-descriptions>

    <!-- OAuth2 请求头和参数表格 -->
    <div v-if="authType === 'OAuth2'">
      <a-table
        :bordered="true"
        :columns="columns"
        :data-source="requestHeaderData"
        :pagination="false"
        :scroll="{ y: 240 }"
        style="margin-top: 12px"
      >
        <template #title><div class="title">请求头</div></template>
      </a-table>

      <a-table
        :bordered="true"
        :columns="columns"
        :data-source="argumentData"
        :pagination="false"
        :scroll="{ y: 240 }"
        style="margin-top: 12px"
      >
        <template #title><div class="title">参数</div></template>
      </a-table>
    </div>
  </div>
</template>

<script lang="ts" name="ApiConnection" setup>
const props = defineProps<{ info: any }>()
const { info } = toRefs(props)

const authType = ref('')
const authTypeText = ref('')
const showSecret = ref(false)
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

const authTypes = ref<any[]>([])

const handleAuthType = () => {
  const basic = {
    type: 'basic',
    items: [
      { label: '用户名', value: commonData.authConfig.basic.username || '--' },
      { label: '密码', value: commonData.authConfig.basic.password || '--', showEye: false }
    ]
  }

  const bearer = {
    type: 'bearer',
    items: [{ label: 'Token', value: commonData.authConfig.bearer.token || '--' }]
  }

  const oauth2 = {
    type: 'OAuth2',
    items: [
      {
        label: '模式',
        value: commonData.authConfig.oauth2.grantType === 'client_credentials' ? '客户端凭证' : '--'
      },
      {
        label: 'Token地址',
        value: commonData.authConfig.oauth2.tokenUrl || '--'
      },
      {
        label: '请求方式',
        value: commonData.authConfig.oauth2.tokenRequestType === 'POST_URI' ? 'URL参数' : '请求体'
      },
      {
        label: 'Scope',
        value: commonData.authConfig.oauth2.scope === '*' ? '' : commonData.authConfig.oauth2.scope,
        showEye: false
      }
    ]
  }

  if (authType.value === 'basic') authTypes.value = [basic]
  if (authType.value === 'bearer') authTypes.value = [bearer]
  if (authType.value === 'OAuth2') authTypes.value = [oauth2]
}

watch(
  info,
  () => {
    if (Object.keys(info.value).length > 0 && info.value.shareConfig) {
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

.title {
  font-weight: bold;
}
</style>
