<template>
  <div class="stage-editor">
    <div class="field-group">
      <div class="field-header">
        <TitleComponent
          data="阶段类型"
          :style="{ margin: 0 }"
        />
        <a-popover
          trigger="click"
          placement="bottomLeft"
        >
          <template #content>
            <HelpDocument />
          </template>
          <a-tooltip title="帮助文档">
            <a-button
              type="text"
              ghost
              size="small"
            >
              <template #icon>
                <AIcon
                  type="ReadOutlined"
                  style="color: #1890ff"
                />
              </template>
            </a-button>
          </a-tooltip>
        </a-popover>
      </div>
      <a-select
        :value="stage?.type"
        :options="stageTypeOptions"
        show-search
        placeholder="输入或选择阶段类型"
        :filter-option="filterOption"
        style="width: 300px"
        @change="handleTypeChange"
      />
    </div>

    <div class="field-group">
      <TitleComponent
        data="阶段内容"
        :style="{ margin: 0 }"
      />
      <div class="editor-container">
        <JsonEditor
          :model-value="stage?.body || ''"
          :height="'100%'"
          :show-format-btn="false"
          :show-minimap="false"
          :format-on-blur="true"
          variable-pattern="\$\{[A-Za-z_][A-Za-z0-9_]*\}"
          @update:model-value="handleBodyChange"
          @variables-change="handleVariablesChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import JsonEditor from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/JsonEditor.vue'
import HelpDocument from './HelpDocument.vue'
import { type PipelineStage, getStageTypeOptions } from '../../utils/pipelineParser'

defineProps<{
  stage: PipelineStage | null
}>()

const emit = defineEmits(['update:type', 'update:body', 'variables-change'])

// 从工具函数获取阶段类型选项
const stageTypeOptions = getStageTypeOptions()

// 过滤选项
const filterOption = (input: string, option: any) => {
  const keyword = input.toLowerCase()
  return option.value.toLowerCase().includes(keyword) || option.label.toLowerCase().includes(keyword)
}

const handleTypeChange = (value: any) => {
  emit('update:type', value as string)
}

const handleBodyChange = (value: string) => {
  emit('update:body', value)
}

const handleVariablesChange = (variables: string[]) => {
  emit('variables-change', variables)
}
</script>

<style scoped lang="less">
.stage-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
  padding-left: 12px;
  gap: 16px;

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 12px;

    &:last-child {
      flex: 1;
      min-height: 0;
    }
  }

  .field-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    line-height: 32px;
  }

  .editor-container {
    flex: 1;
    height: 100%;
    width: 100%;
    min-height: 0;
  }
}
</style>
