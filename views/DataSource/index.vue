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
              {{ $t('DataSource.index.625668-0') }}
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
                                    title: $t('DataSource.index.625668-1'),
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
                                            ? $t('DataSource.index.625668-2')
                                            : table.getRowStatus(slotProps)
                                            ? $t('DataSource.index.625668-3')
                                            : $t('DataSource.index.625668-4'),
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
                                    title: $t('DataSource.index.625668-5', [
                                        table.getRowStatus(slotProps)
                                            ? $t('DataSource.index.625668-6')
                                            : $t('DataSource.index.625668-7')
                                    ]),
                                    onConfirm: () =>
                                        table.clickChangeStatus(slotProps),
                                }"
                  :tooltip="{
                                    title: table.getRowStatus(slotProps)
                                        ? $t('DataSource.index.625668-6')
                                        : $t('DataSource.index.625668-7'),
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
                                        ? $t('DataSource.index.625668-8')
                                        : $t('DataSource.index.625668-9'),
                                }"
                  :danger="true"
                  :popConfirm="{
                                    title: $t('DataSource.index.625668-10'),
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
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const permission = 'system/DataSource';

const router = useRouter();
const menuStory = useMenuStore();

const columns = [
  {
    title: $t('DataSource.index.625668-11'),
    dataIndex: 'name',
    key: 'name',
    search: {
      type: 'string',
    },
    width: '250px',
  },
  {
    title: $t('DataSource.index.625668-12'),
    dataIndex: 'typeId',
    key: 'typeId',
    search: {
      type: 'select',
      options: () =>
          new Promise((resolve) => {
            if (table.typeOptions.value.length > 0) {
              resolve(table.typeOptions.value.filter(item => !['redis', 'api'].includes(item.value)));
            } else {
              getDataTypeDict_api().then((resp: any) => {
                const result = resp.result as dictItemType[];
                resolve(
                    result.filter(item => !['redis', 'api'].includes(item.id)).map((item) => ({
                      label: item.name,
                      value: item.id,
                    })),
                );
              });
            }
          }),
    },
    scopedSlots: true,
  },
  {
    title: $t('DataSource.index.625668-13'),
    dataIndex: 'description',
    key: 'description',
    search: {
      type: 'string',
    },
    ellipsis: true,
  },
  {
    title: $t('DataSource.index.625668-14'),
    dataIndex: 'state',
    key: 'state',
    search: {
      type: 'select',
      options: [
        {
          label: $t('DataSource.index.625668-15'),
          value: 'enabled',
        },
        {
          label: $t('DataSource.index.625668-6'),
          value: 'disabled',
        },
      ],
    },
    scopedSlots: true,
    width: '120px',
  },
  {
    title: $t('DataSource.index.625668-16'),
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
        onlyMessage($t('DataSource.index.625668-17'));
      }
    });
    return response
  },
  clickChangeStatus: (row: sourceItemType) => {
    const status = row.state.value === 'enabled' ? '_disable' : '_enable';
    const response = changeStatus_api(row.id as string, status);
    response.then(() => {
      onlyMessage($t('DataSource.index.625668-18'));
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
