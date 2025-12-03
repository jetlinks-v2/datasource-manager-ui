<template>
  <a-popover
    trigger="click"
    overlayClassName="index-keys-popover"
  >
    <template #content>
      <div class="index-keys-preview">
        <div
          v-for="(value, key) in keys"
          :key="key"
          class="key-item"
        >
          <div class="key-name">
            <KeyOutlined class="key-icon" />
            {{ key }}
          </div>
          <a-tag :color="getIndexTypeColor(value)">
            {{ getIndexTypeName(value) }}
          </a-tag>
        </div>
      </div>
    </template>
    <a-button
      type="link"
      size="small"
      class="preview-btn"
    >
      <EyeOutlined />
    </a-button>
  </a-popover>
</template>

<script setup lang="ts">
import { EyeOutlined, KeyOutlined } from '@ant-design/icons-vue'

interface Props {
  keys: Record<string, any>
}

defineProps<Props>()

// MongoDB 索引类型配置
const INDEX_TYPE_CONFIG = {
  '1': { name: '升序', color: 'blue' },
  '-1': { name: '降序', color: 'cyan' },
  '2d': { name: '二维平面索引', color: 'purple' },
  '2dsphere': { name: '球面几何索引', color: 'geekblue' },
  text: { name: '文本索引', color: 'orange' },
  hashed: { name: '哈希索引', color: 'green' },
  geoHaystack: { name: '地理位置索引', color: 'magenta' }
} as any

// 获取索引类型名称
const getIndexTypeName = (value: string): string => {
  return INDEX_TYPE_CONFIG[value]?.name || value
}
// 获取索引类型对应的颜色
const getIndexTypeColor = (value: string): string => {
  return INDEX_TYPE_CONFIG[value]?.color || 'default'
}
</script>

<style scoped lang="less">
.preview-btn {
  padding: 0 4px;
  height: 24px;

  &:hover {
    background-color: #f0f7ff;
  }
}

.index-keys-preview {
  max-height: 400px;
  overflow-y: auto;
  min-width: 200px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 3px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
  }

  .key-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 4px;
    margin-bottom: 4px;
    background-color: #fafafa;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f0f7ff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .key-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      font-size: 13px;
      flex: 1;
      min-width: 0;
      margin-right: 12px;

      .key-icon {
        color: #1890ff;
        margin-right: 6px;
        font-size: 14px;
        flex-shrink: 0;
      }
    }
  }
}
</style>
