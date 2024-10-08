<template>
  <j-page-container>
    <div class="data-source-container">
      <pro-search
          :columns="columns"
          target="system-data-source"
          @search="(params:any)=>queryParams = {...params}"
      />
      <FullPage>
        <j-pro-table
            ref="tableRef"
            :columns="columns"
            :request="getDataSourceList_api"
            mode="TABLE"
            :params="queryParams"
            :defaultParams="{
                        sorts: [{ name: 'createTime', order: 'desc' }],
                    }"
        >
          <template #headerLeftRender>
            <j-permission-button
                type="primary"
                :hasPermission="`${permission}:add`"
                @click="table.openDialog({})"
            >
              <AIcon type="PlusOutlined"/>
              新增
            </j-permission-button>
          </template>
          <template #state="slotProps">
            <j-badge-status
                :status="slotProps.state?.value"
                :text="slotProps.state?.text"
                :statusNames="{
                                enabled: 'processing',
                                disabled: 'error',
                            }"
            >
            </j-badge-status>
          </template>
          <template #typeId="slotProps">
            {{
              (table.typeOptions.value.length &&
                  table.getTypeLabel(slotProps.typeId)) ||
              ''
            }}
          </template>
          <template #action="slotProps">
            <a-space :size="16">
              <j-permission-button
                  :hasPermission="`${permission}:update`"
                  type="link"
                  :tooltip="{
                                    title: '编辑',
                                }"
                  @click="table.openDialog(slotProps)"
              >
                <AIcon type="EditOutlined"/>
              </j-permission-button>
              <j-permission-button
                  :hasPermission="`${permission}:manage`"
                  type="link"
                  :tooltip="{
                                    title:
                                        slotProps?.typeId === 'rabbitmq'
                                            ? '暂不支持管理功能'
                                            : table.getRowStatus(slotProps)
                                            ? '管理'
                                            : '请先启用数据源',
                                }"
                  @click="jump(slotProps)"
                  :disabled="
                                    slotProps?.typeId === 'rabbitmq' ||
                                    !table.getRowStatus(slotProps)
                                "
              >
                <AIcon type="icon-ziyuankuguanli"/>
              </j-permission-button>
              <j-permission-button
                  :hasPermission="`${permission}:action`"
                  type="link"
                  :popConfirm="{
                                    title: `确认${
                                        table.getRowStatus(slotProps)
                                            ? '禁用'
                                            : '启用'
                                    }？`,
                                    onConfirm: () =>
                                        table.clickChangeStatus(slotProps),
                                }"
                  :tooltip="{
                                    title: table.getRowStatus(slotProps)
                                        ? '禁用'
                                        : '启用',
                                }"
              >
                <AIcon
                    :type="
                                        table.getRowStatus(slotProps)
                                            ? 'StopOutlined'
                                            : 'PlayCircleOutlined'
                                    "
                />
                <!-- <AIcon type="PlayCircleOutlined" /> -->
              </j-permission-button>

              <j-permission-button
                  :hasPermission="`${permission}:delete`"
                  type="link"
                  :tooltip="{
                                    title: table.getRowStatus(slotProps)
                                        ? '请先禁用，再删除'
                                        : '删除',
                                }"
                  :danger="true"
                  :popConfirm="{
                                    title: `确认删除`,
                                    onConfirm: () => table.clickDel(slotProps),
                                }"
                  :disabled="table.getRowStatus(slotProps)"
              >
                <AIcon type="DeleteOutlined"/>
              </j-permission-button>
            </a-space>
          </template>
        </j-pro-table>
      </FullPage>

      <EditDialog
          v-if="dialog.visible"
          @cancel="table.cancel"
          :data="dialog.selectItem"
          @confirm="table.refresh"
      />
    </div>
  </j-page-container>
</template>

<script setup lang="ts" name="DataSource">
import EditDialog from './components/EditDialog.vue';

import type {dictItemType, optionItemType, sourceItemType} from './typing';

import {
  getDataSourceList_api,
  getDataTypeDict_api,
  changeStatus_api,
  delDataSource_api,
} from '../../api/dataSource';
import {onlyMessage} from '@jetlinks-web/utils';
import {useMenuStore} from "@/store";

const permission = 'system/DataSource';

const router = useRouter();
const menuStory = useMenuStore();

const columns = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    search: {
      type: 'string',
    },
    width: '250px',
  },
  {
    title: '类型',
    dataIndex: 'typeId',
    key: 'typeId',
    search: {
      type: 'select',
      options: () =>
          new Promise((resolve) => {
            if (table.typeOptions.value.length > 0)
              return resolve(table.typeOptions.value);
            getDataTypeDict_api().then((resp: any) => {
              const result = resp.result as dictItemType[];
              resolve(
                  result.map((item) => ({
                    label: item.name,
                    value: item.id,
                  })),
              );
            });
          }),
    },
    scopedSlots: true,
  },
  {
    title: '说明',
    dataIndex: 'description',
    key: 'description',
    search: {
      type: 'string',
    },
    ellipsis: true,
  },
  {
    title: '状态',
    dataIndex: 'state',
    key: 'state',
    search: {
      type: 'select',
      options: [
        {
          label: '正常',
          value: 'enabled',
        },
        {
          label: '禁用',
          value: 'disabled',
        },
      ],
    },
    scopedSlots: true,
    width: '120px',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    scopedSlots: true,
    width: '160px',
    fixed: 'right',
  },
];
const queryParams = ref({});

const tableRef = ref<Record<string, any>>({}); // 表格实例
const table = {
  typeOptions: ref<optionItemType[]>([]),

  getTypeOption: () => {
    getDataTypeDict_api().then((resp: any) => {
      const result = resp.result as dictItemType[];
      table.typeOptions.value = result.map((item) => ({
        label: item.name,
        value: item.id,
      }));
    });
  },
  getTypeLabel: (val: string): string => {
    const options = table.typeOptions.value;
    if (options.length < 1 || val === '') return '';
    return options.find((item) => item.value === val)?.label || '';
  },

  getRowStatus: (row: sourceItemType) => {
    return row.state?.value === 'enabled';
  },
  // 打开编辑弹窗
  openDialog: (row: sourceItemType | {}) => {
    dialog.selectItem = {shareConfig: {}, ...row};
    dialog.visible = true;
  },
  // 删除
  clickDel: (row: sourceItemType) => {
    const response = delDataSource_api(row.id as string)
    response.then((resp: any) => {
      if (resp.status === 200) {
        tableRef.value?.reload();
        onlyMessage('操作成功!');
      }
    });
    return response
  },
  clickChangeStatus: (row: sourceItemType) => {
    const status = row.state.value === 'enabled' ? '_disable' : '_enable';
    const response = changeStatus_api(row.id as string, status);
    response.then(() => {
      onlyMessage('操作成功');
      table.refresh();
    });
    return response;
  },
  // 刷新列表
  refresh: () => {
    tableRef.value.reload();
    dialog.visible = false;
    dialog.selectItem = {};
  },
  cancel: () => {
    dialog.visible = false;
    dialog.selectItem = {};
  },
};
table.getTypeOption();

const jump = (slotProps) => {
  menuStory.jumpPage('system/DataSource/Management', {params: {id: slotProps.id}, query: {id: slotProps.id}});
}

const dialog = reactive({
  visible: false,
  selectItem: {} as any,
});
</script>

<style lang="less" scoped>
.data-source-container {
  :deep(.ant-table-cell) {
    .ant-btn-link {
      padding: 0;
    }
  }
}
</style>
