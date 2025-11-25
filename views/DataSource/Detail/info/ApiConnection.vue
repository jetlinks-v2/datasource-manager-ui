<template>
  <DescriptionItemList
    title="数据连接"
    :column="3"
    :items="descriptionItems"
  />

  <div v-if="isOAuth2">
    <KeyValueTable
      title="请求头"
      :data-source="requestHeaderData"
    />
    <KeyValueTable
      title="参数"
      :data-source="argumentData"
    />
  </div>
</template>

<script lang="ts" name="ApiConnection" setup>
import DescriptionItemList, { type DescriptionItem, type DescriptionLabel } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'
import KeyValueTable from './components/KeyValueTable.vue'

interface KeyValueItem {
  key?: string
  value?: string
}

interface BasicAuthConfig {
  username?: string
  password?: string
}

interface BearerAuthConfig {
  token?: string
}

interface OAuth2AuthConfig {
  clientId?: string
  clientSecret?: string
  grantType?: string
  tokenUrl?: string
  tokenRequestType?: string
  scope?: string
}

type AuthType = 'basic' | 'bearer' | 'OAuth2' | 'none' | ''

interface AuthConfig {
  authType?: AuthType
  basic?: BasicAuthConfig
  bearer?: BearerAuthConfig
  oauth2?: OAuth2AuthConfig
}

interface ApiShareConfig {
  baseUrl?: string
  headers?: KeyValueItem[]
  parameters?: KeyValueItem[]
  authConfig?: AuthConfig
}

const AUTH_TYPE_TEXT: Record<string, string> = {
  basic: '基本认证',
  bearer: 'Bearer认证',
  OAuth2: 'OAuth2认证',
  none: '不鉴权'
}

const TOKEN_REQUEST_TYPE_TEXT: Record<string, string> = {
  POST_URI: 'URL参数',
  POST_BODY: '请求体'
}

const OAUTH_GRANT_TYPE_TEXT: Record<string, string> = {
  client_credentials: '客户端凭证'
}

const props = defineProps<{ info: any }>()
const { info } = toRefs(props)

const shareConfig = computed<ApiShareConfig>(() => info.value?.shareConfig ?? {})

const authConfig = computed<AuthConfig>(() => shareConfig.value.authConfig ?? {})

const authType = computed<AuthType>(() => authConfig.value.authType ?? 'none')

const isOAuth2 = computed(() => authType.value === 'OAuth2')

const authTypeText = computed(() => AUTH_TYPE_TEXT[authType.value] ?? '--')

const baseItems = computed<DescriptionItem[]>(() => [
  {
    key: 'baseUrl',
    label: 'API地址',
    value: shareConfig.value.baseUrl || '--'
  },
  {
    key: 'authType',
    label: '鉴权方式',
    value: authTypeText.value
  }
])

const createBasicItems = (basic: BasicAuthConfig = {}): DescriptionItem[] => [
  {
    key: 'username',
    label: '用户名',
    value: basic.username || '--'
  },
  {
    key: 'password',
    label: '密码',
    component: MaskDisplay,
    componentProps: {
      value: basic.password,
      placeholder: '--'
    }
  }
]

const createBearerItems = (bearer: BearerAuthConfig = {}): DescriptionItem[] => [
  {
    key: 'token',
    label: 'Token',
    value: bearer.token || '--'
  }
]

const createOAuthLabel = (text: string, tooltip?: string): DescriptionLabel => ({
  text,
  tooltip
})

const createOAuthItems = (oauth2: OAuth2AuthConfig = {}): DescriptionItem[] => {
  const scopeValue = oauth2.scope === '*' ? '' : oauth2.scope

  return [
    {
      key: 'grantType',
      label: '模式',
      value: (oauth2.grantType && OAUTH_GRANT_TYPE_TEXT[oauth2.grantType]) || '--'
    },
    {
      key: 'tokenUrl',
      label: 'Token地址',
      value: oauth2.tokenUrl || '--'
    },
    {
      key: 'tokenRequestType',
      label: '请求方式',
      value: (oauth2.tokenRequestType && TOKEN_REQUEST_TYPE_TEXT[oauth2.tokenRequestType]) || '请求体'
    },
    {
      key: 'scope',
      label: 'Scope',
      component: MaskDisplay,
      componentProps: {
        value: scopeValue,
        placeholder: '--'
      }
    },
    {
      key: 'clientId',
      label: createOAuthLabel('Client ID', '应用唯一标识'),
      value: oauth2.clientId || '--'
    },
    {
      key: 'clientSecret',
      label: createOAuthLabel('Client Secret', '应用唯一标识的密钥'),
      component: MaskDisplay,
      componentProps: {
        value: oauth2.clientSecret,
        placeholder: '--'
      }
    }
  ]
}

const authItems = computed<DescriptionItem[]>(() => {
  switch (authType.value) {
    case 'basic':
      return createBasicItems(authConfig.value.basic)
    case 'bearer':
      return createBearerItems(authConfig.value.bearer)
    case 'OAuth2':
      return createOAuthItems(authConfig.value.oauth2)
    default:
      return []
  }
})

const descriptionItems = computed<DescriptionItem[]>(() => [...baseItems.value, ...authItems.value])

const requestHeaderData = computed<KeyValueItem[]>(() => shareConfig.value.headers ?? [])

const argumentData = computed<KeyValueItem[]>(() => shareConfig.value.parameters ?? [])
</script>

<style lang="less" scoped></style>
