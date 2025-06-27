<template>
  <a-modal
    :visible="modelVisible"
    :title="title"
    :maskClosable="false"
    width="416px"
    :bodyStyle="{ padding: '20px 20px 8px 20px' }"
    @cancel="handleCancel"
    @ok="handleOk"
    class="category-modal"
  >
    <a-form
      :model="formState"
      ref="formRef"
      autocomplete="off"
      layout="vertical"
      class="category-form"
    >
      <a-form-item
        label="分类名称"
        :name="labelKey"
        :rules="[
          { required: true, message: '请输入分类名称' },
          { max: 64, message: '最多可输入64个字符', trigger: 'blur' },
          {
            validator: spaceValidator,
            trigger: 'blur'
          },
          ...labelRules
        ]"
      >
        <a-input
          v-model:value="formState[labelKey]"
          placeholder="请输入分类名称"
        />
      </a-form-item>

      <a-form-item
        v-if="showId"
        label="分类标识"
        :name="valueKey"
        :rules="[
          { max: 64, message: '最多可输入64个字符', trigger: 'change' },
          {
            pattern: /^[a-z][a-zA-Z0-9_]*$/,
            message: '只能以小写字母开头且由数字、字母、下划线组成',
            trigger: 'change'
          },
          { validator: labelKeyValidator, trigger: 'blur' },
          ...valueRules
        ]"
      >
        <a-input
          v-model:value="formState[valueKey]"
          placeholder="不填则自动生成"
          :disabled="!!formState[idKey]"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Rule } from 'ant-design-vue/es/form'
import { spaceValidator } from '@datasoureceManager/utils/utils'
import { queryDicItemNoPage } from '@datasoureceManager/api/system/dictionary'

defineOptions({
  name: 'CategoryModal'
})

const props = defineProps<{
  visible: boolean
  title: string
  formState: Record<string, any>
  labelKey: string
  valueKey: string
  idKey: string
  labelRules: Rule[]
  valueRules: Rule[]
  showId: boolean
}>()

const emit = defineEmits(['update:visible', 'ok'])

const formRef = ref()

// 内部响应式状态，用于同步visible属性
const modelVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const handleCancel = () => {
  emit('update:visible', false)
}

const handleOk = async () => {
  try {
    await formRef.value?.validate()
    emit('ok')
  } catch (error) {
    // 表单验证失败
    return
  }
}

/**
 * 验证分类标识是否重复
 */
const labelKeyValidator = async (_: Rule, value: string) => {
  if (!props.formState[props.idKey] && value) {
    const res = await queryDicItemNoPage({
      paging: false,
      terms: [{ column: 'value', termType: 'eq', value: value }]
    })
    if (res.success && res.result?.length) {
      return Promise.reject('标识重复')
    }
  }
  return Promise.resolve()
}

// 重置表单
const reset = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 表单验证
const validate = () => {
  if (formRef.value) {
    return formRef.value.validate()
  }
  return Promise.resolve()
}

defineExpose({
  reset,
  validate
})
</script>

<style lang="less" scoped>
.category-modal {
  :deep(.ant-modal-body) {
    padding: 20px 20px 8px 20px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
}

.category-form {
  width: 100%;
}
</style>
