<template>
  <DescriptionItemList
    :title="$t('Info.WebSocket.100068-0')"
    :column="2"
    :items="descriptionFields"
  />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import DescriptionItemList from './components/DescriptionItemList.vue'

const { t: $t } = useI18n()

interface WebSocketConfig {
  handshakeTimeout?: number
  reconnectionAttempts?: number
  maxMessageSize?: number
  reconnectionIntervals?: number
  payloadType?: string
}

interface InfoProps {
  shareConfig?: WebSocketConfig
  [key: string]: any
}

const props = defineProps<{
  info: InfoProps
}>()

const { info } = toRefs(props)

const webSocketData = reactive<WebSocketConfig>({
  handshakeTimeout: undefined,
  reconnectionAttempts: undefined,
  maxMessageSize: 2,
  reconnectionIntervals: 5000,
  payloadType: 'JSON'
})

const PAYLOAD_TYPE_MAP = {
  JSON: $t('Info.WebSocket.100068-9'),
  STRING: $t('Info.WebSocket.100068-10'),
  BINARY: $t('Info.WebSocket.100068-11')
} as const

const formatTimeout = (timeout?: number): string => {
  return timeout ? `${timeout}ms` : $t('Info.WebSocket.100068-2')
}

const formatReconnection = (attempts?: number): string => {
  if (!attempts) {
    return $t('Info.WebSocket.100068-4')
  }
  return attempts === -1 ? $t('Info.WebSocket.100068-5') : `${attempts}${$t('Info.WebSocket.100068-12')}`
}

const formatMessageSize = (size?: number): string => {
  return `${size}MB`
}

const formatInterval = (interval?: number): string => {
  return `${interval}ms`
}

const formatPayloadType = (type?: string): string => {
  return PAYLOAD_TYPE_MAP[type as keyof typeof PAYLOAD_TYPE_MAP]
}

const descriptionFields = computed(() => [
  {
    key: 'handshakeTimeout',
    label: $t('Info.WebSocket.100068-1'),
    value: formatTimeout(webSocketData.handshakeTimeout)
  },
  {
    key: 'reconnectionAttempts',
    label: $t('Info.WebSocket.100068-3'),
    value: formatReconnection(webSocketData.reconnectionAttempts)
  },
  {
    key: 'maxMessageSize',
    label: $t('Info.WebSocket.100068-6'),
    value: formatMessageSize(webSocketData.maxMessageSize)
  },
  {
    key: 'reconnectionIntervals',
    label: $t('Info.WebSocket.100068-7'),
    value: formatInterval(webSocketData.reconnectionIntervals)
  },
  {
    key: 'payloadType',
    label: $t('Info.WebSocket.100068-8'),
    value: formatPayloadType(webSocketData.payloadType)
  }
])

watch(
  () => info.value?.shareConfig,
  (shareConfig) => {
    if (shareConfig) {
      Object.assign(webSocketData, shareConfig)
    }
  },
  { immediate: true }
)
</script>

<style lang="less" scoped></style>
