<template>
  <div class="command-list">
    <ListHeader
      :search-placeholder="$t('DataSource.CommandList.100015-0')"
      @search="handleSearch"
    >
      <template #count>
        {{ $t('DataSource.CommandList.100015-1') }}
        <a>&nbsp;{{ commands.length }}&nbsp;</a>
        {{ $t('DataSource.CommandList.100015-2') }}
      </template>
      <template #actions>
        <a-tooltip
          :title="$t('DataSource.CommandList.100015-3')"
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
                <AIcon type="MoreOutlined" />
                <template #overlay>
                  <a-menu style="width: 100px">
                    <a-menu-item @click="handleEdit(item)">
                      <AIcon type="EditOutlined" />
                      {{ $t('DataSource.List.100002-2') }}
                    </a-menu-item>
                    <a-menu-item
                      @click="handleDelete(item)"
                      danger
                    >
                      <AIcon type="DeleteOutlined" />
                      {{ $t('DataSource.index.100001-10') }}
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
import ListHeader from '../../../../components/ListHeader.vue'
import { moduleRegistry } from '@jetlinks-web-core/utils/module-registry'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const { FileUpload } = moduleRegistry.getResource('visualization-manager-ui', 'components')
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
const pendingSelectId = ref<string | null>(null)

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

const handleCommandSelect = (item: Command) => {
  if (selectedCommandId.value !== item.id) {
    selectedCommandId.value = item.id
    emit('selectCommand', item)
  }
}

const selectCommand = (item: Command | undefined) => {
  selectedCommandId.value = item?.id || null
  emit('selectCommand', item)
}

const selectById = (id: string) => {
  const item = filteredCommands.value.find((cmd) => cmd.id === id)
  if (item) {
    selectCommand(item)
  } else {
    pendingSelectId.value = id
  }
}

watch(
  () => filteredCommands.value,
  (newCommands) => {
    const targetId = pendingSelectId.value || selectedCommandId.value
    const targetItem = newCommands.find((cmd) => cmd.id === targetId)

    pendingSelectId.value = null
    selectCommand(targetItem || newCommands[0])
  }
)

defineExpose({ selectById })
</script>

<style lang="less" scoped>
.command-list {
  width: 250px !important;
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-right: 4px;

  &-content {
    flex: 1;
    overflow-y: auto;
    scrollbar-gutter: stable;
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
