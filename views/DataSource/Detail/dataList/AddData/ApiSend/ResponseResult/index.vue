<template>
  <div class="response-container">
    <TitleComponent
        data="响应结果"
        :style="{ fontSize: '16px' }"
    />

    <a-tabs
        v-model="activeTab"
        type="card"
    >
      <a-tab-pane
          key="body"
          tab="响应体"
      >
        <JsonEditor
            ref="editorRef"
            v-model="jsonData"
            height="350px"
            :showFormatBtn="false"
            formatOnBlur
            showMinimap
            @update="handleBlur"
        />
      </a-tab-pane>
      <!-- 请求头 -->
      <a-tab-pane
          key="request"
          tab="请求头"
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
          tab="响应头"
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
        <div
            class="meta"
            v-if="data.status"
        >
          <a-tag :color="data.status === 200 ? 'success' : 'error'">{{ data.status }}</a-tag>
        </div>
      </template>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import JsonEditor from '../../components/JsonEditor.vue'
import {onlyMessage} from '@jetlinks-web/utils'
import {isArray} from 'lodash-es'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(['blur'])
const columns = [
  {
    title: '键名',
    dataIndex: 'key',
    key: 'key',
    ellipsis: true
  },
  {
    title: '值',
    dataIndex: 'value',
    key: 'value',
    ellipsis: true
  }
]

const jsonData = ref('{}')
const activeTab = ref('body')
const isValid = ref(true)
const headersData = computed(() => convertHeadersToKeyValueArray(props.data.headers))
const requestData = computed(() => convertHeadersToKeyValueArray(props.data.requestHeaders))

const convertHeadersToKeyValueArray = (data: any) => {
  if (!data || typeof data !== 'object' || isArray(data)) {
    return []
  }

  const entries = Object.entries(data)

  return entries.map(([key, valueArray]) => {
    let processedValue

    if (isArray(valueArray)) {
      processedValue = valueArray.join(', ')
    } else {
      processedValue = String(valueArray)
    }

    return {
      key: key,
      value: processedValue
    }
  })
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
        onlyMessage('响应体解析失败', 'error')
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
}

.meta {
  display: flex;
  align-items: center;
}
</style>
