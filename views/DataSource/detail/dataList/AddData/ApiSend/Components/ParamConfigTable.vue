<template>
  <div>
    <a-table
      :data-source="tableData"
      :columns="columns"
      :pagination="false"
      size="small"
      rowKey="uid"
      bordered
      :scroll="{ y: 260 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'enable'">
          <a-checkbox
            v-model:checked="record.enable"
            @change="handleEnableChange(record, index)"
          />
        </template>

        <template v-if="column.dataIndex === 'key'">
          <FormItem
            :error="formErrors[index]?.key"
            :value="record.key"
            placeholder="请输入键名"
            @change="(val) => handleFieldChange(val, 'key', record, index)"
          />
        </template>

        <template v-if="column.dataIndex === 'value'">
          <FormItem
            :error="formErrors[index]?.value"
            :value="record.value"
            placeholder="请输入值"
            @change="(val) => handleFieldChange(val, 'value', record, index)"
          />
        </template>

        <template v-if="column.dataIndex === 'description'">
          <FormItem
            :error="formErrors[index]?.description"
            :value="record.description"
            placeholder="请输入描述"
            @change="(val) => handleFieldChange(val, 'description', record, index)"
          />
        </template>

        <template v-if="column.dataIndex === 'operate'">
          <a-button
            type="link"
            danger
            @click="handleDelete(index)"
          >
            <DeleteOutlined />
          </a-button>
        </template>
      </template>
    </a-table>

    <div class="add-button-wrapper">
      <a-button
        type="dashed"
        block
        @click="handleAdd"
      >
        <PlusOutlined />
        新增参数
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue'
import { cloneDeep } from 'lodash-es'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { DEFAULT_PARAM_ITEM, type ParamItem } from './setting'
import FormItem from '../../../../../components/FormItem.vue'

const props = defineProps<{
  dataSource: ParamItem[]
  columns: TableColumnType<ParamItem>[]
  isValid?: boolean
}>()

const emit = defineEmits<{
  update: [data: ParamItem[]]
}>()

const tableData = ref<ParamItem[]>([])
const formErrors = ref<Record<number, Record<string, string>>>({})

type ValidatorKey = 'key' | 'value' | 'description'
type ValidatorFn = (value: string, record: ParamItem, index: number) => string

// 验证规则
const validators: Record<ValidatorKey, ValidatorFn> = {
  key: (value: string, record: ParamItem, index: number) => {
    if (!value) return '请输入键名'
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value) && !/^\{\{(.*?)\}\}$/.test(value)) {
      return '只能以字母开头，可包含数字、下划线或连字符'
    }
    if (tableData.value.some((item, idx) => idx !== index && item.key === value)) {
      return '键名重复'
    }
    if (value.length > 64) return '键名长度不能超过64个字符'
    return ''
  },
  value: (value: string) => {
    // if (!value) return '请输入值'
    if (value.length > 64) return '值长度不能超过64个字符'
    return ''
  },
  description: (value: string) => {
    if (value.length > 200) return '描述长度不能超过200个字符'
    return ''
  }
}

// 验证单个字段
const validateField = (field: ValidatorKey, record: ParamItem, index: number) => {
  if (!props.isValid) return true
  if (!record.enable) return true

  const error = validators[field](record[field] || '', record, index)
  if (error) {
    formErrors.value[index] = { ...formErrors.value[index], [field]: error }
    return false
  }

  if (formErrors.value[index]) {
    delete formErrors.value[index][field]
    if (Object.keys(formErrors.value[index]).length === 0) {
      delete formErrors.value[index]
    }
  }
  return true
}

// 验证所有数据
const validateAll = () => {
  let isValid = true
  tableData.value.forEach((record, index) => {
    const keyValid = validateField('key', record, index)
    const valueValid = validateField('value', record, index)
    const descriptionValid = validateField('description', record, index)
    if (!keyValid || !valueValid || !descriptionValid) isValid = false
  })
  return isValid
}

// 处理字段变更
const handleFieldChange = (value: string, field: ValidatorKey, record: ParamItem, index: number) => {
  // 如果是首次输入值且当前未启用，则自动勾选
  if (
    (field === 'value' && value && !record.value && !record.enable) ||
    (field === 'key' && value && !record.key && !record.enable)
  ) {
    record.enable = true
    validateField('key', record, index)
  }

  record[field] = value
  validateField(field, record, index)
  emitUpdate()
}

// 处理启用状态变更
const handleEnableChange = (record: ParamItem, index: number) => {
  if (record.enable) {
    validateField('key', record, index)
    validateField('value', record, index)
    validateField('description', record, index)
  } else {
    delete formErrors.value[index]
  }
  emitUpdate()
}

// 添加新行
const handleAdd = () => {
  const newItem = { ...DEFAULT_PARAM_ITEM }
  tableData.value.push(newItem)
  emitUpdate()
}

// 删除行
const handleDelete = (index: number) => {
  tableData.value.splice(index, 1)
  delete formErrors.value[index]
  emitUpdate()
}

// 发送更新事件
const emitUpdate = () => {
  emit('update', cloneDeep(tableData.value))
}

// 监听数据源变化
watch(
  () => props.dataSource,
  (newData) => {
    if (!newData?.length) {
      tableData.value = [{ ...DEFAULT_PARAM_ITEM }]
    } else {
      tableData.value = newData.map((item) => item)
    }
  },
  { immediate: true, deep: true }
)

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.add-button-wrapper {
  margin-top: 16px;
}

:deep(.ant-table-cell) {
  padding: 8px !important;
}
</style>
