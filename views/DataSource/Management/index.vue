<template>
  <j-page-container>
    <FullPage>
      <div class="manager-container">
        <div class="left">
          <a-input-search
              v-model:value="leftData.searchValue"
              placeholder="请输入"
              style="margin-bottom: 24px"
          />
          <!-- 使用v-if用于解决异步加载数据后不展开的问题 -->
          <div class="tree">
            <a-tree
                v-if="leftData.treeData.length > 0"
                defaultExpandAll
                :tree-data="leftData.treeData"
                v-model:selectedKeys="leftData.selectedKeys"
                @select="onSelect"
                :showLine="{ showLeafIcon: false }"
                :show-icon="true"
            >
              <template #title="{ dataRef }">
                <j-ellipsis>
                  <div
                      v-if="dataRef.root"
                      style="
                                            justify-content: space-between;
                                            display: flex;
                                            align-items: center;
                                            width: 200px;
                                        "
                  >
                                        <span>
                                            {{ dataRef.title }}
                                        </span>
                    <AIcon
                        type="PlusOutlined"
                        style="color: #1677ff"
                        @click="addTable"
                    />
                  </div>
                  <span v-else>
                                        {{ dataRef.title }}
                                    </span>
                </j-ellipsis>
              </template>
            </a-tree>
          </div>
        </div>
        <div class="right">
          <div class="btns">
            <a-button type="primary" @click="clickSave"
            >保存
            </a-button
            >
          </div>
          <a-form ref="formRef" :model="table">
            <a-table
                :columns="columns"
                :dataSource="table.data"
                :pagination="false"
                :scroll="{ y: 500 }"
            >
              <template #bodyCell="{ column, record, index }">
                <template v-if="column.key === 'name'">
                  <a-form-item
                      :name="['data', index, 'name']"
                      :rules="[
                                            {
                                                max: 64,
                                                message: '最多可输入64个字符',
                                            },
                                            {
                                                required: true,
                                                message: '请输入名称',
                                            },
                                        ]"
                  >
                    <a-input
                        :disabled="record.old_id"
                        v-model:value="record.name"
                        placeholder="请输入名称"
                    />
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'type'">
                  <a-form-item
                      :name="['data', index, 'type']"
                      :rules="[
                                            {
                                                max: 64,
                                                message: '最多可输入64个字符',
                                            },
                                            {
                                                required: true,
                                                message: '请输入类型',
                                            },
                                        ]"
                  >
                    <a-input
                        :disabled="record.old_id"
                        v-model:value="record.type"
                        placeholder="请输入类型"
                    />
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'length'">
                  <a-form-item
                      :name="['data', index, 'length']"
                  >
                    <a-input-number
                        v-model:value="record.length"
                        :min="0"
                        :max="99999"
                        style="width: 100%"
                    />
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'scale'">
                  <a-form-item
                      :name="['data', index, 'scale']"
                  >
                    <a-input-number
                        v-model:value="record.scale"
                        :min="0"
                        :max="99999"
                        style="width: 100%"
                    />
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'notnull'">
                  <a-form-item
                      :name="['data', index, 'notnull']"
                      :rules="[
                                            {
                                                required: true,
                                                message: '请选择是否不能为空',
                                            },
                                        ]"
                  >
                    <a-radio-group
                        v-model:value="record.notnull"
                        button-style="solid"
                    >
                      <a-radio-button :value="true"
                      >是
                      </a-radio-button
                      >
                      <a-radio-button :value="false"
                      >否
                      </a-radio-button
                      >
                    </a-radio-group>
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'comment'">
                  <a-form-item
                      :name="['data', index, 'comment']"
                  >
                    <a-input
                        v-model:value="record.comment"
                        placeholder="请输入说明"
                    />
                  </a-form-item>
                </template>
                <template v-else-if="column.key === 'action'">
                  <j-permission-button
                      hasPermission="system/DataSource:delete"
                      type="link"
                      :tooltip="{ title: '删除' }"
                      :danger="true"
                      :popConfirm="{
                                            title: `确认删除`,
                                            onConfirm: () =>
                                                clickDel(record, index),
                                        }"
                      :disabled="record.status"
                  >
                    <AIcon type="DeleteOutlined"/>
                  </j-permission-button>
                </template>
              </template>
            </a-table>
          </a-form>

          <a-button class="add-row" @click="addRow">
            <AIcon type="PlusOutlined"/>
            新增行
          </a-button>
        </div>
      </div>
    </FullPage>
    <a-modal
        :visible="true"
        v-if="dialog.visible"
        title="新增"
        @ok="handleOk"
        @cancel="handleCancel"
    >
      <a-form :model="dialog.form" ref="addFormRef" :layout="'vertical'">
        <a-form-item
            label="名称"
            name="name"
            :required="true"
            :rules="[
                        {
                            required: true,
                            message: '请输入名称',
                        },
                        {
                            max: 64,
                            message: '最多可输入64个字符',
                            trigger: 'change',
                        },
                        {
                            // pattern: /^[0-9].*$/,
                            // message: '不能以数字开头',
                            trigger: 'change',
                            validator: checkName,
                        },
                        {
                            pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                            message: '名称只能由英文、汉字、下划线、数字组成',
                            trigger: 'change',
                        },
                    ]"
        >
          <a-input
              v-model:value="dialog.form.name"
              placeholder="请输入名称"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </j-page-container>
</template>

<script setup lang="ts" name="Management">
import {
  getDataSourceInfo_api,
  rdbTree_api,
  rdbTables_api,
  saveTable_api,
  delSaveRow_api,
} from '../../../api/dataSource';
import {onlyMessage} from '@jetlinks-web/utils';
import {randomString} from '../../../utills/utils';
import {FormInstance} from 'ant-design-vue';
import _, {cloneDeep} from 'lodash-es';
import type {dbColumnType, dictItemType, sourceItemType} from '../typing';

const id = useRoute().query.id as string;

const columns = [
  {
    title: '列名',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '长度',
    dataIndex: 'length',
    key: 'length',
  },
  {
    title: '精度',
    dataIndex: 'scale',
    key: 'scale',
  },
  {
    title: '不能为空',
    dataIndex: 'notnull',
    key: 'notnull',
    width: 130,
  },
  {
    title: '说明',
    dataIndex: 'comment',
    key: 'comment',
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
  },
];
const formRef = ref();

const getInfo = (_id: string) => {
  getDataSourceInfo_api(_id).then((resp: any) => {
    info.data = resp.result;
  });
};

const info = reactive({
  data: {} as sourceItemType,
});

const leftData = reactive({
  searchValue: '',
  sourceTree: [] as dictItemType[],
  treeData: [] as any[],
  selectedKeys: [] as string[],
  oldKey: '',
});

const queryTables = (key: string) => {
  if (key) {
    rdbTables_api(id, key).then((resp: any) => {
      table.data = resp.result.columns.map(
          (item: object, index: number) => ({
            old_id: randomString(),
            ...item,
            index,
          }),
      );
    });
  }
};

const handleSearch = (refresh?: boolean) => {
  rdbTree_api(id)
      .then((resp: any) => {
        if (resp.status === 200) {
          leftData.sourceTree = resp.result;
          if (refresh) {
            leftData.selectedKeys = [resp.result[0]?.name];
            queryTables(resp.result[0]?.name);
          } else {
            queryTables(leftData.selectedKeys[0]);
          }
        }
      })
      .catch(() => {
      });
};

const onSelect = (selectedKeys: string[], e?: any) => {
  if (e?.node?.root) {
    leftData.selectedKeys = [leftData.oldKey];
    return;
  }
  if (!selectedKeys[0]) {
    return;
  }
  leftData.oldKey = selectedKeys[0];
  const key = selectedKeys[0];
  queryTables(key);
};

const addTable = (e: Event) => {
  e?.stopPropagation();
  dialog.visible = true;
};

watch(
    () => id,
    (newId) => {
      if (newId) {
        getInfo(newId);
        handleSearch(true);
      }
    },
    {
      immediate: true,
    },
);

const table = reactive({
  data: [] as dbColumnType[],
});

const addRow = () => {
  const initData: dbColumnType = {
    scale: 0,
    length: 0,
    notnull: false,
    type: '',
    comment: '',
    name: '',
  };
  table.data.push(initData);
};

const clickDel = (row: any, index: number) => {
  if (row.scale !== undefined) {
    const response = delSaveRow_api(id, leftData.selectedKeys[0], [
      row.name,
    ]);
    response.then((resp: any) => {
      if (resp.status === 200) {
        table.data.splice(index, 1);
      }
    });
    return response;
  } else {
    table.data.splice(index, 1);
  }
};

const clickSave = () => {
  formRef.value.validate().then((_data: any) => {
    const columns = cloneDeep(table.data);
    columns.forEach((item: any) => {
      delete item?.old_id;
      delete item?.index;
    });
    if (!columns.length) {
      onlyMessage('请配置数据源字段', 'error');
      return;
    }
    const params = {
      name: leftData.selectedKeys[0],
      columns,
    };
    saveTable_api(id, params).then((resp) => {
      if (resp.status === 200) {
        onlyMessage('操作成功');
        queryTables(params.name);
      }
    });
  });
};

const addFormRef = ref<FormInstance>();
const dialog = reactive({
  visible: false,
  form: {
    name: '',
  },
});

const handleOk = () => {
  addFormRef.value &&
  addFormRef.value.validate().then(() => {
    const name = dialog.form.name;
    leftData.sourceTree.unshift({
      id: name,
      name,
    });
    leftData.oldKey = name;
    leftData.selectedKeys = [name];
    table.data = [];
    dialog.visible = false;
    addFormRef.value?.resetFields();
  });
  saveTable_api(id, {
    name: dialog.form.name,
    columns: [],
  }).then((resp) => {
    if (resp.status === 200) {
      onlyMessage('操作成功');
    }
  });
};

const handleCancel = () => {
  dialog.visible = false;
  addFormRef.value?.resetFields();
};

watch(
    [() => leftData.searchValue, () => leftData.sourceTree],
    ([m, n]) => {
      if (!!m) {
        const list = n.filter((item) => {
          return item.name.includes(m);
        });
        leftData.treeData = [
          {
            title: info.data.shareConfig?.schema,
            key: info.data.shareConfig?.schema,
            root: true,
            children: list.map((item) => ({
              title: item.name,
              key: item.name,
            })),
          },
        ];
        if (!_.map(list, 'name').includes(leftData.selectedKeys[0])) {
          leftData.selectedKeys = [list[0]?.name];
          queryTables(list[0]?.name);
        }
      } else {
        leftData.treeData = [
          {
            title: info.data.shareConfig?.schema,
            key: info.data.shareConfig?.schema,
            root: true,
            children: leftData.sourceTree.map((item) => ({
              title: item.name,
              key: item.name,
            })),
          },
        ];
      }
    },
    {deep: true},
);

const checkName = (_: any, value: any) =>
    new Promise((resolve, reject) => {
      if (value) {
        const first = value.slice(0, 1);
        if (typeof Number(first) === 'number' && !isNaN(Number(first))) {
          reject('不能以数字开头');
        } else {
          resolve('');
        }
      } else {
        resolve('');
      }
    });
</script>

<style lang="less" scoped>
.manager-container {
  padding: 24px;
  background-color: #fff;
  display: flex;
  height: 100%;

  .left {
    flex-basis: 280px;
    padding: 0 24px;
    box-sizing: border-box;
    width: 300px;
    height: 100%;

    .tree {
      height: 680px;
      overflow-y: auto;
    }
  }

  .right {
    width: calc(100% - 280px);
    box-sizing: border-box;
    border-left: 1px solid #f0f0f0;
    padding-left: 24px;

    .btns {
      display: flex;
      justify-content: right;
    }

    .add-row {
      display: block;
      text-align: center;
      width: 100%;
      margin: 24px 0;
      cursor: pointer;
    }

    .ant-form-item {
      margin-bottom: 0;
    }
  }
}
</style>
