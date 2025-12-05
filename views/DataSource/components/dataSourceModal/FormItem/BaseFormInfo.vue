<template>
  <a-form
    ref="formRef"
    :model="formData"
    layout="vertical"
    labelAlign="left"
  >
    <a-form-item :label="$t('DataSource.BaseForm.100071-0')">
      <a-input
        :value="datasourceName"
        disabled
      />
    </a-form-item>
    <a-form-item
      :label="$t('DataSource.BaseForm.100071-1')"
      :rules="[
        { required: true, message: $t('DataSource.BaseForm.100071-3'), trigger: 'blur' },
        { max: 64, message: $t('DataSource.BaseForm.100071-4'), trigger: 'change' },
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
        :placeholder="$t('DataSource.BaseForm.100071-2')"
      />
    </a-form-item>
    <a-form-item
      :rules="[
        { max: 64, message: $t('DataSource.BaseForm.100071-4'), trigger: 'change' },
        {
          pattern: /^[a-z][a-zA-Z0-9_]*$/,
          message: $t('DataSource.BaseForm.100071-6'),
          trigger: 'change'
        },
        {
          validator: labelKeyValidator,
          trigger: 'blur'
        }
      ]"
      name="id"
      :label="$t('DataSource.BaseForm.100071-5')"
    >
      <a-input
        v-model:value="formData.id"
        :placeholder="$t('DataSource.BaseForm.100071-7')"
        :disabled="isEditor"
      />
    </a-form-item>
    <a-form-item
      :label="$t('DataSource.BaseForm.100071-8')"
      name="group"
      :rules="[{ required: true, message: $t('DataSource.BaseForm.100071-9') }]"
    >
      <div class="select-with-button">
        <a-select
          v-model:value="formData.group"
          :placeholder="$t('DataSource.BaseForm.100071-9')"
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
      :rules="[{ max: 200, message: $t('DataSource.BaseForm.100071-17') }]"
      :validateFirst="true"
      name="description"
      :label="$t('DataSource.BaseForm.100071-15')"
    >
      <a-textarea
        v-model:value="formData.description"
        :placeholder="$t('DataSource.BaseForm.100071-16')"
        :rows="3"
      />
    </a-form-item>
  </a-form>

  <!-- 新增分类弹窗 -->
  <a-modal
    :title="$t('DataSource.BaseForm.100071-10')"
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
        :label="$t('DataSource.BaseForm.100071-11')"
        name="name"
        :rules="[
          { required: true, message: $t('DataSource.BaseForm.100071-12') },
          { max: 64, message: $t('DataSource.BaseForm.100071-4'), trigger: 'change' },
          {
            validator: nameValidator,
            trigger: 'blur'
          }
        ]"
      >
        <a-input
          v-model:value="categoryFormState.name"
          :placeholder="$t('DataSource.BaseForm.100071-12')"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" name="BaseFormInfo" setup>
import { useI18n } from 'vue-i18n'
import { Rule } from 'ant-design-vue/es/form'
import { onlyMessage } from '@jetlinks-web/utils'
import { getDataSourceRepeat } from '@datasource-manager-ui/api/data/datasource'
import { spaceValidator } from '@datasource-manager-ui/utils/utils'
import { addDataSourceGroup } from '@datasource-manager-ui/api/data'
import { BaseFormData } from '../../type'

const { t: $t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object as PropType<BaseFormData>,
    required: true
  },
  datasourceName: {
    type: String,
    required: true
  },
  isEditor: {
    type: Boolean,
    default: false
  },
  permission: {
    type: String,
    default: ''
  },
  categoryList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'refreshCategoryList'])

const formRef = ref<any>()
const categoryFormRef = ref<any>()

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const categoryFormState = ref<any>({
  name: ''
})

const showAddCategory = ref(false)

const labelKeyValidator = async (_: Rule, value: string) => {
  if (value && !props.isEditor) {
    const resp = await getDataSourceRepeat(value)
    if (resp.status === 200) {
      if (resp.result) return Promise.reject($t('DataSource.BaseForm.100071-14'))
      else return Promise.resolve()
    }
  }
}

const nameValidator = async (_: Rule, value: string) => {
  if (value) {
    const res = props.categoryList.find((item: any) => item.name === value)
    if (res) {
      return Promise.reject($t('DataSource.BaseForm.100071-13'))
    }
    return Promise.resolve()
  }
}

const handleAddCategory = () => {
  showAddCategory.value = true
}

const handleCancelAddCategory = () => {
  showAddCategory.value = false
  categoryFormRef.value.resetFields()
}

const handleConfirmAddCategory = () => {
  categoryFormRef.value.validate().then(async () => {
    const res = await addDataSourceGroup({ name: categoryFormState.value.name })
    if (res.status === 200) {
      showAddCategory.value = false
      categoryFormRef.value.resetFields()
      formData.value.group = res.result.id
      emit('refreshCategoryList')
      onlyMessage($t('DataSource.BaseForm.100071-18'))
    }
  })
}

const validate = () => formRef.value.validate()

defineExpose({ validate })
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
