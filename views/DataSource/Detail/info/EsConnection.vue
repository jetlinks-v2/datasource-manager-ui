<template>
  <DescriptionItemList
    :title="$t('Info.Es.100064-0')"
    :column="3"
    :items="visibleItems"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import DescriptionItemList, { type DescriptionItem } from './components/DescriptionItemList.vue'
import MaskDisplay from './components/MaskDisplay.vue'

const { t: $t } = useI18n()

interface EsConfig {
  uri: string
  pathPrefix: string
  username: string
  password: string
}

interface ShareConfig {
  uri?: string
  pathPrefix?: string
  username?: string
  password?: string
}

interface InfoProps {
  shareConfig?: ShareConfig
  [key: string]: any
}

const props = defineProps<{
  info: InfoProps
}>()

const { info } = toRefs(props)

const esData = reactive<EsConfig>({
  uri: '',
  pathPrefix: '',
  username: '',
  password: ''
})

const esItems = computed<DescriptionItem[]>(() => [
  {
    key: 'uri',
    label: $t('Info.Es.100064-1'),
    value: esData.uri || '--',
    condition: true
  },
  {
    key: 'pathPrefix',
    label: $t('Info.Es.100064-2'),
    value: esData.pathPrefix || '--',
    condition: true
  },
  {
    key: 'username',
    label: $t('Info.Es.100064-3'),
    value: esData.username || '--',
    condition: true
  },
  {
    key: 'password',
    label: $t('Info.Es.100064-4'),
    component: MaskDisplay,
    componentProps: {
      value: esData.password,
      placeholder: '--'
    },
    condition: true
  }
])

const visibleItems = computed(() =>
  esItems.value
    .filter((item) => item.condition)
    .map((item) => ({
      ...item,
      value: item.value || '--'
    }))
)

const parseEsConfig = (shareConfig: ShareConfig) => {
  const { uri = '', pathPrefix = '', username = '', password = '' } = shareConfig
  return {
    uri,
    pathPrefix,
    username,
    password
  }
}

watch(
  () => info.value,
  (newInfo) => {
    if (newInfo?.shareConfig) {
      const config = parseEsConfig(newInfo.shareConfig)
      Object.assign(esData, config)
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped></style>
