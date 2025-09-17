<template>
  <div class="list-header">
    <div
      v-if="!isSearching"
      class="count-text"
    >
      共
      <span>{{ count }}</span>
      个分类
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
          placeholder="请输入名称"
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
        v-if="!isSearching && !removeEdit"
        class="header-buttons"
      >
        <j-permission-button
          type="text"
          :hasPermission="`${permission}:add`"
          size="small"
          @click="$emit('add')"
          style="margin-right: 8px"
        >
          <template #icon>
            <AIcon type="PlusOutlined" />
          </template>
        </j-permission-button>
      </a-space>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CategoryHeader'
})

interface Props {
  count: number
  permission?: string
  removeEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  permission: '',
  removeEdit: false
})

const emit = defineEmits(['search', 'add'])

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

// 关闭搜索
const closeSearch = () => {
  isSearching.value = false
  searchQuery.value = ''
  emit('search', '')
}

// 暴露方法给父组件
defineExpose({
  isSearching: readonly(isSearching),
  searchQuery: readonly(searchQuery),
  closeSearch
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
    span {
      color: var(--primary-color);
      padding: 0 2px;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    flex-grow: 1;
    justify-content: flex-end;
    gap: 8px;
  }

  .search-container {
    display: flex;
    align-items: center;
    width: 32px;
    transition: all 0.3s;

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
  }
}
</style>
