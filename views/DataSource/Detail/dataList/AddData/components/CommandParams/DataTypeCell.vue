<!-- components/DataTypeCell.vue -->
<template>
  <div class="data-type-container">
    <!-- 有错误时显示徽标 -->
    <a-badge
      v-if="hasError"
      dot
      status="error"
      style="width: 85%"
      :numberStyle="{ width: 'auto' }"
    >
      <a-tooltip
        :title="errorMessage"
        color="#ff4d4f"
        placement="topRight"
      >
        <a-select
          v-model:value="record.dataType.type"
          class="form-error"
          style="width: 100%"
          placeholder="请选择数据类型"
          :options="dataTypeOptions"
          :disabled="disabled"
          @blur="$emit('verify')"
          @change="handleDataTypeChange"
        />
      </a-tooltip>
    </a-badge>

    <!-- 无错误时正常显示 -->
    <a-select
      v-else
      v-model:value="record.dataType.type"
      style="width: 85%"
      placeholder="请选择数据类型"
      :options="dataTypeOptions"
      :disabled="disabled"
      @blur="$emit('verify')"
      @change="handleDataTypeChange"
      :size="disabled ? 'small' : 'middle'"
    />

    <!-- 弹窗遮罩 -->
    <div
      v-if="popoverVisible"
      class="popover-modal-mask"
    ></div>

    <!-- 数据类型编辑弹窗 -->
    <a-popover
      v-model:open="popoverVisibleValue"
      trigger="click"
      destroyTooltipOnHide
      placement="right"
    >
      <template #content>
        <DataTypeEditor
          :data-type="record.dataType"
          :disabled="disabled"
          @confirm="handleEditorConfirm"
          @cancel="handleEditorCancel"
        />
      </template>
      <AIcon
        :type="disabled ? 'EyeOutlined' : 'EditOutlined'"
        v-if="isEditableDataType(record.dataType.type, mode)"
        :style="{
          marginLeft: '12px',
          color: hasError ? 'red' : '#1677ff',
          cursor: 'pointer'
        }"
      />
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import { useDataTypeManagement } from './setting'
import DataTypeEditor from './DataTypeEditor.vue'

const props = defineProps({
  record: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  hasError: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  popoverVisible: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String as PropType<'treeTable' | 'defaultTable'>,
    default: 'defaultTable'
  }
})

const emit = defineEmits(['update:data-type', 'update:popover-visible', 'verify'])

const { dataTypeOptions, isEditableDataType, getDefaultConfig } = useDataTypeManagement()

// 计算属性处理弹窗可见状态
const popoverVisibleValue = computed({
  get: () => props.popoverVisible,
  set: (value) => emit('update:popover-visible', value)
})

// 处理数据类型变更
const handleDataTypeChange = () => {
  const type = props.record.dataType.type
  const defaultConfig = getDefaultConfig(type)

  const updatedDataType = {
    type,
    ...defaultConfig
  }

  emit('update:data-type', updatedDataType)
  emit('verify')
}

// 处理编辑器确认
const handleEditorConfirm = (newDataType: any) => {
  emit('update:data-type', newDataType)
  popoverVisibleValue.value = false
  emit('verify')
}

// 处理编辑器取消
const handleEditorCancel = () => {
  popoverVisibleValue.value = false
}
</script>

<style scoped lang="less">
.data-type-container {
  white-space: nowrap;

  .popover-modal-mask {
    position: fixed;
    height: 100vh;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1030;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(1px);
  }

  .form-error {
    :deep(.ant-select-selector) {
      border-color: red !important;
    }
  }
}
</style>
