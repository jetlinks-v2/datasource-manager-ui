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
      :columns="tableColumns"
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
            @change="(val) => handleFieldChange(val, record)"
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
        :class="{ 'monaco-editor-container-error': jsonErrorMsg }"
        :options="{ formatOnPaste: true, fixedOverflowWidgets: true }"
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
import { isObject, isArray, isEmpty, set, unset, difference } from 'lodash-es'
import FormItem from '@datasource-manager-ui/views/DataSource/components/FormItem.vue'
import MonacoEditor from '@jetlinks-web-core/components/MonacoEditor/monacoEditor.vue'
import { useI18n } from 'vue-i18n'

interface ParamItem {
  name: string
  value: string
}

const props = defineProps({
  queryParams: {
    type: Object,
    default: () => ({ query: [], headers: [], body: [], uri: [] })
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

const { t: $t } = useI18n()
const emit = defineEmits(['update:data', 'update:advancedMode'])

const dynamicParams = ref<ParamItem[]>([])
const formErrors = ref<Record<number, Record<string, string>>>({})
const isAdvancedMode = ref(props.advancedMode)
const jsonEditorValue = ref('{}')
const jsonError = ref(false)
const jsonErrorMsg = ref('')

const tableColumns = computed(() => [
  { title: $t('DataSource.CheckTest.100022-1'), dataIndex: 'name', key: 'name', width: '20%', ellipsis: true },
  { title: $t('DataSource.CheckTest.100022-2'), dataIndex: 'value', key: 'value' }
])

// 获取允许的参数名
const allowedParamKeys = computed(() => new Set(dynamicParams.value.map((item) => item.name)))

// 验证单个字段
const validateField = (record: ParamItem, index: number): boolean => {
  const error = record.value.length > 64 ? $t('DataSource.CheckTest.100022-4') : ''

  if (error) {
    set(formErrors.value, [index, 'value'], error)
    return false
  }

  unset(formErrors.value, [index, 'value'])
  if (isEmpty(formErrors.value[index])) {
    delete formErrors.value[index]
  }
  return true
}

// 验证所有字段
const validateAll = (): boolean => {
  if (isAdvancedMode.value) {
    return validateJson(jsonEditorValue.value)
  }

  formErrors.value = {}
  return dynamicParams.value.every((record, index) => validateField(record, index))
}

const handleFieldChange = (value: string, record: any) => {
  record.value = value
  emit('update:data', dynamicParams.value)
}

// 将 dynamicParams 转换为 JSON 对象（值转义为 JSON）
const paramsToJson = (): Record<string, any> => {
  return dynamicParams.value.reduce((obj, item) => {
    try {
      obj[item.name] = JSON.parse(item.value)
    } catch {
      obj[item.name] = item.value
    }
    return obj
  }, {} as Record<string, any>)
}

// 将 JSON 对象转换为 dynamicParams（值反转义为字符串）
const jsonToParams = (jsonObj: Record<string, any>): ParamItem[] => {
  return Object.entries(jsonObj).map(([name, value]) => ({
    name,
    value: isObject(value) ? JSON.stringify(value) : String(value)
  }))
}

// 验证 key 格式
const validateKey = (key: string): string => {
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) return $t('DataSource.CheckTest.100022-8', { key })
  if (key.length > 64) return $t('DataSource.CheckTest.100022-9', { key })
  return ''
}

// 递归验证对象所有 key
const validateAllKeys = (obj: any, path = ''): string => {
  if (!isObject(obj)) return ''

  if (isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const error = validateAllKeys(obj[i], `${path}[${i}]`)
      if (error) return error
    }
  } else {
    for (const key of Object.keys(obj)) {
      const keyError = validateKey(key)
      if (keyError) return keyError
      const error = validateAllKeys((obj as Record<string, any>)[key], path ? `${path}.${key}` : key)
      if (error) return error
    }
  }
  return ''
}

// 设置 JSON 验证错误
const setJsonError = (msg: string): boolean => {
  jsonError.value = true
  jsonErrorMsg.value = msg
  return false
}

// 清除 JSON 验证错误
const clearJsonError = (): boolean => {
  jsonError.value = false
  jsonErrorMsg.value = ''
  return true
}

// 验证 JSON 格式（包括参数名校验）
const validateJson = (value: string): boolean => {
  try {
    const parsed = JSON.parse(value)

    if (!isObject(parsed) || isArray(parsed)) {
      return setJsonError($t('DataSource.CheckTest.100022-10'))
    }

    const keyError = validateAllKeys(parsed)
    if (keyError) return setJsonError(keyError)

    const inputKeys = Object.keys(parsed)
    const allowedKeys = [...allowedParamKeys.value]

    const addedKeys = difference(inputKeys, allowedKeys)
    if (addedKeys.length > 0) {
      return setJsonError($t('DataSource.CheckTest.100022-11', { keys: addedKeys.join(', ') }))
    }

    const missingKeys = difference(allowedKeys, inputKeys)
    if (missingKeys.length > 0) {
      return setJsonError($t('DataSource.CheckTest.100022-12', { keys: missingKeys.join(', ') }))
    }

    return clearJsonError()
  } catch {
    return setJsonError($t('DataSource.CheckTest.100022-13'))
  }
}

// 处理 JSON 编辑器内容变化
const handleJsonChange = (value: string) => {
  if (validateJson(value)) {
    dynamicParams.value = jsonToParams(JSON.parse(value))
    emit('update:data', dynamicParams.value)
  }
}

const handleJsonError = (markers: any[]) => {
  jsonError.value = markers?.length > 0
}

// 模式切换时同步数据
watch(isAdvancedMode, (isAdvanced) => {
  if (isAdvanced) {
    jsonEditorValue.value = JSON.stringify(paramsToJson(), null, 2)
    jsonError.value = false
  } else if (validateJson(jsonEditorValue.value)) {
    dynamicParams.value = jsonToParams(JSON.parse(jsonEditorValue.value))
    emit('update:data', dynamicParams.value)
  }
  emit('update:advancedMode', isAdvanced)
})

watch(
  () => props.advancedMode,
  (val) => {
    isAdvancedMode.value = val
  }
)

// 初始化参数
const init = () => {
  if (!props.queryParams) return

  // 合并并去重所有参数
  const mergedParams = Array.from(
    new Map(
      Object.values(props.queryParams)
        .flat()
        .map((param: any) => [param.key, param])
    ).values()
  )

  // 保留已有值
  const existingValues = new Map(dynamicParams.value.map((item) => [item.name, item.value]))

  dynamicParams.value = mergedParams.map((param: any) => ({
    name: param.key,
    value: existingValues.get(param.key) ?? props.historyParams?.[param.key] ?? ''
  }))

  jsonEditorValue.value = JSON.stringify(paramsToJson(), null, 2)
  emit('update:data', dynamicParams.value)
}

watch(() => props.queryParams, init, { immediate: true, deep: true })

defineExpose({ validateAll })
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

  &-error {
    border-color: #ff4d4f;
  }
}

.error-tip {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}
</style>
