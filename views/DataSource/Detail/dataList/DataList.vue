<template>
  <div class="parameter-container">
    <CommandList
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
          />
        </template>
      </JProTable>
    </div>
  </div>

  <AddData
    v-if="addDataModal.visible"
    :data="addDataModal.data"
    :info="info"
    @ok="handleQueryCommandGroup"
    @cancel="closeAddDataModal"
  />

  <CommandModal
    v-if="commandModal.visible"
    :data="commandModal.data"
    :preview="commandModal.preview"
    @cancel="closeCommandModal"
  />
</template>

<script lang="ts" name="DataList" setup>
import { Modal } from 'ant-design-vue'
import { onlyMessage } from '@jetlinks-web/utils'
import AddData from './AddData/index.vue'
import TableCard from './AddData/components/TableCard.vue'
import CommandList from './AddData/components/CommandList.vue'
import CommandModal from './AddData/components/CommandModal.vue'

import {
  deleteDataSourceCommand,
  importDataSource,
  getDatasource,
  getDataSourceCommands
} from '@datasource-manager-ui/api/data/datasource'

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

// 模态框控制
const closeAddDataModal = () => {
  addDataModal.value.visible = false
}

const closeCommandModal = () => {
  commandModal.value.visible = false
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
      onlyMessage('导入成功')
      await refreshData()
    } else {
      throw new Error('导入失败')
    }
  } catch (error) {
    onlyMessage('导入失败', 'error')
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

// 查询命令组
const handleQueryCommandGroup = async () => {
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
    }
  } catch (error) {
    console.error('Query command group error:', error)
    onlyMessage('查询命令组失败', 'error')
  }
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
    onlyMessage('查询命令失败', 'error')
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
    title: '提示',
    content: '该操作将删除功能，是否确认删除？',
    onOk: async () => {
      try {
        const res = await deleteDataSourceCommand(item.id)
        if (res.success) {
          onlyMessage('删除成功')
          await refreshData()
        } else {
          throw new Error('删除失败')
        }
      } catch (error) {
        console.error('Delete error:', error)
        onlyMessage('删除失败', 'error')
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
}
</style>
