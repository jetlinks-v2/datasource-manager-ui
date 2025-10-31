<template>
  <div>
    <div
      v-if="open"
      class="popover-modal-mask"
      @click="handleClose"
    ></div>
    <a-popover
      :open="open"
      trigger="click"
      placement="leftTop"
      @open-change="handleOpenChange"
    >
      <template #content>
        <div class="preview-wrapper">
          <slot name="header"></slot>
          <div class="preview-content">
            <StringType
              :data="[{ value: content }]"
              width="400px"
              height="300px"
            />
          </div>
        </div>
      </template>
      <AIcon
        type="EyeOutlined"
        class="preview-icon"
        @click="handleOpen"
      />
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import StringType from './StringType.vue'

defineProps<{ content: string }>()

const emit = defineEmits<{
  openChange: [open: boolean]
}>()

const open = ref(false)

const handleOpen = () => {
  open.value = true
  emit('openChange', true)
}

const handleClose = () => {
  open.value = false
  emit('openChange', false)
}

const handleOpenChange = (value: boolean) => {
  open.value = value
  emit('openChange', value)
}
</script>

<style scoped lang="less">
.popover-modal-mask {
  position: fixed;
  height: 100vh;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1030;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(1px);
}

.preview-wrapper {
  padding: 8px;
}

.preview-content {
  border-radius: 4px;
  overflow: hidden;
}

.preview-icon {
  font-size: 16px;
  color: #1890ff;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #40a9ff;
    transform: scale(1.1);
  }
}
</style>
