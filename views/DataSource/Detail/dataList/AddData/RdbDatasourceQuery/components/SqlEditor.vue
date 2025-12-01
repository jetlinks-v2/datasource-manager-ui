<template>
  <div class="sql-query-container">
    <div class="title">
      <a-button
        type="primary"
        @click="handleRunQuery"
        :loading="loading"
        :disabled="!modelValue"
      >
        <AIcon type="PlayCircleOutlined" />
        {{ $t('DataSource.SqlEditor.100046-0') }}
      </a-button>
    </div>
    <MonacoEditor
      ref="editorRef"
      v-model:modelValue="sqlValue"
      :registrationTips="registrationTips"
      language="sql"
      theme="vs-white"
      style="height: 300px; width: 100%"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  registrationTips: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'run', 'change'])

const sqlValue = ref(props.modelValue)
const editorRef = ref()

const handleChange = () => {
  emit('update:modelValue', sqlValue.value)
  emit('change', sqlValue.value)
}

const handleRunQuery = () => {
  emit('run', sqlValue.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== sqlValue.value) {
      sqlValue.value = newValue
    }
  }
)
</script>

<style scoped lang="less">
.sql-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .title {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 16px;
  }

  .sql-actions {
    display: flex;
    gap: 8px;
    margin: 12px 0;
  }
}
</style>
