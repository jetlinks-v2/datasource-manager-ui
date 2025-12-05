<template>
  <DescriptionItemList
    :title="$t('Info.Api.100063-0')"
    :column="3"
    :items="descriptionItems"
  />

  <div v-if="isOAuth2">
    <KeyValueTable
      :title="$t('Info.Api.100063-21')"
      :data-source="requestHeaderData"
    />
    <KeyValueTable
      :title="$t('Info.Api.100063-22')"
      :data-source="argumentData"
    />
  </div>
</template>

<script lang="ts" name="ApiConnection" setup>
import { useI18n } from 'vue-i18n'
import DescriptionItemList, { type DescriptionItem, type DescriptionLabel } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'
import KeyValueTable from './components/KeyValueTable.vue'

const { t: $t } = useI18n()

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
  basic: $t('Info.Api.100063-3'),
  bearer: $t('Info.Api.100063-4'),
  OAuth2: $t('Info.Api.100063-5'),
  none: $t('Info.Api.100063-6')
}

const TOKEN_REQUEST_TYPE_TEXT: Record<string, string> = {
  POST_URI: $t('Info.Api.100063-14'),
  POST_BODY: $t('Info.Api.100063-15')
}

const OAUTH_GRANT_TYPE_TEXT: Record<string, string> = {
  client_credentials: $t('Info.Api.100063-11')
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
    label: $t('Info.Api.100063-1'),
    value: shareConfig.value.baseUrl || '--'
  },
  {
    key: 'authType',
    label: $t('Info.Api.100063-2'),
    value: authTypeText.value
  }
])

const createBasicItems = (basic: BasicAuthConfig = {}): DescriptionItem[] => [
  {
    key: 'username',
    label: $t('Info.Api.100063-7'),
    value: basic.username || '--'
  },
  {
    key: 'password',
    label: $t('Info.Api.100063-8'),
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
    label: $t('Info.Api.100063-9'),
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
      label: $t('Info.Api.100063-10'),
      value: (oauth2.grantType && OAUTH_GRANT_TYPE_TEXT[oauth2.grantType]) || '--'
    },
    {
      key: 'tokenUrl',
      label: $t('Info.Api.100063-12'),
      value: oauth2.tokenUrl || '--'
    },
    {
      key: 'tokenRequestType',
      label: $t('Info.Api.100063-13'),
      value: (oauth2.tokenRequestType && TOKEN_REQUEST_TYPE_TEXT[oauth2.tokenRequestType]) || $t('Info.Api.100063-15')
    },
    {
      key: 'scope',
      label: $t('Info.Api.100063-16'),
      component: MaskDisplay,
      componentProps: {
        value: scopeValue,
        placeholder: '--'
      }
    },
    {
      key: 'clientId',
      label: createOAuthLabel($t('Info.Api.100063-17'), $t('Info.Api.100063-19')),
      value: oauth2.clientId || '--'
    },
    {
      key: 'clientSecret',
      label: createOAuthLabel($t('Info.Api.100063-18'), $t('Info.Api.100063-20')),
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
