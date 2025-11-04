<template>
  <a-table
    :columns="showAction ? columns : columns.filter((column) => column.key !== 'action')"
    :data-source="data"
    :pagination="false"
    :scroll="scroll"
    size="small"
    bordered
    v-bind="$attrs"
  >
    <template #bodyCell="slotProps">
      <template v-if="slotProps.column.key === 'index'">
        <slot
          name="index"
          v-bind="slotProps"
        />
      </template>
      <template v-else-if="slotProps.column.key === 'action'">
        <slot
          name="action"
          v-bind="slotProps"
        >
          <PreviewPopover
            v-if="slotProps.record.value"
            :content="slotProps.record.value"
          />
        </slot>
      </template>
      <template v-else>
        <slot
          :name="`column-${slotProps.column.key}`"
          v-bind="slotProps"
        />
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import PreviewPopover from './PreviewPopover.vue'

const props = defineProps<{
  data: any[]
  columns: any[]
  showAction?: boolean
  scroll?: any
}>()

const emit = defineEmits<{
  countUpdated: [count: number]
}>()

watch(
  () => props.data,
  (data) => {
    const count = Array.isArray(data) ? data.length : 0
    emit('countUpdated', count)
  },
  { immediate: true, deep: true }
)
</script>

<style scoped lang="less"></style>
