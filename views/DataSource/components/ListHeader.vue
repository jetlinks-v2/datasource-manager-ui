<template>
  <div class="list-header">
    <div
      v-if="!isSearching"
      class="count-text"
    >
      <slot name="count" />
    </div>
    <div class="header-right">
      <div
        class="search-container"
        :class="{ expanded: isSearching }"
      >
        <a-input
          v-if="isSearching"
          ref="searchInputRef"
          v-model:value="searchQuery"
          :placeholder="searchPlaceholder"
          allow-clear
          @blur="handleSearchBlur"
          @input="handleSearchInput"
        >
          <template #prefix>
            <AIcon type="SearchOutlined" />
          </template>
        </a-input>
        <a-button
          v-else
          size="small"
          type="text"
          @click="handleSearchClick"
        >
          <AIcon type="SearchOutlined" />
        </a-button>
      </div>

      <a-space
        v-if="!isSearching"
        class="header-buttons"
      >
        <slot name="actions"></slot>
      </a-space>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  searchPlaceholder?: string
}

withDefaults(defineProps<Props>(), {
  searchPlaceholder: '请输入关键词'
})

const emit = defineEmits<{
  search: [value: string]
}>()

const searchInputRef = ref<HTMLElement | null>(null)
const isSearching = ref(false)
const searchQuery = ref('')

const handleSearchClick = () => {
  isSearching.value = true
  nextTick(() => {
    if (searchInputRef.value) {
      ;(searchInputRef.value as any).focus?.()
    }
  })
}

const handleSearchBlur = () => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    isSearching.value = false
    searchQuery.value = ''
  }
}

const handleSearchInput = () => {
  emit('search', searchQuery.value)
}

// 暴露搜索状态给父组件
defineExpose({
  isSearching: readonly(isSearching),
  searchQuery: readonly(searchQuery)
})
</script>

<style lang="less" scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  margin-bottom: 8px;
  flex-shrink: 0;

  .count-text {
    a {
      margin: 0 4px;
      color: #1890ff;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 4px;
    margin-right: 4px;
  }

  .search-container {
    display: flex;
    align-items: center;
    width: 32px;
    transition: all 0.3s;

    .ant-btn {
      font-size: 16px;
      transition: all 0.3s;
    }

    &.expanded {
      flex-grow: 1;
      width: 100%;
      margin-right: 8px;

      .ant-input-affix-wrapper {
        border-radius: 6px;
      }
    }

    .ant-input-affix-wrapper {
      flex-grow: 1;
      transition: all 0.3s;
    }
  }

  .header-buttons {
    flex-shrink: 0;

    .ant-btn {
      transition: all 0.3s;
      font-size: 16px;
    }
  }
}
</style>
