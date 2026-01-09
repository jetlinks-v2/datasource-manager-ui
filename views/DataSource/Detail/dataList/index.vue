<template>
  <div class="parameter-container">
    <CommandList
      ref="commandListRef"
      :typeId="typeId"
      :commands="commands"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @importChange="handleImportChange"
      @selectCommand="handleSelectCommand"
    />

    <a-divider
      type="vertical"
      class="divider"
    />

    <div class="container">
      <JProTable
        ref="tableRef"
        :dataSource="tableData"
        mode="CARD"
        :bodyStyle="{ padding: 0 }"
        :gridColumns="[2, 3, 4]"
        noPagination
      >
        <template #card="slotProps">
          <TableCard
            :data="slotProps"
            :createTime="activeItem?.createTime || ''"
            @click="handleCardClick"
            @debug="handleDebugClick"
          />
        </template>
      </JProTable>
    </div>
  </div>

  <AddData
    v-if="addDataModal.visible"
    :data="addDataModal.data"
    :info="info"
    @ok="handleSaveSuccess"
    @cancel="closeAddDataModal"
  />

  <CommandModal
    v-if="commandModal.visible"
    :data="commandModal.data"
    :preview="commandModal.preview"
    @cancel="closeCommandModal"
  />

  <DebugModal
    v-if="debugModal.visible"
    :data="debugModal.data"
    :activeItem="activeItem"
    :info="info"
    @cancel="closeDebugModal"
  />
</template>

<script lang="ts" name="DataList" setup>
import { Modal } from 'ant-design-vue'
import { onlyMessage } from '@jetlinks-web/utils'
import AddData from './AddData/index.vue'
import TableCard from './AddData/components/TableCard.vue'
import CommandList from './AddData/components/CommandList.vue'
import CommandModal from './AddData/components/CommandModal.vue'
import DebugModal from './AddData/components/DebugModal.vue'
import { useI18n } from 'vue-i18n'
import {
  deleteDataSourceCommand,
  importDataSource,
  getDatasource,
  getDataSourceCommands
} from '@datasource-manager-ui/api/data/datasource'

const { t: $t } = useI18n()

interface DataSourceInfo {
  id: string
  [key: string]: any
}

interface ImportData {
  fileList: any[]
  file: {
    response: {
      result: {
        accessUrl: string
      }
    }
  }
}

const props = defineProps<{
  info: DataSourceInfo
  sourceData?: any
  sourceClassify?: any
}>()

const router = useRouter()

// 响应式数据
const tableRef = ref()
const commandListRef = ref()
const tableData = ref<any[]>([])
const activeItem = ref<any>(null)
const commands = ref<any[]>([])

const typeId = computed(() => router.currentRoute.value.query.typeId?.toString() || '')

const addDataModal = ref<any>({
  visible: false,
  data: {}
})

const commandModal = ref<any>({
  visible: false,
  preview: false,
  data: {}
})

const debugModal = ref<any>({
  visible: false,
  data: {}
})

// 模态框控制
const closeAddDataModal = () => {
  addDataModal.value.visible = false
}

const closeCommandModal = () => {
  commandModal.value.visible = false
}

const closeDebugModal = () => {
  debugModal.value.visible = false
}

// 刷新数据的通用方法
const refreshData = async () => {
  await handleQueryCommandGroup()
  if (activeItem.value) {
    await handleQueryCommand()
  } else {
    tableData.value = []
  }
}

// 导入数据源处理
const handleImportChange = async (data: ImportData) => {
  try {
    const accessUrl = data.file.response.result.accessUrl
    const res = await importDataSource(props.info.id, typeId.value, {
      fileUrl: accessUrl
    })

    if (res.status === 200) {
      onlyMessage($t('DataSource.DataList.100014-0'))
      await refreshData()
    } else {
      throw new Error($t('DataSource.DataList.100014-1'))
    }
  } catch (error) {
    onlyMessage($t('DataSource.DataList.100014-1'), 'error')
    console.error('Import error:', error)
  }
}

// 选择命令处理
const handleSelectCommand = (item: any) => {
  activeItem.value = item
  handleQueryCommand()
}

// 添加数据处理
const handleAdd = () => {
  addDataModal.value = {
    visible: true,
    data: {}
  }
}

// 卡片点击处理
const handleCardClick = (data: any) => {
  commandModal.value = {
    visible: true,
    preview: true,
    data
  }
}

// 调试按钮点击处理
const handleDebugClick = (data: any) => {
  debugModal.value = {
    visible: true,
    data
  }
}

// 查询命令组
const handleQueryCommandGroup = async (selectId?: string) => {
  try {
    const params = {
      terms: [
        {
          column: 'dataSourceId',
          termType: 'eq',
          value: props.info.id
        },
        {
          column: 'dataSourceTypeId',
          termType: 'eq',
          value: typeId.value
        }
      ],
      sorts: [
        {
          name: 'createTime',
          order: 'desc'
        }
      ]
    }

    const res = await getDatasource(params)
    if (res.status === 200) {
      commands.value = res.result
      if (selectId) {
        await nextTick(() => {
          commandListRef.value?.selectById(selectId)
        })
      }
    }
  } catch (error) {
    console.error('Query command group error:', error)
    onlyMessage($t('DataSource.DataList.100014-4'), 'error')
  }
}

// 保存成功后的处理
const handleSaveSuccess = (savedId: string) => {
  handleQueryCommandGroup(savedId)
}

// 查询命令
const handleQueryCommand = async () => {
  if (!activeItem.value) return

  try {
    const res = await getDataSourceCommands(activeItem.value.dataSourceId, activeItem.value.support)
    if (res.status === 200) {
      tableData.value = res.result
    }
  } catch (error) {
    console.error('Query command error:', error)
    onlyMessage($t('DataSource.DataList.100014-5'), 'error')
  }
}

// 编辑处理
const handleEdit = (item: any) => {
  addDataModal.value = {
    visible: true,
    data: item
  }
}

// 删除处理
const handleDelete = (item: any) => {
  Modal.confirm({
    title: $t('DataSource.DataList.100014-2'),
    content: $t('DataSource.DataList.100014-3'),
    onOk: async () => {
      try {
        const res = await deleteDataSourceCommand(item.id)
        if (res.success) {
          onlyMessage($t('DataSource.List.100002-4'))
          await refreshData()
        } else {
          throw new Error($t('DataSource.List.100002-4'))
        }
      } catch (error) {
        console.error('Delete error:', error)
        onlyMessage($t('DataSource.List.100002-4'), 'error')
      }
    }
  })
}

onMounted(() => {
  handleQueryCommandGroup()
})
</script>

<style lang="less" scoped>
.parameter-container {
  height: 100%;
  display: flex;
}

.divider {
  height: 100%;
  margin: 0;
}

.container {
  padding-left: 20px;
  width: 100%;
  height: 100%;

  :deep(.j-table-empty) {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
