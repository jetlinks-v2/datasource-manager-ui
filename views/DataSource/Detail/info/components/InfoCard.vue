<template>
  <div class="info-card">
    <div class="card-header">
      <AIcon
        :type="icon"
        class="header-icon"
      />
      <span class="header-title">{{ title }}</span>
    </div>
    <div class="card-content">
      <div
        v-for="item in items"
        :key="item.label"
        class="info-item"
      >
        <span class="info-label">{{ item.label }}</span>
        <j-ellipsis :class="['info-value', { highlight: item.highlight }]">
          {{ item.value }}
        </j-ellipsis>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface InfoItem {
  label: string
  value: string
  highlight?: boolean
}

defineProps<{
  title: string
  icon: string
  items: InfoItem[]
}>()
</script>

<style lang="less" scoped>
.info-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;

  .card-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    border-bottom: 1px solid #e8e8e8;

    .header-icon {
      font-size: 16px;
      margin-right: 8px;
      color: #1890ff;
    }

    .header-title {
      font-size: 14px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
    }
  }

  .card-content {
    padding: 16px;

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      &:not(:last-child) {
        border-bottom: 1px solid #f0f0f0;
      }

      .info-label {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.65);
        flex-shrink: 0;
        margin-right: 16px;
      }

      .info-value {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.85);
        text-align: right;
        flex: 1;

        &.highlight {
          color: #52c41a;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
