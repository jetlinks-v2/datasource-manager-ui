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

    <template v-if="!isRdb">
      <a-form-item
        :label="$t('DataSource.BasicForm.100017-2')"
        :name="['configuration', 'commandId']"
        :rules="rules.configuration.commandId"
      >
        <a-input
          :value="modelValue.configuration.commandId"
          :placeholder="$t('DataSource.BasicForm.100017-3')"
          :maxlength="64"
          @change="(e) => handleFieldChange('configuration.commandId', e.target.value)"
        />
      </a-form-item>

      <a-form-item
        :label="$t('DataSource.BasicForm.100017-4')"
        :name="['configuration', 'commandName']"
        :rules="rules.configuration.commandName"
      >
        <a-input
          :value="modelValue.configuration.commandName"
          :placeholder="$t('DataSource.BasicForm.100017-5')"
          :maxlength="64"
          @change="(e) => handleFieldChange('configuration.commandName', e.target.value)"
        />
      </a-form-item>
    </template>

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
      v-if="!isRdb"
      ref="commandParamsRef"
      :modelValue="commandModelValue"
    />
  </div>
</template>

<script setup lang="ts" name="BasicForm">
import { checkCommandExists } from '@datasource-manager-ui/api/data/datasource'
import type { Rule } from 'ant-design-vue/es/form'
import { convertToTableTreeData } from '../utils'
import CommandParams from './CommandParams/index.vue'
import { set } from 'lodash-es'
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
  isRdb: {
    type: Boolean,
    default: false
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

const outputData = computed(() => (props.isRdb ? props.testData : convertToTableTreeData(props.testData)))
const inputData = computed(() => (props.isRdb ? props.dynamicParams : convertToTableTreeData(props.dynamicParams)))

const validateID = async (rule: Rule, value: string) => {
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
  ] as Rule[],
  configuration: {
    commandId: [
      { required: true, message: $t('DataSource.BasicForm.100017-3'), trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: $t('DataSource.BasicForm.100017-8'),
        trigger: 'blur'
      }
    ] as Rule[],
    commandName: [{ required: true, message: $t('DataSource.BasicForm.100017-5'), trigger: 'blur' }] as Rule[]
  }
}))

const handleFieldChange = (fieldPath: string, value: any) => {
  const updatedValue = { ...props.modelValue }
  set(updatedValue, fieldPath, value)
  emit('update', updatedValue)
}

const getFormData = async () => {
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
  outputData,
  (newVal) => {
    commandModelValue.value.output = newVal
  },
  { deep: true }
)

watch(
  inputData,
  (newVal) => {
    commandModelValue.value.input = newVal
  },
  { deep: true }
)

watch(
  [() => props.modelValue?.configuration?.input, () => props.modelValue?.configuration?.output],
  ([newInput, newOutput]) => {
    if (newInput) {
      commandModelValue.value.input = newInput
    }
    if (newOutput) {
      commandModelValue.value.output = newOutput
    }
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
