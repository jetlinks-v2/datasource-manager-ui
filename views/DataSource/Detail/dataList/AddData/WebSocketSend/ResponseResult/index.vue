<template>
  <div class="response-container">
    <div class="response-header">
      <TitleComponent :data="$t('DataSource.WebSocketResponseResult.100086-0')" />
      <div
        class="response-meta"
        v-if="data.status"
      >
        <a-tag :color="getStatusColor(data.status)">{{ data.status }}</a-tag>
      </div>
    </div>

    <div class="response-content">
      <JsonEditor
        v-model="jsonData"
        height="400px"
        :showFormatBtn="false"
        formatOnBlur
        showMinimap
        @update="handleBlur"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onlyMessage } from '@jetlinks-web/utils'
import dayjs from 'dayjs'
import JsonEditor from '../../components/JsonEditor.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['blur'])

const jsonData = ref('{}')
const isValid = ref(true)

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'error'
  return 'default'
}

const formatTime = (timestamp: number | string) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const handleBlur = () => {
  try {
    const bodyData = JSON.parse(jsonData.value)
    isValid.value = true
    emit('blur', bodyData)
  } catch (error) {
    isValid.value = false
    onlyMessage($t('DataSource.WebSocketResponseResult.100086-1'), 'error')
  }
}

const formatJsonData = (data: any) => {
  try {
    if (typeof data === 'string') {
      // 尝试解析字符串为JSON
      const parsed = JSON.parse(data)
      return JSON.stringify(parsed, null, 2)
    } else if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data, null, 2)
    } else {
      return JSON.stringify({ data }, null, 2)
    }
  } catch (error) {
    // 如果解析失败，直接返回字符串形式
    return JSON.stringify({ data: data }, null, 2)
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
  () => props.data,
  (newVal) => {
    if (newVal && Object.keys(newVal).length > 0) {
      jsonData.value = formatJsonData(newVal)
    } else {
      jsonData.value = '{}'
    }
  },
  { immediate: true, deep: true }
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

  .response-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .response-content {
    flex: 1;
    border: 1px solid #d9d9d9;
    overflow: hidden;
    background: #fff;
  }

  .response-meta {
    display: flex;
    align-items: center;
  }
}
</style>
