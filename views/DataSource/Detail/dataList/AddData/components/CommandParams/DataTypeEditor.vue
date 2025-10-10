<!-- components/DataTypeEditor.vue -->
<template>
  <div class="data-type-editor">
    <div class="popover-header">
      <div class="tab-container">
        <div
          class="tab-item"
          :class="{ active: activeKey === 'dataType' }"
          @click="switchTab('dataType')"
        >
          数据类型
        </div>
        <div
          class="tab-item"
          :class="{ active: activeKey === 'jsonSchema' }"
          @click="switchTab('jsonSchema')"
        >
          JSON 表达式
        </div>
      </div>
    </div>

    <div class="popover-body">
      <!-- 数据类型编辑界面 -->
      <div
        v-show="activeKey === 'dataType'"
        class="data-type-content"
      >
        <component
          :is="getDataTypeComponent(dataTypeConfig.type)"
          ref="componentRef"
          :readonly="disabled"
          :data="dataTypeConfig"
          v-if="isValidDataType(dataTypeConfig.type)"
        />
      </div>

      <!-- JSON Schema编辑界面 -->
      <div
        v-show="activeKey === 'jsonSchema'"
        class="tab-content"
      >
        <div class="json-schema-header">
          <a-button
            @click="handleJsonCopy"
            type="link"
            size="small"
            class="copy-btn"
          >
            <AIcon type="CopyOutlined" />
            复制
          </a-button>
        </div>
        <div class="editor-container">
          <monaco-editor
            ref="editorRef"
            language="json"
            theme="vs"
            :readOnly="disabled"
            v-model:modelValue="jsonData"
          />
        </div>
      </div>
    </div>

    <div
      class="popover-footer"
      v-if="!disabled"
    >
      <a-space>
        <a-button
          @click="$emit('cancel')"
          size="small"
        >
          取消
        </a-button>
        <a-button
          @click="handleConfirm"
          size="small"
          type="primary"
        >
          确定
        </a-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import useClipboard from 'vue-clipboard3'
import { onlyMessage } from '@jetlinks-web/utils'
import { useDataTypeManagement } from './setting'
import {isArray} from 'lodash-es'

const props = defineProps({
  dataType: {
    type: Object,
    required: true
  },
  isTreeTable: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])
const { toClipboard } = useClipboard()

const { getDataTypeComponent, isValidDataType, dataTypeOptions } = useDataTypeManagement()

// 状态
const activeKey = ref('dataType')
const componentRef = ref<any>(null)
const dataTypeConfig = ref(props.dataType)
const jsonData = ref('')
const editorRef = ref(null)

// 验证JSON数据
const validateJsonData = (jsonString: string) => {
  try {
    const validTypes = new Set(dataTypeOptions.map((item) => item.value))
    const parsedData = JSON.parse(jsonString)

    if (!parsedData.type) {
      onlyMessage('JSON数据中必须包含type字段', 'error')
      return null
    }

    if (!validTypes.has(parsedData.type)) {
      onlyMessage(`数据类型"${parsedData.type}"不支持`, 'error')
      return null
    }

    if (parsedData.type === 'object') {
      if (!parsedData.properties) {
        onlyMessage('JSON数据中必须包含properties字段', 'error')
        return null
      }

      if (!isArray(parsedData.properties)) {
        onlyMessage('JSON数据object中properties字段必须为数组', 'error')
        return null
      }
    }

    if (parsedData.type === 'enum') {
      if (!parsedData.elements) {
        onlyMessage('JSON数据enum中必须包含elements字段', 'error')
        return null
      }

      if (!isArray(parsedData.elements)) {
        onlyMessage('JSON数据enum中elements字段必须为数组', 'error')
        return null
      }
    }

    if (parsedData.type === 'array') {
      if (!parsedData.elementType.type) {
        onlyMessage('JSON数据elementType中必须包含type字段', 'error')
        return null
      }

      if (!validTypes.has(parsedData.elementType.type)) {
        onlyMessage(`数据类型"${parsedData.elementType.type}"不支持`, 'error')
        return null
      }

      if (!parsedData.elementType) {
        onlyMessage('JSON数据array中必须包含elementType字段', 'error')
        return null
      }

      if (parsedData.elementType.type === 'enum') {
        if (!parsedData.elementType.elements) {
          onlyMessage('JSON数据enum中必须包含elements字段', 'error')
          return null
        }

        if (!isArray(parsedData.elementType.elements)) {
          onlyMessage('JSON数据enum中elements字段必须为数组', 'error')
          return null
        }
      }

      if (parsedData.elementType.type === 'object') {
        if (!parsedData.elementType.properties) {
          onlyMessage('JSON数据object中必须包含properties字段', 'error')
          return null
        }

        if (!isArray(parsedData.elementType.properties)) {
          onlyMessage('JSON数据object中properties字段必须为数组', 'error')
          return null
        }
      }
    }

    return parsedData
  } catch (error) {
    onlyMessage('JSON验证失败', 'error')
    return null
  }
}

// 切换标签页
const switchTab = async (key: string) => {
  if (key === 'jsonSchema' && activeKey.value === 'dataType') {
    // 从数据类型切换到JSON时，更新JSON数据
    const data = await componentRef.value?.getData()
    if (data) {
      dataTypeConfig.value = data.error ? dataTypeConfig.value : data
      jsonData.value = JSON.stringify(dataTypeConfig.value, null, 2)
    }
  } else if (key === 'dataType' && activeKey.value === 'jsonSchema') {
    // 从JSON切换到数据类型时，验证并更新数据类型配置
    const parsedData = validateJsonData(jsonData.value)
    dataTypeConfig.value = parsedData ? parsedData : dataTypeConfig.value
  }
  activeKey.value = key
}

// 复制JSON
const handleJsonCopy = async () => {
  try {
    await toClipboard(jsonData.value)
    onlyMessage('复制成功')
  } catch (error) {
    onlyMessage('复制失败', 'error')
  }
}

// 确认修改
const handleConfirm = async () => {
  if (activeKey.value === 'dataType') {
    // 如果在数据类型编辑模式，获取最新数据
    const data = await componentRef.value?.getData()
    if (data) {
      if (data.error) {
        onlyMessage(data.error, 'error')
        return
      }
      dataTypeConfig.value = data
      emit('confirm', dataTypeConfig.value)
    }
  } else if (activeKey.value === 'jsonSchema') {
    // 如果在JSON编辑模式，验证并更新数据
    const parsedData = validateJsonData(jsonData.value)
    if (!parsedData) return
    dataTypeConfig.value = parsedData
    emit('confirm', dataTypeConfig.value)
  }
}

// 监听数据类型变化，更新内部状态
watch(
  () => props.dataType,
  (newValue) => {
    dataTypeConfig.value = newValue
    if (activeKey.value === 'jsonSchema') {
      jsonData.value = JSON.stringify(dataTypeConfig.value, null, 2)
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped lang="less">
.data-type-editor {
  width: 100%;
  min-width: 320px;
}

.popover-header {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.tab-container {
  display: flex;
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
  margin-bottom: 4px;
  width: 220px;
}

.tab-item {
  flex: 1;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
  margin: 0 2px;
  font-size: 13px;
  color: #666;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--ant-primary-color);
    background-color: rgba(0, 0, 0, 0.02);
  }

  &.active {
    background-color: white;
    color: var(--ant-primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    font-weight: 500;
  }
}

.tab-content {
  min-height: 200px;
}

.data-type-content {
  min-height: 200px;
  padding: 4px;
}

.popover-body {
  padding: 0 8px;
  border-radius: 8px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
}

.popover-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.json-schema-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.copy-btn {
  font-size: 12px;
  padding-top: 6px;
}

.editor-container {
  height: 300px;
  width: 400px;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
}
</style>
