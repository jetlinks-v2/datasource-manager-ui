<template>
  <div class="check-test-warp">
    <div class="header">
      <div class="title-row">
        <TitleComponent
          :data="$t('DataSource.CheckTest.100022-0')"
          class="section-title"
        />
        <a-switch
          style="width: 100%"
          v-model:checked="isAdvancedMode"
          :checked-children="$t('DataSource.CheckTest.100022-5')"
          :un-checked-children="$t('DataSource.CheckTest.100022-6')"
        />
      </div>
      <slot name="sendOutButton" />
    </div>

    <!-- 普通模式：表格输入 -->
    <a-table
      v-if="!isAdvancedMode"
      :columns="responseTreeTableColumns"
      :data-source="dynamicParams"
      :pagination="false"
      size="small"
      bordered
      :scroll="{ y: 260 }"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'value'">
          <FormItem
            :error="formErrors[index]?.value"
            :value="record.value"
            :placeholder="$t('DataSource.CheckTest.100022-3')"
            @change="(val) => handleFieldChange(val, 'value', record)"
          />
        </template>
      </template>
    </a-table>

    <!-- 高级模式：Monaco 编辑器 -->
    <div
      v-else
      class="advanced-mode"
    >
      <div class="advanced-tip">
        <a-alert
          :message="$t('DataSource.CheckTest.100022-7')"
          type="info"
          show-icon
          :style="{ marginBottom: '8px' }"
        />
      </div>
      <MonacoEditor
        v-model="jsonEditorValue"
        theme="vs"
        language="json"
        :blur-format="true"
        class="monaco-editor-container"
        :class="jsonErrorMsg ? 'monaco-editor-container-error' : ''"
        :options="{
          formatOnPaste: true,
          fixedOverflowWidgets: true
        }"
        @change="handleJsonChange"
        @error-change="handleJsonError"
      />
      <div
        v-if="jsonErrorMsg"
        class="error-tip"
      >
        {{ jsonErrorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormItem from '@datasource-manager-ui/views/DataSource/components/FormItem.vue'
import MonacoEditor from '@/components/MonacoEditor/monacoEditor.vue'
import { useI18n } from 'vue-i18n'

interface ParamItem {
  name: string
  value: string
}

const props = defineProps({
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
  },
  advancedMode: {
    type: Boolean,
    default: false
  }
})

type ValidatorKey = 'value'
type ValidatorFn = (value: string, record: ParamItem, index: number) => string

const responseTreeTableColumns = computed(() => [
  {
    title: $t('DataSource.CheckTest.100022-1'),
    dataIndex: 'name',
    key: 'name',
    width: '20%',
    ellipsis: true
  },
  {
    title: $t('DataSource.CheckTest.100022-2'),
    dataIndex: 'value',
    key: 'value'
  }
])

const { t: $t } = useI18n()

const emit = defineEmits(['update:data', 'update:advancedMode'])
const dynamicParams = ref<ParamItem[]>([])
const formErrors = ref<Record<number, Record<string, string>>>({})

// 高级模式相关
const isAdvancedMode = ref(props.advancedMode)
const jsonEditorValue = ref('{}')
const jsonError = ref<boolean>(false)
const jsonErrorMsg = ref<string>('')

const validators: Record<ValidatorKey, ValidatorFn> = {
  value: (value: string) => {
    if (value.length > 64) return $t('DataSource.CheckTest.100022-4')
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
  // 高级模式下验证 JSON 格式
  if (isAdvancedMode.value) {
    return validateJson(jsonEditorValue.value)
  }

  // 普通模式下验证表格
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

// 将 dynamicParams 转换为 JSON 对象
const paramsToJson = () => {
  const obj: Record<string, any> = {}
  dynamicParams.value.forEach((item) => {
    obj[item.name] = item.value
  })
  return obj
}

// 将 JSON 对象转换为 dynamicParams
const jsonToParams = (jsonObj: Record<string, any>) => {
  return Object.entries(jsonObj).map(([name, value]) => ({
    name,
    value
  }))
}

// 获取允许的参数名列表
const allowedParamKeys = computed(() => {
  return new Set(dynamicParams.value.map((item) => item.name))
})

// 验证 key 格式
const validateKey = (key: string): string => {
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) return $t('DataSource.CheckTest.100022-8', { key })
  if (key.length > 64) return $t('DataSource.CheckTest.100022-9', { key })
  return ''
}

// 递归验证对象所有 key
const validateAllKeys = (obj: any, path = ''): string => {
  if (typeof obj !== 'object' || obj === null) return ''

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const error = validateAllKeys(obj[i], `${path}[${i}]`)
      if (error) return error
    }
  } else {
    for (const key of Object.keys(obj)) {
      const keyError = validateKey(key)
      if (keyError) return keyError

      const error = validateAllKeys(obj[key], path ? `${path}.${key}` : key)
      if (error) return error
    }
  }
  return ''
}

// 验证 JSON 是否有效（包括参数名校验）
const validateJson = (value: string): boolean => {
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      jsonError.value = true
      jsonErrorMsg.value = $t('DataSource.CheckTest.100022-10')
      return false
    }

    // 校验参数名是否被修改
    const inputKeys = new Set(Object.keys(parsed))
    const allowedKeys = allowedParamKeys.value

    // 递归检查所有 key 的格式
    const keyError = validateAllKeys(parsed)
    if (keyError) {
      jsonError.value = true
      jsonErrorMsg.value = keyError
      return false
    }

    // 检查是否有新增的 key
    const addedKeys: string[] = []
    for (const key of inputKeys) {
      if (!allowedKeys.has(key)) {
        addedKeys.push(key)
      }
    }
    if (addedKeys.length > 0) {
      jsonError.value = true
      jsonErrorMsg.value = $t('DataSource.CheckTest.100022-11', { keys: addedKeys.join(', ') })
      return false
    }

    // 检查是否有缺失的 key
    const missingKeys: string[] = []
    for (const key of allowedKeys) {
      if (!inputKeys.has(key)) {
        missingKeys.push(key)
      }
    }
    if (missingKeys.length > 0) {
      jsonError.value = true
      jsonErrorMsg.value = $t('DataSource.CheckTest.100022-12', { keys: missingKeys.join(', ') })
      return false
    }

    jsonError.value = false
    jsonErrorMsg.value = ''
    return true
  } catch {
    jsonError.value = true
    jsonErrorMsg.value = $t('DataSource.CheckTest.100022-13')
    return false
  }
}

// 处理 JSON 编辑器内容变化
const handleJsonChange = (value: string) => {
  if (validateJson(value)) {
    const parsed = JSON.parse(value)
    dynamicParams.value = jsonToParams(parsed)
    emit('update:data', dynamicParams.value)
  }
}

// 处理 JSON 错误
const handleJsonError = (markers: any[]) => {
  jsonError.value = markers?.length > 0
}

// 模式切换时同步数据
watch(isAdvancedMode, (newVal) => {
  if (newVal) {
    // 切换到高级模式，将表格数据转为 JSON
    jsonEditorValue.value = JSON.stringify(paramsToJson(), null, 2)
    jsonError.value = false
  } else {
    // 切换到普通模式，尝试将 JSON 转回表格数据
    if (validateJson(jsonEditorValue.value)) {
      const parsed = JSON.parse(jsonEditorValue.value)
      dynamicParams.value = jsonToParams(parsed)
      emit('update:data', dynamicParams.value)
    }
  }
  emit('update:advancedMode', newVal)
})

// 监听 prop 变化
watch(
  () => props.advancedMode,
  (newVal) => {
    isAdvancedMode.value = newVal
  }
)

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

  // 同步更新 JSON 编辑器的值
  jsonEditorValue.value = JSON.stringify(paramsToJson(), null, 2)

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
  width: 100%;
  white-space: nowrap;
  margin: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.advanced-mode {
  display: flex;
  flex-direction: column;
}

.monaco-editor-container {
  height: 260px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor-container-error {
  border-color: #ff4d4f;
}

.error-tip {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
</style>
