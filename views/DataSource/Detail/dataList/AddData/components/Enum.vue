<template>
  <div class="content-warp">
    <a-table
      :columns="columns"
      :data-source="formData.elements"
      :pagination="false"
      size="small"
      style="height: 200px; width: 100%"
      :scroll="{ y: 130 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'value'">
          <FormItem
            v-model:value="record[column.dataIndex]"
            :placeholder="$t('DataSource.Boolean.100028-2')"
            :disabled="readonly"
            :error="formItemErrors[record.key]?.value"
            @change="(val: string) => handleFieldChange(val, 'value', record)"
          />
        </template>
        <template v-if="column.dataIndex === 'text'">
          <FormItem
            v-model:value="record[column.dataIndex]"
            :placeholder="$t('DataSource.Boolean.100028-1')"
            :disabled="readonly"
            :error="formItemErrors[record.key]?.text"
            @change="(val: string) => handleFieldChange(val, 'text', record)"
          />
        </template>
        <template v-if="column.dataIndex === 'operate'">
          <a-button
            type="link"
            danger
            @click="handleDelete(index)"
          >
            <template #icon>
              <a-tooltip :title="$t('DataSource.Enum.100030-0')">
                <AIcon type="DeleteOutlined" />
              </a-tooltip>
            </template>
          </a-button>
        </template>
      </template>
    </a-table>
    <a-button
      @click="handleAdd"
      style="width: 100%"
      v-if="!readonly"
    >
      <template #icon>
        <AIcon type="PlusOutlined" />
      </template>
      {{ $t('DataSource.Enum.100030-1') }}
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import { useI18n } from 'vue-i18n'
import FormItem from '../../../../components/FormItem.vue'
import { randomString } from '@jetlinks-web/utils'

const { t: $t } = useI18n()
const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { data, readonly } = toRefs(props)

const formData = reactive({ elements: [] as any[] })
const formItemErrors = ref<Record<string, Record<string, string>>>({})

const columns = computed(() => [
  {
    title: $t('DataSource.Enum.100030-2'),
    key: 'value',
    dataIndex: 'value',
    width: '45%',
    componentType: 'input'
  },
  {
    title: $t('DataSource.Enum.100030-3'),
    key: 'text',
    dataIndex: 'text',
    width: '45%',
    componentType: 'input'
  },
  {
    title: $t('DataSource.table.100003-8'),
    key: 'operate',
    dataIndex: 'operate',
    width: '10%'
  }
])

const handleAdd = () => {
  formData.elements?.push({ value: '', text: '', key: randomString(6) })
}

const handleDelete = (index: number) => {
  formData.elements?.splice(index, 1)
  if (!formData.elements.length) {
    handleAdd()
  }
}

const validateField = (value: string, field: 'value' | 'text'): string => {
  if (!value) {
    return field === 'value' ? $t('DataSource.Boolean.100028-2') : $t('DataSource.Boolean.100028-1')
  }
  if (value.length > 64) {
    return $t('DataSource.SourceAdd.100005-4')
  }
  return ''
}

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

const handleFieldChange = (val: string, field: 'value' | 'text', record: any) => {
  record[field] = val
  const err = validateField(val, field)
  updateFormError(record.key, field, err)
}

const validateData = (): boolean => {
  formItemErrors.value = {}
  let hasError = false

  if (!formData.elements?.length) {
    return true
  }

  for (const record of formData.elements) {
    if ((record.value && !record.text) || (!record.value && record.text)) {
      if (!record.value) {
        hasError = true
        updateFormError(record.key, 'value', $t('DataSource.Boolean.100028-2'))
      }
      if (!record.text) {
        hasError = true
        updateFormError(record.key, 'text', $t('DataSource.Boolean.100028-1'))
      }
    }

    const valueErr = validateField(record.value, 'value')
    const textErr = validateField(record.text, 'text')

    if (valueErr) {
      hasError = true
      updateFormError(record.key, 'value', valueErr)
    }
    if (textErr) {
      hasError = true
      updateFormError(record.key, 'text', textErr)
    }
  }

  return !hasError
}

const getData = async () => {
  const isValid = validateData()
  if (!isValid) {
    return {
      error: $t('DataSource.Enum.100030-4')
    }
  } else {
    const filteredElements = formData.elements.filter((item) => item.value || item.text)
    return { elements: filteredElements, type: 'enum' }
  }
}

const setData = (data: object) => {
  Object.assign(formData, cloneDeep(data))
  if (!formData.elements.length) {
    handleAdd()
  }
}

watch(
  data,
  () => {
    setData(data.value)
  },
  { immediate: true }
)

onMounted(() => {
  if (readonly.value) {
    columns.value[0].width = '50%'
    columns.value[1].width = '50%'
    columns.value.splice(2, 1)
  }
})

defineExpose({
  getData,
  setData
})
</script>

<style scoped lang="less">
.content-warp {
  width: 500px;
}
</style>
