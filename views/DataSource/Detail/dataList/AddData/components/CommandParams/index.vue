<template>
  <div class="command-config-container">
    <div class="config-section">
      <TitleComponent
          data="命令入参配置"
          :style="{ fontSize: '16px' }"
      />
      <CommandTable
          ref="CommandTableInputRef"
          class="config-table"
          :scroll="{ y: 372 }"
          :columns="inputColumns"
          :dataSource="inputDataSource"
          :preview="preview"
          @update="handleInputSelectedChange"
      />
    </div>

    <div class="config-section">
      <TitleComponent
          data="命令返回响应配置"
          :style="{ fontSize: '16px' }"
      />
      <CommandTable
          ref="CommandTableOutputRef"
          class="config-table"
          :scroll="{ y: 372 }"
          :columns="outputColumns"
          :dataSource="outputDataSource"
          :preview="preview"
          :multiple="!preview"
          @update="handleOutputExpandChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="CommandParams">
import CommandTable from './CommandTable.vue'
import {onlyMessage} from '@jetlinks-web/utils'
import {cloneDeep, isArray} from 'lodash-es'

const props = defineProps({
  preview: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: Object,
    required: true
  }
})

const CommandTableInputRef = ref()
const CommandTableOutputRef = ref()

const columns = [
  {
    title: '参数标识',
    dataIndex: 'id',
    key: 'id'
  },
  {
    title: '类型',
    dataIndex: 'dataType',
    key: 'dataType',
    className: props.preview ? 'small-padding-cell' : ''
  },
  {
    title: '参数名字',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description'
  }
]

const inputColumns = columns.filter((item) => item.dataIndex !== 'select')
const outputColumns = props.preview ? inputColumns : columns

const inputDataSource = ref<any[]>([])
const outputDataSource = ref<any[]>([])

const handleInputSelectedChange = (data: any[]) => {
  inputDataSource.value = cloneDeep(data)
}

const handleOutputExpandChange = (data: any[]) => {
  outputDataSource.value = cloneDeep(data)
}

const validateCommandParams = async () => {
  let hasError
  hasError = CommandTableInputRef.value.validateAllData()
  if (hasError) {
    onlyMessage('请检查命令入参配置', 'error')
    return false
  }

  hasError = CommandTableOutputRef.value.validateAllData()
  if (hasError) {
    onlyMessage('请检查命令返回响应配置', 'error')
    return false
  }

  return {
    input: CommandTableInputRef.value.tableData,
    output: CommandTableOutputRef.value.selectedOutputTreeData
  }
}

watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        inputDataSource.value = isArray(newVal.input) ? newVal.input : []
        outputDataSource.value = isArray(newVal.output) ? newVal.output : []

        // 只在初始化时全选
        nextTick(() => {
          CommandTableOutputRef.value?.selectAll()
        })
      }
    },
    {deep: true, immediate: true}
)

defineExpose({
  validateCommandParams
})
</script>

<style scoped>
.command-config-container {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-section {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.config-table {
  border-radius: 4px;
  margin-top: 16px;
}
</style>
