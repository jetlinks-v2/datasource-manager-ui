<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
    labelAlign="left"
  >
    <a-form-item label="类型">
      <a-input
        :value="datasourceName"
        disabled
      />
    </a-form-item>
    <a-form-item
      label="数据源名称"
      :rules="[
        { required: true, message: '请输入数据源名称', trigger: 'blur' },
        { max: 64, message: '最多可输入64个字符', trigger: 'change' },
        {
          validator: spaceValidator,
          trigger: 'blur'
        }
      ]"
      :validateFirst="true"
      name="name"
    >
      <a-input
        v-model:value="formData.name"
        placeholder="请输入数据源名称"
      />
    </a-form-item>
    <a-form-item
      :rules="[
        { max: 64, message: '最多可输入64个字符', trigger: 'change' },
        {
          pattern: /^[a-z][a-zA-Z0-9_]*$/,
          message: '只能以小写字母开头且由数字、字母、下划线组成',
          trigger: 'change'
        },
        {
          validator: labelKeyValidator,
          trigger: 'blur'
        }
      ]"
      name="id"
      label="数据源标识"
    >
      <a-input
        v-model:value="formData.id"
        placeholder="不填则自动生成"
        :disabled="isEditor"
      />
    </a-form-item>
    <a-form-item
      label="分类"
      name="group"
      :rules="[{ required: true, message: '请选择分类' }]"
    >
      <div class="select-with-button">
        <a-select
          v-model:value="formData.group"
          placeholder="请选择分类"
          allow-clear
        >
          <a-select-option
            v-for="item in categoryList"
            :key="item.id"
            :value="item.id"
          >
            {{ item.name }}
          </a-select-option>
        </a-select>
        <j-permission-button
          type="dashed"
          :hasPermission="`${permission}:add_class`"
          @click="handleAddCategory"
        >
          <template #icon>
            <AIcon type="PlusOutlined" />
          </template>
        </j-permission-button>
      </div>
    </a-form-item>
    <a-form-item
      :rules="[{ max: 200, message: '最多可输入200个字符' }]"
      :validateFirst="true"
      name="description"
      label="说明"
    >
      <a-textarea
        v-model:value="formData.description"
        placeholder="请输入说明"
        :rows="3"
      />
    </a-form-item>
  </a-form>

  <!-- 新增分类弹窗 -->
  <a-modal
    title="新增分类"
    :open="showAddCategory"
    @cancel="handleCancelAddCategory"
    @ok="handleConfirmAddCategory"
    :width="420"
  >
    <a-form
      ref="categoryFormRef"
      :model="categoryFormState"
      layout="vertical"
      labelAlign="left"
    >
      <a-form-item
        label="分类名称"
        name="name"
        :rules="[
          { required: true, message: '请输入分类名称' },
          { max: 64, message: '最多可输入64个字符', trigger: 'change' },
          {
            validator: nameValidator,
            trigger: 'blur'
          }
        ]"
      >
        <a-input
          v-model:value="categoryFormState.name"
          placeholder="请输入分类名称"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" name="BaseFormInfo" setup>
import { Rule } from 'ant-design-vue/es/form'
import { onlyMessage } from '@jetlinks-web/utils'
import { getDataSourceRepeat } from '@datasource-manager-ui/api/data/datasource'
import { spaceValidator } from '@datasource-manager-ui/utils/utils'
import { addDataSourceGroup } from '@datasource-manager-ui/api/data'
import { BaseFormData } from '../type'

const props = defineProps({
  // 表单数据
  modelValue: {
    type: Object as PropType<BaseFormData>,
    required: true
  },
  // 数据源名称（显示用）
  datasourceName: {
    type: String,
    required: true
  },
  // 是否为编辑模式
  isEditor: {
    type: Boolean,
    default: false
  },
  // 权限前缀
  permission: {
    type: String,
    default: ''
  },
  // 分类列表
  categoryList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'refreshCategoryList'])

// 表单引用
const formRef = ref<any>()
const categoryFormRef = ref<any>()

// 表单数据
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 分类表单状态
const categoryFormState = ref<any>({
  name: ''
})

// 显示新增分类弹窗
const showAddCategory = ref(false)

// 数据源标识验证器
const labelKeyValidator = async (_: Rule, value: string) => {
  if (value && !props.isEditor) {
    const resp = await getDataSourceRepeat(value)
    if (resp.status === 200) {
      if (resp.result) return Promise.reject('标识重复')
      else return Promise.resolve()
    }
  }
}

// 分类名称验证器
const nameValidator = async (_: Rule, value: string) => {
  if (value) {
    const res = props.categoryList.find((item: any) => item.name === value)
    if (res) {
      return Promise.reject('分类名称重复')
    }
    return Promise.resolve()
  }
}

// 处理新增分类
const handleAddCategory = () => {
  showAddCategory.value = true
}

// 取消新增分类
const handleCancelAddCategory = () => {
  showAddCategory.value = false
  categoryFormRef.value.resetFields()
}

// 确认新增分类
const handleConfirmAddCategory = () => {
  categoryFormRef.value.validate().then(async () => {
    const res = await addDataSourceGroup({ name: categoryFormState.value.name })
    if (res.status === 200) {
      showAddCategory.value = false
      categoryFormRef.value.resetFields()
      formData.value.group = res.result.id
      emit('refreshCategoryList')
      onlyMessage('新增成功')
    }
  })
}

// 表单验证方法
const validate = () => {
  return formRef.value.validate()
}

// 重置表单
const resetFields = () => {
  formRef.value.resetFields()
}

// 暴露给父组件的方法
defineExpose({
  validate,
  resetFields
})
</script>

<style lang="less" scoped>
.select-with-button {
  display: flex;
  gap: 4px;

  .ant-select {
    flex: 1;
  }

  .ant-btn {
    flex-shrink: 0;
  }
}
</style>
