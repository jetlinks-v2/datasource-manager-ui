<template>
  <div>
    <a-table
      :columns="columns"
      :dataSource="modelValue"
      :pagination="false"
      size="small"
      rowKey="id"
    >
      <!-- <template #headerCell="{ column }">
        <template v-if="column.key === 'key'">
          <span class="table-header-title">{{ column.title }}</span>
        </template>
      </template> -->
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'key'">
          <FormItem
            v-model:value="record.key"
            :placeholder="$t('DataSource.HeaderParams.100069-0')"
            :error="formItemErrors[record.id]?.key"
            @change="(val: string) => handleFieldChange(val, 'key', record)"
          />
        </template>
        <template v-else-if="column.key === 'value'">
          <FormItem
            v-model:value="record.value"
            :placeholder="$t('DataSource.HeaderParams.100069-1')"
            :error="formItemErrors[record.id]?.value"
            @change="(val: string) => handleFieldChange(val, 'value', record)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <a-button
            type="text"
            size="small"
            danger
            :disabled="modelValue.length === 1 && !record.key && !record.value"
            @click="() => removeItem(record)"
          >
            <template #icon>
              <AIcon type="DeleteOutlined" />
            </template>
          </a-button>
        </template>
      </template>
    </a-table>
    <a-form-item>
      <a-button
        block
        type="dashed"
        @click="addItem"
      >
        {{ $t('DataSource.HeaderParams.100069-3') }}
      </a-button>
    </a-form-item>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import FormItem from '../../../FormItem.vue'

const { t: $t } = useI18n()

interface Header {
  key: string
  value: string
  id: number
}

const props = defineProps({
  modelValue: {
    type: Array as () => Header[],
    required: true
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'validate'])
const formItemErrors = ref<Record<string | number, Record<string, string>>>({})

//表头
const columns: any[] = [
  {
    title: $t('DataSource.HeaderParams.100069-0'),
    dataIndex: 'key',
    key: 'key'
  },
  {
    title: $t('DataSource.HeaderParams.100069-1'),
    dataIndex: 'value',
    key: 'value'
  },
  {
    title: $t('DataSource.HeaderParams.100069-2'),
    key: 'action',
    align: 'center'
  }
]

const validateField = (value: string): string => {
  if (value && value.length > 256) {
    return $t('DataSource.HeaderParams.100069-4')
  }
  return ''
}

const updateFormError = (recordId: string | number, field: string, error?: string): boolean => {
  if (!formItemErrors.value[recordId]) {
    formItemErrors.value[recordId] = {}
  }
  if (error) {
    formItemErrors.value[recordId][field] = error
    return true
  }
  delete formItemErrors.value[recordId][field]
  if (!Object.keys(formItemErrors.value[recordId]).length) {
    delete formItemErrors.value[recordId]
  }
  return false
}

const handleFieldChange = (val: string, field: 'key' | 'value', record: any) => {
  record[field] = val
  updateFormError(record.id, field)

  const lengthError = validateField(val)
  if (lengthError) {
    updateFormError(record.id, field, lengthError)
  }

  const isKeyField = field === 'key'
  const isValueField = field === 'value'

  if (isValueField && val && !record.key) {
    updateFormError(record.id, 'key', $t('DataSource.HeaderParams.100069-5'))
  }

  if (isKeyField && !val && record.value) {
    updateFormError(record.id, 'key', $t('DataSource.HeaderParams.100069-5'))
  }

  emit('update:modelValue', [...props.modelValue])
}

const removeItem = (item: any) => {
  const index = props.modelValue.indexOf(item)
  if (index === -1) return
  const newValue = [...props.modelValue]
  delete formItemErrors.value[item.id]

  if (newValue.length === 1) {
    newValue[0] = {
      key: '',
      value: '',
      id: Date.now()
    }
  } else {
    newValue.splice(index, 1)
  }

  emit('update:modelValue', newValue)
}

const addItem = () => {
  const newValue = [...props.modelValue]
  newValue.push({
    key: '',
    value: '',
    id: Date.now()
  })
  emit('update:modelValue', newValue)
}

const validate = (): boolean => {
  formItemErrors.value = {}
  let hasError = false

  // 统一校验函数
  const validateRecord = (record: any) => {
    // 只有当value有值时，key才必填
    if (record.value && !record.key) {
      hasError = true
      updateFormError(record.id, 'key', $t('DataSource.HeaderParams.100069-5'))
    }

    // 字段长度校验
    const keyErr = validateField(record.key)
    const valueErr = validateField(record.value)

    if (keyErr) {
      hasError = true
      updateFormError(record.id, 'key', keyErr)
    }
    if (valueErr) {
      hasError = true
      updateFormError(record.id, 'value', valueErr)
    }
  }

  props.modelValue.forEach(validateRecord)
  return !hasError
}

defineExpose({
  validate
})
</script>

<style lang="less" scoped>
// .table-header-title {
//   &::before {
//     display: inline-block;
//     margin-inline-end: 4px;
//     color: #ff4d4f;
//     font-size: 14px;
//     font-family: SimSun, sans-serif;
//     line-height: 1;
//     content: '*';
//   }
// }
</style>
