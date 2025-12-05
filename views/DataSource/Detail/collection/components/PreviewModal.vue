<template>
  <div>
    <Teleport to="body">
      <div
        v-if="props.open"
        class="preview-modal-mask"
        @click="handleClose"
      ></div>
    </Teleport>

    <a-popover
      :open="props.open"
      :trigger="[]"
      destroy-tooltip-on-hide
      placement="left"
      overlay-class-name="preview-popover-overlay"
    >
      <template #content>
        <div
          class="preview-content"
          @click.stop
        >
          <a-segmented
            v-model:value="activeTab"
            :options="tabOptions"
            block
            class="preview-tabs"
          />
          <div class="preview-body">
            <div
              v-show="activeTab === 'table'"
              class="tab-content"
            >
              <CommandTable
                v-if="tableData.length > 0"
                :data-source="tableData"
                :columns="columns"
                :preview="true"
                :add-button="false"
                :show-expand-column="true"
                :scroll="{ y: 380 }"
              />
              <a-empty v-else />
            </div>
            <div
              v-show="activeTab === 'json'"
              class="tab-content"
            >
              <JsonEditor
                v-model="jsonData"
                :read-only="true"
                height="430px"
                :show-format-btn="false"
                :show-minimap="false"
              />
            </div>
          </div>
        </div>
      </template>
      <slot />
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import { convertToTableTreeData } from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/utils'
import CommandTable from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/CommandParams/CommandTable.vue'
import JsonEditor from '@datasource-manager-ui/views/DataSource/Detail/dataList/AddData/components/JsonEditor.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

interface Props {
  open: boolean
  rawData: any
}

const props = defineProps<Props>()
const emit = defineEmits(['update:open'])

const activeTab = ref('table')

const tabOptions = [
  { label: $t('DataSource.Detail.Collection.Preview.TableStructure'), value: 'table' },
  { label: $t('DataSource.Detail.Collection.Preview.JsonSchema'), value: 'json' }
]

const columns = [
  { title: $t('DataSource.Detail.Collection.Preview.Column.Identifier'), dataIndex: 'id', key: 'id', width: '30%' },
  { title: $t('DataSource.Detail.Collection.Preview.Column.Name'), dataIndex: 'name', key: 'name', width: '30%' },
  { title: $t('DataSource.Detail.Collection.Preview.Column.DataType'), dataIndex: 'dataType', key: 'dataType', width: '40%' }
]

const tableData = computed(() => (props.rawData ? convertToTableTreeData(props.rawData) : []))

const jsonData = computed(() => (props.rawData ? JSON.stringify(props.rawData, null, 2) : '{}'))

const handleClose = () => {
  emit('update:open', false)
  activeTab.value = 'table'
}
</script>

<style scoped lang="less">
.preview-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.45);
}

.preview-content {
  width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.preview-tabs {
  margin: 16px 16px 12px;
}

.preview-body {
  flex: 1;
  overflow: hidden;
  padding: 0 16px 16px;
  min-height: 450px;
}

.tab-content {
  height: 100%;
  overflow: hidden;
}
</style>
