<template>
  <div class="lua-script-editor-wrapper">
    <div
      ref="editorContainer"
      class="monaco-editor-container"
      :style="{ height }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'

interface Props {
  modelValue: string
  height?: string
  readOnly?: boolean
  theme?: string
  showMinimap?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  readOnly: false,
  theme: 'vs',
  showMinimap: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  update: [value: string]
  variablesChange: [variables: string[]]
}>()

const editorContainer = ref<HTMLElement | null>(null)
const monacoInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

// 变量正则表达式 ${xxx}
const VARIABLE_REGEX = /\$\{([^}]+)\}/g

// 提取脚本中的所有变量
const extractVariables = (text: string): string[] => {
  const variables = new Set<string>()
  const matches = text.matchAll(VARIABLE_REGEX)

  for (const match of matches) {
    if (match[1]) {
      variables.add(match[1].trim())
    }
  }

  return Array.from(variables)
}

// 注册自定义 Lua 语言规则
const registerCustomLuaLanguage = (): void => {
  if (monaco.languages.getLanguages().some((l) => l.id === 'lua-with-variables')) {
    return
  }

  monaco.languages.register({ id: 'lua-with-variables' })

  monaco.languages.setMonarchTokensProvider('lua-with-variables', {
    defaultToken: '',
    keywords: [
      'and',
      'break',
      'do',
      'else',
      'elseif',
      'end',
      'false',
      'for',
      'function',
      'if',
      'in',
      'local',
      'nil',
      'not',
      'or',
      'repeat',
      'return',
      'then',
      'true',
      'until',
      'while',
      'goto'
    ],
    operators: [
      '+',
      '-',
      '*',
      '/',
      '%',
      '^',
      '#',
      '==',
      '~=',
      '<=',
      '>=',
      '<',
      '>',
      '=',
      '(',
      ')',
      '{',
      '}',
      '[',
      ']',
      ';',
      ':',
      ',',
      '.',
      '..',
      '...'
    ],
    tokenizer: {
      root: [
        // 变量高亮 ${xxx}
        [/\$\{[^}]+\}/, 'variable.custom'],

        // 注释
        [/--\[\[/, 'comment', '@comment'],
        [/--.*$/, 'comment'],

        // 字符串
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/'([^'\\]|\\.)*$/, 'string.invalid'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/\[\[/, 'string', '@string_bracket'],

        // 关键字
        [
          /[a-zA-Z_]\w*/,
          {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }
        ],

        // 数字
        [/\d+\.?\d*([eE][\-+]?\d+)?/, 'number'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],

        // 操作符
        [/[{}()\[\]]/, '@brackets'],
        [/[<>]=?|[!=]=?|--?|==?|\+\+?|\*\*?|\/\/?|%|\^|~|&|\|/, 'operator'],

        // 空白字符
        [/[ \t\r\n]+/, '']
      ],

      comment: [
        [/\]\]/, 'comment', '@pop'],
        [/./, 'comment']
      ],

      string_double: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop']
      ],

      string_single: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop']
      ],

      string_bracket: [
        [/\]\]/, 'string', '@pop'],
        [/./, 'string']
      ]
    }
  })

  monaco.languages.setLanguageConfiguration('lua-with-variables', {
    comments: {
      lineComment: '--',
      blockComment: ['--[[', ']]']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '[[', close: ']]' }
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" }
    ]
  })
}

// 处理滚动穿透
const handleWheelEvent = (event: WheelEvent): void => {
  const instance = monacoInstance.value
  if (!instance) return

  const scrollTop = instance.getScrollTop()
  const scrollHeight = instance.getScrollHeight()
  const containerHeight = instance.getLayoutInfo().height

  const isScrollingUp = event.deltaY < 0
  const isScrollingDown = event.deltaY > 0

  const atTop = scrollTop <= 0
  const atBottom = scrollTop + containerHeight >= scrollHeight

  if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
    const modalBody = document.querySelector('.ant-modal-body')
    if (modalBody) {
      modalBody.scrollTop += event.deltaY
      event.preventDefault()
    }
  }
}

// 初始化编辑器
const initEditor = (): void => {
  if (!editorContainer.value) return

  registerCustomLuaLanguage()

  const instance = monaco.editor.create(editorContainer.value as HTMLElement, {
    value: props.modelValue,
    language: 'lua-with-variables',
    automaticLayout: true,
    minimap: { enabled: props.showMinimap },
    scrollBeyondLastLine: false,
    readOnly: props.readOnly
  })

  monacoInstance.value = instance

  // 添加滚动事件监听
  const domNode = instance.getDomNode()
  if (domNode) {
    domNode.addEventListener('wheel', handleWheelEvent, { passive: false })
  }

  // 内容变化时同步 v-model 并提取变量
  instance.onDidChangeModelContent(() => {
    const value = instance.getValue()
    emit('update:modelValue', value)
    emit('update', value)

    // 提取并发送变量列表
    const variables = extractVariables(value)
    emit('variablesChange', variables)
  })

  // 初始化时提取变量
  const initialVariables = extractVariables(props.modelValue)
  emit('variablesChange', initialVariables)
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

onBeforeUnmount(() => {
  const instance = monacoInstance.value
  if (instance) {
    const domNode = instance.getDomNode()
    if (domNode) {
      domNode.removeEventListener('wheel', handleWheelEvent)
    }
    instance.dispose()
    monacoInstance.value = null
  }
})

defineExpose({
  extractVariables: () => extractVariables(monacoInstance.value?.getValue() || '')
})
</script>

<style scoped lang="less">
.lua-script-editor-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.monaco-editor-container {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  height: 100%;
}
</style>
