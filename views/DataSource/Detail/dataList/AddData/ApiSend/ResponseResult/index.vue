<template>
  <div class="response-container">
    <TitleComponent data="{{ $t('DataSource.Response.100023-0') }}" />

    <a-tabs
      v-model="activeTab"
      type="card"
    >
      <a-tab-pane
        key="body"
        :tab="$t('DataSource.Response.100023-1')"
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
import { onlyMessage } from '@jetlinks-web/utils'
import { isArray } from 'lodash-es'
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

const getCurrentBody = () => {
  try {
    return JSON.parse(jsonData.value)
  } catch (error) {
    return null
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
  isValid,
  getCurrentBody
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
