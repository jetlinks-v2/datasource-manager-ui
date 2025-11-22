<template>
  <div class="pipeline-stages">
    <div class="stages-header">
      <TitleComponent
        data="管道阶段"
        :style="{ margin: 0 }"
      />
      <a-button
        size="small"
        type="text"
        :disabled="maxStagesReached"
        @click="handleAddStage"
      >
        <template #icon>
          <AIcon type="PlusOutlined" />
        </template>
      </a-button>
    </div>

    <div class="stages-list">
      <div
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="stage-item"
        :class="{ active: currentIndex === index, dragging: dragIndex === index }"
        draggable="true"
        @click="$emit('select', index)"
        @dragstart="handleDragStart(index, $event)"
        @dragover="handleDragOver($event)"
        @dragend="handleDragEnd"
        @drop="handleDrop(index)"
      >
        <div class="stage-content">
          <AIcon
            type="HolderOutlined"
            class="drag-handle"
          />
          <span class="stage-number">{{ index + 1 }}</span>
          <span class="stage-type">{{ stage.type }}</span>
        </div>
        <a-button
          v-if="stages.length > 1"
          type="text"
          size="small"
          danger
          @click.stop="$emit('remove', index)"
        >
          <template #icon>
            <AIcon
              type="DeleteOutlined"
              style="font-size: 12px"
            />
          </template>
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleComponent from '@/components/TitleComponent/index.vue'

interface PipelineStage {
  id: string
  type: string
  body: string
}

defineProps<{
  stages: PipelineStage[]
  currentIndex: number | null
  maxStagesReached?: boolean
}>()

const emit = defineEmits(['add', 'remove', 'select', 'reorder'])

const dragIndex = ref<number | null>(null)

const handleAddStage = () => {
  emit('add')
}

const handleDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDragEnd = () => {
  dragIndex.value = null
}

const handleDrop = (toIndex: number) => {
  const fromIndex = dragIndex.value
  if (fromIndex !== null && fromIndex !== toIndex) {
    emit('reorder', fromIndex, toIndex)
  }
  handleDragEnd()
}
</script>

<style scoped lang="less">
.pipeline-stages {
  height: 100%;
  display: flex;
  flex-direction: column;

  .stages-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 32px;
    margin: 0 8px 8px 0;
  }

  .stages-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 4px;
    min-height: 0;
    scrollbar-gutter: stable;

    .stage-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 8px;
      margin-bottom: 8px;
      background: #fafafa;
      border: 1px solid #e8e8e8;
      border-radius: 4px;
      cursor: move;
      user-select: none;
      transition: all 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover:not(.dragging) {
        background: #fff;
        border-color: #40a9ff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }

      &.active {
        background: #e6f7ff;
        border-color: #1890ff;
      }

      &.dragging {
        opacity: 0.4;
      }

      .stage-content {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        min-width: 0;

        .drag-handle {
          flex-shrink: 0;
          cursor: move;
          color: #8c8c8c;
          font-size: 12px;
          transition: color 0.2s;

          &:hover {
            color: #1890ff;
          }
        }

        .stage-number {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 16px;
          height: 16px;
          background: #1890ff;
          color: #fff;
          border-radius: 50%;
          font-size: 10px;
        }

        .stage-type {
          flex: 1;
          font-weight: 500;
          color: #262626;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}
</style>
