<template>
  <a-space v-if="showToggle">
    <j-ellipsis>
      <span :class="{ 'mask-display__masked': !visible }">
        {{ displayText }}
      </span>
    </j-ellipsis>
    <a-button
        type="text"
        size="small"
        @click="toggleVisible"
    >
      <template #icon>
        <AIcon :type="visible ? 'EyeOutlined' : 'EyeInvisibleOutlined'"/>
      </template>
    </a-button>
  </a-space>
  <j-ellipsis v-else>{{ displayText }}</j-ellipsis>
</template>

<script lang="ts" setup>
interface Props {
  value?: string //要显示的值
  placeholder?: string //空值时的占位符
  maskText?: string // 隐藏时显示的文本
  enableToggle?: boolean // 是否启用切换功能
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '--',
  maskText: '********',
  enableToggle: true
})

const visible = ref(false)

const hasValue = computed(() => !!props.value)

const displayText = computed(() => {
  if (!hasValue.value) return props.placeholder
  if (!props.enableToggle || visible.value) return props.value
  return props.maskText
})

const showToggle = computed(() => props.enableToggle && hasValue.value)

const toggleVisible = () => {
  visible.value = !visible.value
}
</script>

<style lang="less" scoped>
.mask-display__masked {
  -webkit-text-security: disc;
  font-family: serif;
}
</style>
