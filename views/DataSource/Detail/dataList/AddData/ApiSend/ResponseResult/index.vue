<template>
  <div class="response-container">
    <div class="title">{{ $t('DataSource.Response.100023-0') }}</div>

    <a-tabs
      v-model="activeTab"
      type="card"
    >
      <a-tab-pane
        key="body"
        :tab="$t('DataSource.Response.100023-1')"
      >
        <monaco-editor
          ref="editorRef"
          v-model:modelValue="jsonData"
          language="json"
          style="height: 100%; min-height: 350px"
          @blur="handleBlur"
          theme="vs"
        />
      </a-tab-pane>
      <!-- 请求头 -->
      <a-tab-pane
        key="request"
        :tab="$t('DataSource.RequestParams.100021-1')"
      >
        <a-table
          :columns="columns"
          :data-source="requestData"
          size="small"
          bordered
          :scroll="{ y: 250 }"
        />
      </a-tab-pane>

      <a-tab-pane
        key="headers"
        :tab="$t('DataSource.Response.100023-2')"
      >
        <a-table
          :columns="columns"
          :data-source="headersData"
          size="small"
          bordered
          :scroll="{ y: 250 }"
        />
      </a-tab-pane>

      <template #rightExtra>
        <div class="meta">
          <a-tag :color="data.status === 200 ? 'success' : 'error'">{{ data.status }}</a-tag>
        </div>
      </template>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { onlyMessage } from '@jetlinks-web/utils'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['blur'])
const columns = computed(() => [
  {
    title: $t('DataSource.Response.100023-3'),
    dataIndex: 'key',
    key: 'key',
    ellipsis: true
  },
  {
    title: $t('DataSource.Response.100023-4'),
    dataIndex: 'value',
    key: 'value',
    ellipsis: true
  }
])

const jsonData = ref('{}')
const activeTab = ref('body')
const isValid = ref(true)
const headersData = computed(() => convertHeadersToKeyValueArray(props.data.headers))
const requestData = computed(() => convertHeadersToKeyValueArray(props.data.requestHeaders))

const convertHeadersToKeyValueArray = (data: any) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return []
  }

  const entries = Object.entries(data)

  const keyValueArray = entries.map(([key, valueArray]) => {
    let processedValue = ''

    if (Array.isArray(valueArray)) {
      processedValue = valueArray.join(', ')
    } else {
      processedValue = String(valueArray)
    }

    return {
      key: key,
      value: processedValue
    }
  })

  return keyValueArray
}

const handleBlur = () => {
  try {
    const bodyData = JSON.parse(jsonData.value)
    isValid.value = true
    emit('blur', bodyData)
  } catch (error) {
    isValid.value = false
  }
}

watch(
  () => props.data.body,
  (newVal) => {
    try {
      jsonData.value = JSON.stringify(newVal, null, 2)
    } catch (error) {
      jsonData.value = '{}'
      onlyMessage($t('DataSource.Response.100023-5'), 'error')
    }
  }
)

defineExpose({
  isValid
})
</script>

<style scoped lang="less">
.response-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .title {
    font-size: 18px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 12px;
  }
}

.meta {
  display: flex;
  align-items: center;
  gap: 12px;

  .time {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }
}
</style>
