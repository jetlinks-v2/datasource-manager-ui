<template>
  <div class="basic-form">
    <a-form-item
      label="标识"
      name="support"
      :rules="rules.support"
    >
      <a-input
        :value="modelValue.support"
        placeholder="请输入标识"
        :maxlength="64"
        :disabled="isEdit"
        @change="(e) => handleFieldChange('support', e.target.value)"
      />
    </a-form-item>

    <a-form-item
      label="名称"
      name="name"
      :rules="rules.name"
    >
      <a-input
        :value="modelValue.name"
        placeholder="请输入名称"
        :maxlength="64"
        @change="(e) => handleFieldChange('name', e.target.value)"
      />
    </a-form-item>

    <template v-if="!isRdb">
      <a-form-item
        label="命令标识"
        :name="['configuration', 'commandId']"
        :rules="rules.configuration.commandId"
      >
        <a-input
          :value="modelValue.configuration.commandId"
          placeholder="请输入命令标识"
          :maxlength="64"
          @change="(e) => handleFieldChange('configuration.commandId', e.target.value)"
        />
      </a-form-item>

      <a-form-item
        label="命令名称"
        :name="['configuration', 'commandName']"
        :rules="rules.configuration.commandName"
      >
        <a-input
          :value="modelValue.configuration.commandName"
          placeholder="请输入命令名称"
          :maxlength="64"
          @change="(e) => handleFieldChange('configuration.commandName', e.target.value)"
        />
      </a-form-item>
    </template>

    <a-form-item
      label="说明"
      name="description"
    >
      <a-textarea
        :value="modelValue.description"
        :maxlength="200"
        placeholder="请输入说明"
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
          return Promise.reject('标识重复')
        }
      }
      return Promise.resolve()
    } catch (error) {
      return Promise.reject('验证命令标识失败')
    }
  }
  return Promise.resolve()
}

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }] as Rule[],
  support: [
    { required: true, message: '请输入功能标识', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '命令标识必须以字母开头，且只能包含字母、数字和下划线',
      trigger: 'blur'
    },
    { validator: validateID, trigger: 'blur' }
  ] as Rule[],
  configuration: {
    commandId: [
      { required: true, message: '请输入命令标识', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '命令标识必须以字母开头，且只能包含字母、数字和下划线',
        trigger: 'blur'
      }
    ] as Rule[],
    commandName: [{ required: true, message: '请输入命令名称', trigger: 'blur' }] as Rule[]
  }
}

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
