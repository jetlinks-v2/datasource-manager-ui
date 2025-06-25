<template>
  <div
    class="content-list-item"
    :class="{ 'is-active': active }"
    @click="$emit('click', item)"
  >
    <div>
      <slot name="content">
        <j-ellipsis>{{ getItemLabel(item) }}</j-ellipsis>
      </slot>
    </div>
    <div>
      <slot name="action">
        <a-dropdown
          v-if="active && !removeEdit && (!removeDefaultMore || item[valueKey] !== defaultKey)"
        >
          <div class="icon">
            <AIcon type="MoreOutlined" />
          </div>
          <template #overlay>
            <a-menu style="width: 144px">
              <a-menu-item :key="1">
                <j-permission-button
                  :hasPermission="`${permission}:edit` || true"
                  type="link"
                  size="small"
                  @click="$emit('edit', 1, item)"
                >
                  <a-space style="color: #000">
                    <a-icon type="EditOutlined" />
                    <span>重命名</span>
                  </a-space>
                </j-permission-button>
              </a-menu-item>
              <a-menu-item
                :key="2"
                :disabled="item[valueKey] === defaultKey"
              >
                <div v-if="item[valueKey] !== defaultKey">
                  <j-permission-button
                    :hasPermission="`${permission}:delete` || true"
                    type="link"
                    size="small"
                    @click="$emit('delete', item)"
                  >
                    <a-space style="color: #ff4d4f">
                      <a-icon type="DeleteOutlined" />
                      <span>删除</span>
                    </a-space>
                  </j-permission-button>
                </div>
                <a-tooltip
                  v-else
                  title="不可删除默认分类"
                >
                  <a-space style="color: rgba(255, 0, 4, 0.3)">
                    <a-icon type="DeleteOutlined" />
                    <span>删除</span>
                  </a-space>
                </a-tooltip>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  item: Record<string, any>
  active: boolean
  idKey: string
  valueKey: string
  labelKey?: string
  defaultKey: string
  removeEdit?: boolean
  removeDefaultMore?: boolean
  permission?: string
}>()

defineEmits(['click', 'edit', 'delete'])

// 获取项目标签
const getItemLabel = (item: Record<string, any>): string => {
  if (props.labelKey && item[props.labelKey]) {
    return item[props.labelKey]
  }
  return item.name || item.text || ''
}
</script>

<style scoped lang="less">
.content-list-item {
  cursor: pointer;
  padding: 8px 12px;
  margin-right: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: var(--border-radius);
  transition: all var(--transition-duration) ease;
  border: 1px solid transparent;

  &:hover {
    background: var(--hover-bg);
    border-color: #e8e8e8;

    .icon {
      display: block;
      color: #060606;
    }
  }

  &.is-active {
    background-color: #f0f9ff;
    border-color: #d0ebff;
    color: var(--primary-color);
    font-weight: 500;
  }

  .icon {
    display: none;
  }
}
</style> 