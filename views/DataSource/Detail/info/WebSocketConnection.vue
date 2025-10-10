<template>
  <DescriptionItemList
    title="数据连接"
    :column="2"
    :items="descriptionFields"
  />
</template>

<script lang="ts" setup>
import DescriptionItemList from './components/DescriptionItemList.vue'

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
  payloadType: ''
})

const PAYLOAD_TYPE_MAP = {
  STRING: 'STRING（文本）',
  JSON: 'JSON',
  BINARY: 'BINARY（二进制）'
} as const

const DEFAULT_VALUES = {
  maxMessageSize: 2,
  reconnectionIntervals: 5000
} as const

const formatTimeout = (timeout?: number): string => {
  return timeout ? `${timeout}毫秒` : '永不超时'
}

const formatReconnection = (attempts?: number): string => {
  if (!attempts) {
    return '不重连'
  }
  return attempts === -1 ? '无限重连' : `${attempts}次`
}

const formatMessageSize = (size?: number): string => {
  return `${size || DEFAULT_VALUES.maxMessageSize}MB`
}

const formatInterval = (interval?: number): string => {
  return `${interval || DEFAULT_VALUES.reconnectionIntervals}毫秒`
}

const formatPayloadType = (type?: string): string => {
  return type ? PAYLOAD_TYPE_MAP[type as keyof typeof PAYLOAD_TYPE_MAP] || '--' : '--'
}

const descriptionFields = computed(() => [
  {
    key: 'handshakeTimeout',
    label: '请求等待超时',
    value: formatTimeout(webSocketData.handshakeTimeout)
  },
  {
    key: 'reconnectionAttempts',
    label: '最大重连次数',
    value: formatReconnection(webSocketData.reconnectionAttempts)
  },
  {
    key: 'maxMessageSize',
    label: '允许接收的最大消息大小',
    value: formatMessageSize(webSocketData.maxMessageSize)
  },
  {
    key: 'reconnectionIntervals',
    label: '重连间隔时间',
    value: formatInterval(webSocketData.reconnectionIntervals)
  },
  {
    key: 'payloadType',
    label: '数据类型',
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
