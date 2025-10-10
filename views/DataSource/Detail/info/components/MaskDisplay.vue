<template>
  <a-space v-if="showToggle">
    <j-ellipsis>
      <span :class="{ 'mask-display__masked': !visible && hasValue }">
        {{ maskedText }}
      </span>
    </j-ellipsis>
    <a-button
      type="text"
      size="small"
      @click="toggleVisible"
    >
      <template #icon>
        <AIcon :type="visible ? 'EyeOutlined' : 'EyeInvisibleOutlined'" />
      </template>
    </a-button>
  </a-space>
  <j-ellipsis v-else>{{ plainText }}</j-ellipsis>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    value?: string
    placeholder?: string
    maskText?: string
    enableToggle?: boolean
  }>(),
  {
    placeholder: '--',
    maskText: '********',
    enableToggle: true
  }
)

const visible = ref(false)

const hasValue = computed(() => (props.value ?? '') !== '')

const maskedText = computed(() => {
  if (!hasValue.value) {
    return props.placeholder
  }
  return visible.value ? props.value ?? '' : props.maskText
})

const plainText = computed(() => {
  return hasValue.value ? props.value ?? '' : props.placeholder
})

const showToggle = computed(() => props.enableToggle && hasValue.value)

const toggleVisible = () => {
  visible.value = !visible.value
}
</script>

<style lang="less" scoped>
.mask-display__masked {
  -webkit-text-security: disc;
  font-family: 'PingFang SC';
}
</style>
