<template>
  <div>
    <TitleComponent
      data="数据连接"
      :style="{ fontSize: '16px' }"
    />
    <a-descriptions
      :column="2"
      bordered
    >
      <a-descriptions-item label="请求等待超时">
        <j-ellipsis>
          {{ webSocketData.handshakeTimeout ? `${webSocketData.handshakeTimeout}毫秒` : '永不超时' }}
        </j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="最大重连次数">
        <j-ellipsis>{{ getReconnectionText(webSocketData.reconnectionAttempts) }}</j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="允许接收的最大消息大小">
        <j-ellipsis>
          {{ `${webSocketData.maxMessageSize || 2}MB` }}
        </j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="重连间隔时间">
        <j-ellipsis>
          {{ `${webSocketData.reconnectionIntervals || 5000}毫秒` }}
        </j-ellipsis>
      </a-descriptions-item>
      <a-descriptions-item label="数据类型">
        <j-ellipsis>{{ getPayloadTypeText(webSocketData.payloadType) }}</j-ellipsis>
      </a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<script lang="ts" name="WebSocketConnection" setup>
const props = defineProps<{ info: any }>()
const { info } = toRefs(props)

const webSocketData = reactive({
  handshakeTimeout: undefined,
  reconnectionAttempts: undefined,
  maxMessageSize: undefined,
  reconnectionIntervals: undefined,
  payloadType: ''
})

// 获取重连次数显示文本
const getReconnectionText = (attempts: number | undefined) => {
  if (attempts === undefined || attempts === null) return '不重连'
  if (attempts === 0) return '不重连'
  if (attempts === -1) return '无限重连'
  return `${attempts}次`
}

// 获取数据类型显示文本
const getPayloadTypeText = (type: string) => {
  const typeMap = {
    STRING: 'STRING（文本）',
    JSON: 'JSON',
    BINARY: 'BINARY（二进制）'
  }
  return typeMap[type as keyof typeof typeMap] || '--'
}

watch(
  info,
  () => {
    if (Object.keys(info.value).length > 0 && info.value.shareConfig) {
      const shareConfig = info.value.shareConfig
      webSocketData.handshakeTimeout = shareConfig.handshakeTimeout
      webSocketData.reconnectionAttempts = shareConfig.reconnectionAttempts
      webSocketData.maxMessageSize = shareConfig.maxMessageSize
      webSocketData.reconnectionIntervals = shareConfig.reconnectionIntervals
      webSocketData.payloadType = shareConfig.payloadType
    }
  },
  { deep: true, immediate: true }
)
</script>

<style lang="less" scoped></style>
