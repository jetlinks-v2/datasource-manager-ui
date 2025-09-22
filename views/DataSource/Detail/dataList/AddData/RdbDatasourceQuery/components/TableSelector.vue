<template>
  <div class="tables-container">
    <div class="title">
      <h3>数据库表</h3>
      <a-tooltip title="刷新表">
        <a-button
          type="text"
          @click="$emit('refresh')"
          size="small"
        >
          <AIcon :type="loading ? 'LoadingOutlined' : 'SyncOutlined'" />
        </a-button>
      </a-tooltip>
    </div>
    <div class="tables-list">
      <div
        class="table-loading"
        v-if="loading"
      >
        <a-spin :spinning="loading" />
      </div>
      <div
        v-else
        v-for="table in tables"
        :key="table.name"
        class="table-item"
        :class="{ active: selectedTable === table.name }"
        @click="$emit('select', table)"
      >
        <div class="table-name-container">
          <AIcon type="TableOutlined" />
          <j-ellipsis>
            <div class="table-name">{{ table.name }}</div>
          </j-ellipsis>
        </div>
        <span class="table-col">{{ table.columns.length }}个字段</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TableSchema } from '../type'

defineProps({
  tables: {
    type: Array as () => TableSchema[],
    default: () => []
  },
  selectedTable: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select', 'refresh'])
</script>

<style scoped lang="less">
.tables-container {
  width: 250px;
  border-right: 1px solid #e8e8e8;
  padding-right: 4px;
  margin-right: 4px;
  height: 100%;

  .title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 15px;
    }
  }

  .tables-list {
    overflow: auto;
    height: calc(100% - 40px);
    padding-right: 4px;

    .table-loading {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .table-item {
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.2s ease;

      &:hover {
        background-color: #f5f5f5;
      }

      &.active {
        background-color: #e6f7ff;
        color: #1890ff;
      }

      .table-name-container {
        display: flex;
        align-items: center;
        overflow: hidden;
        .table-name {
          flex: 1;
          margin: 0 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .table-col {
        color: #999;
        font-size: 12px;
        white-space: nowrap;
      }
    }
  }
}
</style>
