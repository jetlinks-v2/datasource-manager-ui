<template>
  <div
    class="string-type"
    :style="{ width: width, height: height }"
  >
    <div class="editor-container">
      <MonacoEditor
        v-model="displayContent"
        read-only
        :language="editorLanguage"
        :theme="'vs'"
        :blur-format="false"
        :options="{
          minimap: { enabled: false },
          lineNumbers: 'on',
          readOnly: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          fontSize: 12,
          tabSize: 2
        }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import MonacoEditor from '@/components/MonacoEditor/monacoEditor.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = withDefaults(
  defineProps<{
    data: any
    width?: string
    height?: string
    showTotal?: boolean
  }>(),
  {
    width: '100%',
    height: '100%',
    showTotal: false
  }
)

const emit = defineEmits<{
  countUpdated: [count: string]
}>()

const editorLanguage = ref('plaintext')
const displayContent = ref('')

// 判断字符串是否为有效的 JSON
const isValidJSON = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false

  const trimmed = str.trim()
  if (!trimmed) return false

  // 简单判断是否可能是 JSON（以 { 或 [ 开头）
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return false
  }

  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

const formatJSON = (str: string): string => {
  try {
    const parsed = JSON.parse(str)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return str
  }
}

// 处理展示内容
const processContent = () => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    displayContent.value = ''
    editorLanguage.value = 'plaintext'
    return
  }

  const item = props.data[0]
  const value = item?.value || ''

  // 判断是否为 JSON
  if (isValidJSON(value)) {
    editorLanguage.value = 'json'
    displayContent.value = formatJSON(value)
  } else {
    editorLanguage.value = 'plaintext'
    displayContent.value = value
  }
}

watch(
  () => props.data,
  () => {
    processContent()
    if (props.showTotal) {
      emit('countUpdated', $t('DataSource.Detail.Redis.String.TotalCharacters', { count: displayContent.value.length }))
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="less">
.string-type {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  min-height: 200px;

  :deep(.j-monaco-editor) {
    border-radius: 8px;
  }
}
</style>
