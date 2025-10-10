<template>
  <div class="command-list">
    <ListHeader
      search-placeholder="请输入名称"
      @search="handleSearch"
    >
      <template #count>
        共
        <a>&nbsp;{{ commands.length }}&nbsp;</a>
        个功能
      </template>
      <template #actions>
        <a-tooltip
          title="支持导入yaml/json文件"
          v-if="typeId === 'api'"
        >
          <FileUpload
            v-model:value="importSourceData"
            listType="text"
            accept=".yaml,.json"
            :types="['x-yaml', 'json']"
            :showUploadList="false"
            :multiple="false"
            @change="handleImportSourceDataChange"
            :size="10"
          >
            <template #button>
              <a-button
                size="small"
                type="text"
              >
                <AIcon type="UploadOutlined" />
              </a-button>
            </template>
          </FileUpload>
        </a-tooltip>

        <a-button
          size="small"
          type="text"
          @click="onAdd"
        >
          <AIcon type="PlusOutlined" />
        </a-button>
      </template>
    </ListHeader>

    <template v-if="filteredCommands.length > 0">
      <div class="command-list-content">
        <div class="command-list-items">
          <div
            v-for="item in filteredCommands"
            :key="item.id"
            class="command-item-wrapper"
          >
            <div
              class="command-item"
              :class="{ selected: item.id === selectedCommandId }"
              @click="handleCommandSelect(item)"
            >
              <j-ellipsis>
                <div class="command-name">{{ item.name }}</div>
              </j-ellipsis>
              <a-dropdown>
                <a-button
                  type="text"
                  size="small"
                >
                  <AIcon type="MoreOutlined" />
                </a-button>
                <template #overlay>
                  <a-menu style="width: 100px">
                    <a-menu-item @click="handleEdit(item)">
                      <AIcon type="EditOutlined" />
                      编辑
                    </a-menu-item>
                    <a-menu-item
                      @click="handleDelete(item)"
                      danger
                    >
                      <AIcon type="DeleteOutlined" />
                      删除
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="empty-container">
        <j-empty />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import FileUpload from '@datasource-manager-ui/components/Upload/File/index.vue'
import ListHeader from '@datasource-manager-ui/views/DataSource/components/ListHeader.vue'

interface Command {
  description: string
  id: string
  name: string
  sourceId: string
  support: string
}

const props = defineProps({
  typeId: {
    type: String,
    default: ''
  },
  commands: {
    type: Array as PropType<Command[]>,
    default: () => []
  }
})

const emit = defineEmits(['add', 'edit', 'delete', 'importChange', 'selectCommand'])

const importSourceData = ref()
const selectedCommandId = ref<string | null>(null)
const searchQuery = ref('')

// 根据搜索关键词过滤命令列表
const filteredCommands = computed(() => {
  if (!searchQuery.value) {
    return props.commands
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return props.commands.filter((command) => command.name.toLowerCase().includes(lowerCaseQuery))
})

const handleSearch = (value: string) => {
  searchQuery.value = value
}

const handleImportSourceDataChange = (data: any) => {
  emit('importChange', data)
}

const onAdd = () => {
  emit('add')
}

const handleEdit = (item: Command) => {
  emit('edit', item)
}

const handleDelete = (item: Command) => {
  emit('delete', item)
}

// 处理命令选中事件
const handleCommandSelect = (item: Command) => {
  if (selectedCommandId.value === item.id) {
    return
  } else {
    selectedCommandId.value = item.id
    emit('selectCommand', item)
  }
}

watch(
  () => filteredCommands.value,
  () => {
    selectedCommandId.value = filteredCommands.value[0]?.id
    emit('selectCommand', filteredCommands.value[0])
  }
)
</script>

<style lang="less" scoped>
.command-list {
  width: 300px;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-right: 4px;

  &-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .empty-container {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.command-list-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-item-wrapper {
  &:last-child {
    margin-bottom: 0;
  }
}

.command-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;

  &:hover {
    background-color: #f5f5f5;
  }

  &.selected {
    background-color: #f0f9ff;
    border-color: #d0ebff;

    .command-name {
      color: #1890ff;
    }
  }

  .command-name {
    flex: 1;
    font-size: 14px;
    transition: color 0.3s;
  }

  .ant-dropdown-trigger {
    opacity: 0;
    transition: opacity 0.2s;

    .anticon {
      font-size: 16px;
    }
  }

  &:hover .ant-dropdown-trigger {
    opacity: 1;
  }
}
</style>
