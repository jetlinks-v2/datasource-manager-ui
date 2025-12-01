<template>
  <div class="editor-wrapper">
    <div
      ref="editorContainer"
      class="monaco-editor-container"
      :style="{ height }"
    ></div>
    <a-tag
      @click="handleFormat"
      color="gold"
      class="format-btn"
    >
      {{ $t('common.format') }}
    </a-tag>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
import { parse, parseTree, format, applyEdits, ParseError } from 'jsonc-parser'

interface ErrorMessagesMap {
  [key: number]: string
}

interface VariableMapping {
  originalStart: number
  originalEnd: number
  replacedStart: number
  replacedEnd: number
  originalSegment: string
  placeholder: string
}

interface MonacoMarker {
  severity: monaco.MarkerSeverity
  message: string
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

const props = defineProps({
  modelValue: {
    type: String,
    default: '{}'
  },
  height: {
    type: String,
    default: '300px'
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  formatOnBlur: {
    type: Boolean,
    default: false
  },
  theme: {
    type: String,
    default: 'vs'
  }
})
const emit = defineEmits(['update:modelValue', 'error', 'update'])

const editorContainer = ref<HTMLElement | null>(null)
// shallowRef 避免深层响应式追踪
const monacoInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

const ERROR_MESSAGES = computed<ErrorMessagesMap>(() => ({
  1: $t('DataSource.JsonEditor.100035-0'),
  2: $t('DataSource.JsonEditor.100035-1'),
  3: $t('DataSource.JsonEditor.100035-2'),
  4: $t('DataSource.JsonEditor.100035-3'),
  5: $t('DataSource.JsonEditor.100035-4'),
  6: $t('DataSource.JsonEditor.100035-5'),
  7: $t('DataSource.JsonEditor.100035-6'),
  8: $t('DataSource.JsonEditor.100035-7'),
  9: $t('DataSource.JsonEditor.100035-8'),
  10: $t('DataSource.JsonEditor.100035-9'),
  11: $t('DataSource.JsonEditor.100035-10'),
  12: $t('DataSource.JsonEditor.100035-11'),
  13: $t('DataSource.JsonEditor.100035-12'),
  14: $t('DataSource.JsonEditor.100035-13'),
  15: $t('DataSource.JsonEditor.100035-14'),
  16: $t('DataSource.JsonEditor.100035-15'),
  17: $t('DataSource.JsonEditor.100035-16'),
  18: $t('DataSource.JsonEditor.100035-17'),
  19: $t('DataSource.JsonEditor.100035-18')
}))

// 变量正则表达式
const VARIABLE_REGEX = /\{\{[^{}]*\}\}/g
const PLACEHOLDER_REGEX = /"__VAR_PLACEHOLDER_(\d+)__"/g

// JSON解析和格式化选项
const JSON_PARSE_OPTIONS = { allowTrailingComma: true, disallowComments: true }
const JSON_FORMAT_OPTIONS = { insertSpaces: true, tabSize: 2 }

const getErrorMessage = (code: number): string => {
  return ERROR_MESSAGES.value[code] || ERROR_MESSAGES.value[17]
}

const getReplacedContentAndMapping = (text: string): { replacedText: string; mapping: VariableMapping[] } => {
  const mapping: VariableMapping[] = []
  let replacedText = ''
  let lastIndex = 0
  VARIABLE_REGEX.lastIndex = 0

  let match
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    // 添加匹配前原始内容
    replacedText += text.slice(lastIndex, match.index)
    const replacedStart = replacedText.length

    // 占位符代替变量
    const placeholder = `__VAR_PLACEHOLDER_${mapping.length}__`
    const wrappedPlaceholder = `"${placeholder}"`
    replacedText += wrappedPlaceholder
    const replacedEnd = replacedText.length

    mapping.push({
      originalStart: match.index,
      originalEnd: match.index + match[0].length,
      replacedStart,
      replacedEnd,
      originalSegment: match[0],
      placeholder
    })
    lastIndex = match.index + match[0].length
  }

  // 添加最后剩余部分
  replacedText += text.slice(lastIndex)
  return { replacedText, mapping }
}

// 将替换后文本的偏移量转换回原始文本中的对应偏移量
const getOriginalOffset = (replacedOffset: number, mapping: VariableMapping[]): number => {
  let diff = 0
  for (const m of mapping) {
    if (replacedOffset >= m.replacedEnd) {
      diff += m.replacedEnd - m.replacedStart - (m.originalEnd - m.originalStart)
    } else if (replacedOffset >= m.replacedStart && replacedOffset < m.replacedEnd) {
      // 当错误出现在占位符内，统一映射到原始变量的开始位置
      return m.originalStart
    }
  }
  return replacedOffset - diff
}

// 利用 AST 遍历检测重复 key 的辅助函数
const checkDuplicateKeysInTree = (node: any): { error: number; offset: number; length: number }[] => {
  if (!node) return []

  let errors: { error: number; offset: number; length: number }[] = []

  if (node.type === 'object' && Array.isArray(node.children)) {
    const seen = new Map<string, boolean>()
    for (const prop of node.children) {
      if (prop.type === 'property' && prop.children?.[0]) {
        const keyNode = prop.children[0]
        const key = keyNode.value
        if (seen.has(key)) {
          errors.push({
            error: 18,
            offset: keyNode.offset,
            length: keyNode.length
          })
        } else {
          seen.set(key, true)
        }
      }
    }
  }

  // 递归检查所有子节点
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      errors = errors.concat(checkDuplicateKeysInTree(child))
    }
  }

  return errors
}

// JSON 验证：替换占位符后使用 jsonc-parser 检查 JSON 是否有效，并生成 Monaco 错误 marker
const validateAndMark = (value: string): boolean => {
  const instance = monacoInstance.value
  if (!instance) return true

  const model = instance.getModel()
  if (!model) return true

  const markers: MonacoMarker[] = []

  // 先校验非法的 "{{xxx}}"
  const illegalWrappedVariablePattern = /"\s*(\{\{.*?\}\})\s*"/g
  let match
  while ((match = illegalWrappedVariablePattern.exec(value)) !== null) {
    const startOffset = match.index
    const endOffset = startOffset + match[0].length

    const startPos = model.getPositionAt(startOffset)
    const endPos = model.getPositionAt(endOffset)

    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: ERROR_MESSAGES.value[19] || $t('DataSource.JsonEditor.100035-19'),
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column
    })
  }

  // 再走正常 JSON 校验流程
  const { replacedText, mapping } = getReplacedContentAndMapping(value)

  const parseErrors: ParseError[] = []
  parse(replacedText, parseErrors, JSON_PARSE_OPTIONS)

  const tree = parseTree(replacedText, [], JSON_PARSE_OPTIONS)
  const duplicateErrors = tree ? checkDuplicateKeysInTree(tree) : []

  const allErrors = [...parseErrors, ...duplicateErrors]

  for (const err of allErrors) {
    const originalStart = getOriginalOffset(err.offset, mapping)
    const originalEnd = getOriginalOffset(err.offset + err.length, mapping)
    const startPos = model.getPositionAt(originalStart)
    const endPos = model.getPositionAt(originalEnd)

    markers.push({
      severity: monaco.MarkerSeverity.Error,
      message: getErrorMessage(err.error),
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: endPos.column
    })
  }

  // 最后统一 set markers
  monaco.editor.setModelMarkers(model, 'json', markers)

  if (markers.length > 0) {
    emit('error', markers)
    return false
  } else {
    emit('error', null)
    return true
  }
}

// 格式化函数：先替换 {{xxx}} 为占位符格式化 JSON，再将占位符还原成原始变量
const formatJsonWithVariables = (jsonString: string): string => {
  // 替换 {{xxx}} 变量为占位符
  const { replacedText, mapping } = getReplacedContentAndMapping(jsonString)

  // 使用 jsonc-parser 的 format 接口进行格式化
  const edits = format(replacedText, undefined, JSON_FORMAT_OPTIONS)
  const formattedReplacedText = applyEdits(replacedText, edits)

  // 将格式化后的占位符替换回原始的 {{xxx}} 格式
  return formattedReplacedText.replace(PLACEHOLDER_REGEX, (_, index) => {
    const m = mapping[Number(index)]
    return m ? m.originalSegment : _
  })
}

// 点击按钮或失焦时触发格式化
const handleFormat = (): void => {
  const instance = monacoInstance.value
  if (!instance) return

  const currentValue = instance.getValue()
  const formattedValue = formatJsonWithVariables(currentValue)

  if (formattedValue !== currentValue) {
    instance.setValue(formattedValue)
    emit('update:modelValue', formattedValue)
    emit('update', formattedValue)
    // 格式化后重新验证，更新或清除错误 marker
    validateAndMark(formattedValue)
  }
}

// 注册自定义 JSON 语言规则
const registerCustomJsonLanguage = (): void => {
  if (monaco.languages.getLanguages().some((l) => l.id === 'json-with-variables')) {
    return
  }

  monaco.languages.register({ id: 'json-with-variables' })
  monaco.languages.setMonarchTokensProvider('json-with-variables', {
    defaultToken: '',
    tokenizer: {
      root: [
        [/{/, { token: 'delimiter', next: '@object' }],
        [/\[/, { token: 'delimiter', next: '@array' }],
        { include: '@common' }
      ],
      object: [
        [/}/, { token: 'delimiter', next: '@pop' }],
        [/:/, 'delimiter'],
        [/,/, 'delimiter'],
        { include: '@common' }
      ],
      array: [[/\]/, { token: 'delimiter', next: '@pop' }], [/,/, 'delimiter'], { include: '@common' }],
      common: [
        [/[ \t\r\n]+/, ''],
        [/\{\{[^{}]*\}\}/, 'variable.custom'], //变量
        [/"([^"\\]|\\.)*"/, 'string'], // 字符串
        [/\b(true|false|null)\b/, 'keyword'], // 布尔和null
        [/-?\d+(\.\d+)?([eE][+\-]?\d+)?/, 'number'] // 数字，支持负数、浮点数、科学计数法
      ]
    }
  })

  monaco.languages.setLanguageConfiguration('json-with-variables', {
    brackets: [
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' }
    ]
  })

  // 定义主题，确保所有 variable.custom 都采用统一的样式
  monaco.editor.defineTheme('json-with-variables-theme', {
    base: props.theme as monaco.editor.BuiltinTheme, // 继承外面的基础主题，比如 vs-dark
    inherit: true,
    rules: [
      { token: 'variable.custom', foreground: '#4d9be6', fontStyle: 'bold italic' },
      { token: 'keyword', foreground: '#d18616' },
      { token: 'string', foreground: '#ce9178' },
      { token: 'number', foreground: '#b5cea8' }
    ],
    colors: {}
  })
}

// 初始化编辑器
const initEditor = (): void => {
  if (!editorContainer.value) return

  // 注册自定义语言支持
  registerCustomJsonLanguage()

  const instance = monaco.editor.create(editorContainer.value as HTMLElement, {
    value: props.modelValue,
    language: 'json-with-variables',
    theme: 'json-with-variables-theme',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    readOnly: props.readOnly,
    tabSize: 2,
    folding: true,
    wordWrap: 'on',
    formatOnPaste: true
  })

  monacoInstance.value = instance

  // 每次内容变化时同步 v-model 并进行 JSON 验证
  instance.onDidChangeModelContent(() => {
    const value = instance.getValue()
    emit('update:modelValue', value)
    emit('update', value)
    validateAndMark(value)
  })

  // 如果启用失焦格式化，注册失焦事件
  if (props.formatOnBlur) {
    instance.onDidBlurEditorWidget(handleFormat)
  }

  // 首次验证
  validateAndMark(props.modelValue)
}

onMounted(initEditor)

watch(
  () => props.modelValue,
  (newValue) => {
    const instance = monacoInstance.value
    if (instance && instance.getValue() !== newValue) {
      instance.setValue(newValue)
    }
  }
)

watch(
  () => props.readOnly,
  (newValue) => {
    const instance = monacoInstance.value
    if (instance) {
      instance.updateOptions({ readOnly: newValue })
    }
  }
)

watch(
  () => props.theme,
  () => {
    monaco.editor.setTheme('json-with-variables-theme')
  }
)

onBeforeUnmount(() => {
  const instance = monacoInstance.value
  if (instance) {
    instance.dispose()
    monacoInstance.value = null
  }
})

const validateAll = () => {
  return validateAndMark(props.modelValue)
}

defineExpose({
  validateAll
})
</script>

<style scoped>
.editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.monaco-editor-container {
  border-radius: 2px;
  overflow: hidden;
  height: 100%;
}

.format-btn {
  position: absolute;
  right: 8px;
  top: -32px;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 10;
  user-select: none;
}
</style>
