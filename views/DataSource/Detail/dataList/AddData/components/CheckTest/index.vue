<template>
  <div class="check-test-warp">
    <div class="header">
      <TitleComponent
        data="动态参数"
        class="section-title"
      />
      <slot name="sendOutButton" />
    </div>
    <a-table
      :columns="responseTreeTableColumns"
      :data-source="dynamicParams"
      :pagination="false"
      size="small"
      bordered
      class="params-table"
      :scroll="{ y: 260 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'value'">
          <FormItem
            :error="formErrors[index]?.value"
            :value="record.value"
            placeholder="请输入参数值"
            @change="(val) => handleFieldChange(val, 'value', record)"
          />
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import FormItem from '@datasource-manager-ui/views/DataSource/components/FormItem.vue'

interface ParamItem {
  name: string
  value: string
}

const props = defineProps({
  formData: {
    type: Object,
    required: true
  },
  queryParams: {
    type: Object,
    default: {
      query: [],
      headers: [],
      body: [],
      uri: []
    }
  },
  historyParams: {
    type: Object,
    default: () => ({})
  }
})

type ValidatorKey = 'value'
type ValidatorFn = (value: string, record: ParamItem, index: number) => string

const responseTreeTableColumns = [
  {
    title: '参数名',
    dataIndex: 'name',
    key: 'name',
    width: '20%',
    ellipsis: true
  },
  {
    title: '参数值',
    dataIndex: 'value',
    key: 'value'
  }
]

const emit = defineEmits(['update:data'])
const dynamicParams = ref<ParamItem[]>([])
const formErrors = ref<Record<number, Record<string, string>>>({})

const validators: Record<ValidatorKey, ValidatorFn> = {
  value: (value: string) => {
    // if (!value?.trim()) return '请输入值'
    if (value.length > 64) return '值长度不能超过64个字符'
    return ''
  }
}

// 验证单个字段
const validateField = (field: ValidatorKey, record: ParamItem, index: number) => {
  const error = validators[field](record[field], record, index)

  if (error) {
    formErrors.value = {
      ...formErrors.value,
      [index]: {
        ...formErrors.value[index],
        [field]: error
      }
    }
    return false
  }

  // 清除错误
  if (formErrors.value[index]) {
    const newErrors = { ...formErrors.value[index] }
    delete newErrors[field]

    if (Object.keys(newErrors).length === 0) {
      const { [index]: _, ...rest } = formErrors.value
      formErrors.value = rest
    } else {
      formErrors.value = {
        ...formErrors.value,
        [index]: newErrors
      }
    }
  }

  return true
}

// 验证所有字段
const validateAll = () => {
  let isValid = true
  formErrors.value = {}

  dynamicParams.value.forEach((record, index) => {
    if (!validateField('value', record, index)) {
      isValid = false
    }
  })

  return isValid
}

const handleFieldChange = (value: string, field: ValidatorKey, record: any) => {
  record[field] = value
  emit('update:data', dynamicParams.value)
}

const init = () => {
  if (!props.queryParams) return

  const mergedUniqueParams = Array.from(
    new Map(
      Object.values(props.queryParams)
        .flat() // 展开所有数组
        .map((param) => [param.key, param]) // 按照 key 进行去重
    ).values()
  )

  const existingValues = new Map<string, string>()
  dynamicParams.value?.forEach((item) => {
    if (item?.name) {
      existingValues.set(item.name, item.value || '')
    }
  })

  dynamicParams.value = mergedUniqueParams.map((param) => ({
    name: param.key,
    value: existingValues.get(param.key) ?? props.historyParams?.[param.key] ?? ''
  })) as ParamItem[]

  emit('update:data', dynamicParams.value)
}

watch(
  () => props.queryParams,
  () => {
    init()
  },
  { immediate: true, deep: true }
)

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.check-test-warp {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .header {
    display: flex;
    justify-content: space-between;
  }
}

.section-title {
  margin: 0;
}

.params-table {
  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 16px;
  }
}
</style>
