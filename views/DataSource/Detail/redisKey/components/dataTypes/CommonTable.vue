<template>
  <div class="table-container">
    <a-table
      :columns="columns"
      :data-source="data"
      :pagination="false"
      :scroll="{ y: tableHeight }"
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
          >
            {{ slotProps.record?.[slotProps.column.key as keyof typeof slotProps.record] }}
          </slot>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import PreviewPopover from './PreviewPopover.vue'

const props = defineProps<{
  data: any[]
  columns: any[]
}>()

const emit = defineEmits<{
  countUpdated: [count: number]
}>()

const tableHeight = ref(300)

// 计算表格高度
const calculateTableHeight = () => {
  const container = document.querySelector('.table-container')
  if (container) {
    const containerHeight = container.clientHeight
    tableHeight.value = Math.max(containerHeight - 80, 100)
  }
}

// 监听数据变化，更新计数
watch(
  () => props.data,
  (data) => {
    const count = Array.isArray(data) ? data.length : 0
    emit('countUpdated', count)
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  nextTick(() => {
    calculateTableHeight()
    window.addEventListener('resize', calculateTableHeight)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calculateTableHeight)
})
</script>

<style scoped lang="less">
div {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
