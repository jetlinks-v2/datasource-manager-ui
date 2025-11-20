<template>
  <div>
    <a-table
      :data-source="tableData"
      :columns="filteredColumns"
      :pagination="false"
      row-key="key"
      :row-selection="multiple ? rowSelection : undefined"
      :showExpandColumn="showExpandColumn"
      :expanded-row-keys="expandedRowKeys"
      @expand="onExpand"
      bordered
      size="small"
      :scroll="scroll"
      style="min-height: 200px"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- ID / Name 列 -->
        <template v-if="column.dataIndex === 'id' || column.dataIndex === 'name'">
          <template v-if="!preview">
            <FormItem
              :error="formItemErrors[record.key]?.[column.dataIndex]"
              :value="record[column.dataIndex]"
              :placeholder="placeholders[column.dataIndex]"
              @blur="(val) => handleFieldChange(val, column.dataIndex, record)"
            />
          </template>
          <template v-else>
            <j-ellipsis>{{ record[column.dataIndex] }}</j-ellipsis>
          </template>
        </template>

        <!-- 说明列 -->
        <template v-else-if="column.dataIndex === 'description'">
          <a-input
            v-if="!preview"
            v-model:value="record[column.dataIndex]"
            :placeholder="placeholders[column.dataIndex]"
            :maxlength="200"
            @blur="() => handleInputChange(record, column.dataIndex)"
          />
          <j-ellipsis v-else>{{ record[column.dataIndex] }}</j-ellipsis>
        </template>

        <!-- 数据类型列 -->
        <template v-else-if="column.dataIndex === 'dataType'">
          <DataTypeCell
            :record="record"
            :index="index"
            :has-error="!!formItemErrors[record.key]?.dataType"
            :error-message="formItemErrors[record.key]?.dataType"
            :popover-visible="popoverVisible[record.key]"
            :mode="mode"
            :disabled="record.disabled || preview"
            @update:data-type="(newType) => handleDataTypeUpdate(record, newType)"
            @update:popover-visible="(visible) => updatePopoverVisible(record.key, visible)"
            @verify="() => handleVerify(record)"
          />
        </template>

        <!-- 操作列 -->
        <template v-else-if="column.dataIndex === 'operate'">
          <a-button
            v-if="!preview"
            type="link"
            danger
            @click="() => handleDelete(index)"
          >
            <AIcon type="DeleteOutlined" />
          </a-button>
        </template>
      </template>
    </a-table>

    <div
      v-if="addButton && !preview"
      class="add-button-wrapper"
    >
      <a-button
        type="dashed"
        block
        @click="handleAdd"
      >
        <AIcon type="PlusOutlined" />
        新增参数
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep, isArray } from 'lodash-es'
import { ParamsSpec } from '../../type'
import DataTypeCell from './DataTypeCell.vue'
import FormItem from '@datasource-manager-ui/views/DataSource/components/FormItem.vue'
import { randomString } from '@jetlinks-web/utils'
import { useDataTypeManagement } from './setting'

const props = defineProps({
  mode: {
    type: String as PropType<'treeTable' | 'defaultTable'>,
    default: 'defaultTable'
  },
  dataSource: {
    type: Array as PropType<ParamsSpec[]>,
    default: () => []
  },
  columns: {
    type: Array as any,
    default: () => []
  },
  addButton: {
    type: Boolean,
    default: false
  },
  preview: {
    type: Boolean,
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  scroll: {
    type: Object,
    default: () => ({ y: 372 })
  },
  showExpandColumn: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update', 'selectedChange'])

const { validateDataType } = useDataTypeManagement()

// 数据状态
const tableData = ref<any[]>([])
const formItemErrors = ref<Record<string, Record<string, string>>>({})
const popoverVisible = ref<Record<string, boolean>>({})
const placeholders: Record<string, string> = {
  id: '请输入标识',
  name: '请输入名称',
  description: '请输入说明'
}

// 根据预览模式过滤列
const filteredColumns = computed(() => {
  if (props.preview) {
    return props.columns.filter((col: any) => col.dataIndex !== 'operate')
  }
  return props.columns
})

const selectedKeys = ref<(string | number)[]>([])
const rowSelection = computed(() => ({
  checkStrictly: false,
  selectedRowKeys: selectedKeys.value,
  onChange: (keys: (string | number)[], rows: any[]) => {
    selectedKeys.value = keys
    formItemErrors.value = {}
    firstErrorInfo.value = null
    selectedOutputTreeData.value.forEach((record) => {
      validateRecord(record, [])
    })
  }
}))

const selectedOutputTreeData = computed(() => {
  return filterTree(tableData.value, selectedKeys.value)
})

const expandedRowKeys = ref<string[]>([])
const firstErrorInfo = ref<{
  key: string
  field: string
  path: string[]
} | null>(null)

// 用于重建树形结构的递归函数
const filterTree = (nodes: any[], selectedKeys: (string | number)[]): any[] => {
  const result: any[] = []
  for (const node of nodes) {
    let children: any[] | undefined
    if (node.children) {
      children = filterTree(node.children, selectedKeys)
    }
    if (selectedKeys.includes(node.key) || (children && children.length > 0)) {
      const newNode: any = {
        ...node,
        ...(children && children.length > 0 ? { children } : {})
      }
      result.push(newNode)
    }
  }
  return result
}

// 更新错误映射
const updateFormError = (recordKey: string, field: string, error?: string): boolean => {
  if (!formItemErrors.value[recordKey]) {
    formItemErrors.value[recordKey] = {}
  }
  if (error) {
    formItemErrors.value[recordKey][field] = error
    return true
  }
  delete formItemErrors.value[recordKey][field]
  if (!Object.keys(formItemErrors.value[recordKey]).length) {
    delete formItemErrors.value[recordKey]
  }
  return false
}

const validateField = (field: string, value: string): string => {
  if (!value) {
    return field === 'id' ? '请输入参数标识' : '请输入参数名称'
  }
  if (field === 'id') {
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return '只能输入英文、数字、-或_'
    if (value.length > 64) return '参数标识长度不能超过64个字符'
  }
  if (field === 'name' && value.length > 64) {
    return '参数名称长度不能超过64个字符'
  }
  return ''
}

const handleFieldChange = (value: string, field: any, record: any) => {
  record[field] = value
  const err = validateField(field, value)
  const hasErr = updateFormError(record.key, field, err)
  if (!hasErr) {
    emit('update', tableData.value)
  }
}

const handleInputChange = (record: any, dataIndex: any) => {
  updateFormError(record.key, dataIndex)
  emit('update', tableData.value)
}

const handleAdd = () => {
  tableData.value.push({
    id: '',
    name: '',
    dataType: { type: 'string' },
    key: randomString(6)
  })
}

const handleDelete = (index: number) => {
  tableData.value.splice(index, 1)
  emit('update', tableData.value)
}

// 数据类型更新
const handleDataTypeUpdate = (record: any, newDataType: any) => {
  if (newDataType.type === 'object') {
    record.children = newDataType.properties.map((item: any) => ({
      ...item,
      key: item.key || item.id
    }))
  } else if (newDataType.type === 'array') {
    if (newDataType.elementType.type === 'object') {
      record.children =
        newDataType.elementType.properties?.map((item: any) => ({
          ...item,
          key: item.key || item.id
        })) || []
    } else {
      delete record.children
      delete newDataType.elementType.properties
    }
  } else {
    delete record.children
  }
  record.dataType = newDataType
  handleVerify(record)
}

const updatePopoverVisible = (recordKey: string, visible: boolean) => {
  popoverVisible.value[recordKey] = visible
}

const validateRecord = (record: any, path: string[] = []): boolean => {
  // if (!record.id && !record.name && !record.description) {
  //   return false
  // }

  let hasErr = false
  const currentPath = [...path, record.key]

  // 验证必填字段
  if (!record.id) {
    hasErr = true
    updateFormError(record.key, 'id', '请输入参数标识')
    // 记录第一个错误
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'id',
        path: currentPath
      }
    }
  }

  if (record.id && record.id.length > 64) {
    hasErr = true
    updateFormError(record.key, 'id', '参数标识长度不能超过64个字符')
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'id',
        path: currentPath
      }
    }
  }

  if (record.id && !/^[a-zA-Z0-9_-]+$/.test(record.id)) {
    hasErr = true
    updateFormError(record.key, 'id', '只能输入英文、数字、-或_')
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'id',
        path: currentPath
      }
    }
  }

  if (!record.name) {
    hasErr = true
    updateFormError(record.key, 'name', '请输入参数名称')
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'name',
        path: currentPath
      }
    }
  }

  if (record.name && record.name.length > 64) {
    hasErr = true
    updateFormError(record.key, 'name', '参数名称长度不能超过64个字符')
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'name',
        path: currentPath
      }
    }
  }

  const dtErr = validateDataType(record, props.mode)
  if (dtErr) {
    hasErr = true
    updateFormError(record.key, 'dataType', dtErr)
    if (!firstErrorInfo.value) {
      firstErrorInfo.value = {
        key: record.key,
        field: 'dataType',
        path: currentPath
      }
    }
  }

  if (isArray(record.children)) {
    record.children.forEach((child: any) => {
      if (validateRecord(child, currentPath)) {
        hasErr = true
      }
    })
  }

  return hasErr
}

// 验证所有
const validateAllData = () => {
  formItemErrors.value = {}
  firstErrorInfo.value = null
  let anyError = false

  const data = props.multiple ? selectedOutputTreeData.value : tableData.value

  data.forEach((r) => {
    if (validateRecord(r, [])) {
      anyError = true
    }
  })

  // 如果有错误，定位到第一个错误
  if (firstErrorInfo.value) {
    locateToError(firstErrorInfo.value)
  }

  return anyError
}

// 展开到指定节点的函数
const expandToNode = (path: string[]) => {
  const expandedKeys: string[] = []

  path.forEach((key, index) => {
    if (index < path.length - 1) {
      expandedKeys.push(key)
    }
  })

  expandedRowKeys.value = expandedKeys
}

// 定位到错误的函数
const locateToError = (errorInfo: { key: string; field: string; path: string[] }) => {
  expandToNode(errorInfo.path)

  nextTick(() => {
    const errorElement = document.querySelector(`[data-row-key="${errorInfo.key}"]`)
    if (errorElement) {
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      errorElement.classList.add('error-highlight')
      setTimeout(() => {
        errorElement.classList.remove('error-highlight')
      }, 3000)
    }
  })
}

const onExpand = (expanded: boolean, record: any) => {
  if (expanded) {
    expandedRowKeys.value.push(record.key)
  } else {
    const index = expandedRowKeys.value.indexOf(record.key)
    if (index > -1) {
      expandedRowKeys.value.splice(index, 1)
    }
  }
}

// DataTypeCell 触发验证
const handleVerify = (record: any) => {
  const err = validateDataType(record, props.mode)
  updateFormError(record.key, 'dataType', err)
  emit('update', tableData.value)
}

const selectAll = () => {
  // 获取所有节点的key
  const getKeys = (data: any[]): string[] =>
    data.reduce(
      (keys: string[], item) => [
        ...keys,
        ...(item.key ? [String(item.key)] : []),
        ...(item.children?.length ? getKeys(item.children) : [])
      ],
      []
    )
  if (tableData.value.length) {
    selectedKeys.value = getKeys(tableData.value)
  }
}

const handleDataType = (item: any) => {
  const type = item.dataType?.type
  if (type) {
    if (type === 'object') {
      return {
        ...item.dataType,
        properties: item.children
      }
    }

    if (type === 'array') {
      if (item.dataType.elementType.type === 'object') {
        return {
          ...item.dataType,
          elementType: {
            ...item.dataType.elementType,
            properties: item.children
          }
        }
      }
    }
  }
  return item.dataType ? item.dataType : { type: 'int' }
}

// 监听 dataSource
watch(
  () => props.dataSource,
  (newData) => {
    if (!isArray(newData)) return
    tableData.value = cloneDeep(newData).map((item: any) => {
      const rec: any = {
        ...item,
        key: item.key || item.id,
        dataType: handleDataType(item)
      }
      if (isArray(rec.children)) {
        rec.children = rec.children.map((child: any) => ({
          ...child,
          key: child.key || child.id
        }))
      }
      return rec
    })
  },
  { deep: true, immediate: true }
)

defineExpose({ tableData, validateAllData, selectedOutputTreeData, selectAll })
</script>

<style scoped lang="less">
:deep(.table-striped) {
  background-color: #fafafa;
}

:deep(.ant-table-cell-with-append) {
  display: flex;
  align-items: center;
}

:deep(.ant-table-row-expand-icon) {
  min-width: 16px !important;
  max-width: 16px !important;
  text-align: center;
}

.add-button-wrapper {
  margin-top: 10px;
}

:deep(.error-highlight) {
  animation: highlight 1s ease-in-out;
}

@keyframes highlight {
  0% {
    background-color: transparent;
  }
  50% {
    background-color: #fff2e8;
  }
  100% {
    background-color: transparent;
  }
}

:deep(.small-padding-cell) {
  padding: 6px 8px !important;
}
</style>
