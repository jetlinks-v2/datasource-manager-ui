<template>
  <div class="form-item">
    <a-tooltip
      :title="error"
      color="#ff4d4f"
      placement="topRight"
    >
      <a-input
        v-model:value="localValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="{ 'form-error': error }"
        @change="handleChangeEvent"
        @blur="handleBlurEvent"
      />
    </a-tooltip>
    <a-badge
      v-if="error"
      dot
      status="error"
      class="error-badge"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: string
  placeholder?: string
  disabled?: boolean
  error?: string
}>()

const emit = defineEmits(['update:value', 'change', 'blur'])

const localValue = ref('')

const handleChangeEvent = () => {
  emit('update:value', localValue.value)
  emit('change', localValue.value)
}

const handleBlurEvent = () => {
  emit('update:value', localValue.value)
  emit('blur', localValue.value)
}

watch(
  () => props.value,
  (newValue) => {
    localValue.value = newValue
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.form-item {
  width: 100%;
  min-width: 100px;
  position: relative;
}

.form-error {
  border-color: #ff4d4f !important;

  &:hover,
  &:focus {
    border-color: #ff7875 !important;
    box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
  }
}

.error-badge {
  position: absolute;
  right: -10px;
  top: -10px;
}
</style>
