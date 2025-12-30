<template>
  <div class="basic-form">
    <a-form-item
      :label="$t('DataSource.table.100003-2')"
      name="support"
      :rules="rules.support"
    >
      <a-input
        :value="modelValue.support"
        :placeholder="$t('DataSource.BasicForm.100017-0')"
        :maxlength="64"
        :disabled="isEdit"
        @change="(e) => handleFieldChange('support', e.target.value)"
      />
    </a-form-item>

    <a-form-item
      :label="$t('DataSource.table.100003-0')"
      name="name"
      :rules="rules.name"
    >
      <a-input
        :value="modelValue.name"
        :placeholder="$t('DataSource.BasicForm.100017-1')"
        :maxlength="64"
        @change="(e) => handleFieldChange('name', e.target.value)"
      />
    </a-form-item>

    <a-form-item
      :label="$t('DataSource.table.100003-6')"
      name="description"
    >
      <a-textarea
        :value="modelValue.description"
        :maxlength="200"
        :placeholder="$t('DataSource.table.100003-7')"
        @change="(e) => handleFieldChange('description', e.target.value)"
      />
    </a-form-item>

    <CommandParams
      v-if="!isMetadataSource"
      ref="commandParamsRef"
      :modelValue="commandModelValue"
    />
  </div>
</template>

<script setup lang="ts" name="BasicForm">
import { checkCommandExists } from '@datasource-manager-ui/api/data/datasource'
import type { Rule } from 'ant-design-vue/es/form'
import CommandParams from './CommandParams/index.vue'
import { set } from 'lodash-es'
import { DATA_TYPE_ITEM } from '../../../../components/table'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  testData: {
    type: Object,
    default: () => ({})
  },
  dynamicParams: {
    type: [Array, Object],
    default: () => []
  },
  sourceClassify: {
    type: String,
    default: ''
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update'])
const commandParamsRef = ref()
const commandModelValue = ref<any>({
  input: [],
  output: []
})

const isMetadataSource = computed(
  () =>
    props.sourceClassify === DATA_TYPE_ITEM.RDB_DATASOURCE ||
    props.sourceClassify === DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE ||
    props.modelValue.configuration.provider === 'generalQuery'
)

const validateID = async (_: Rule, value: string) => {
  if (value && !props.isEdit) {
    try {
      const resp = await checkCommandExists({
        terms: [
          {
            column: 'dataSourceId',
            termType: 'eq',
            value: props.modelValue.dataSourceId
          },
          {
            column: 'support',
            termType: 'eq',
            value: value
          }
        ]
      })
      if (resp.success) {
        if (resp.result) {
          return Promise.reject($t('DataSource.BasicForm.100017-6'))
        }
      }
      return Promise.resolve()
    } catch (error) {
      return Promise.reject($t('DataSource.BasicForm.100017-7'))
    }
  }
  return Promise.resolve()
}

const rules = computed(() => ({
  name: [{ required: true, message: $t('DataSource.BasicForm.100017-1'), trigger: 'blur' }] as Rule[],
  support: [
    { required: true, message: $t('DataSource.BasicForm.100017-0'), trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: $t('DataSource.BasicForm.100017-8'),
      trigger: 'blur'
    },
    { validator: validateID, trigger: 'blur' }
  ] as Rule[]
}))

const handleFieldChange = (fieldPath: string, value: any) => {
  const updatedValue = { ...props.modelValue }
  set(updatedValue, fieldPath, value)
  emit('update', updatedValue)
}

const getFormData = async () => {
  //RDB 和 ES 和 mangodb的一般查询不需要验证命令参数
  if (isMetadataSource.value) {
    return props.modelValue
  }

  const validateResult = await commandParamsRef.value.validateCommandParams()
  if (!validateResult) return
  return {
    ...props.modelValue,
    configuration: {
      ...props.modelValue.configuration,
      input: validateResult.input,
      output: validateResult.output
    }
  }
}

watch(
  () => props.dynamicParams,
  (computedInput) => {
    commandModelValue.value.input = computedInput || []
  },
  { deep: true, immediate: true }
)

watch(
  () => props.testData,
  (computedOutput) => {
    commandModelValue.value.output = computedOutput || []
  },
  { deep: true, immediate: true }
)

defineExpose({
  getFormData
})
</script>

<style scoped lang="less">
.basic-form {
  width: 100%;
}
</style>
