<template>
  <j-page-container>
    <FullPage>
      <div class="manager-container">
        <div class="left">
          <a-input-search
            v-model:value="leftData.searchValue"
            :placeholder="$t('Management.index.799232-0')"
            style="margin-bottom: 24px"
          />
          <!-- 使用v-if用于解决异步加载数据后不展开的问题 -->
          <div class="tree">
            <a-tree
              v-if="treeData.length > 0"
              defaultExpandAll
              :tree-data="treeData"
              v-model:selectedKeys="leftData.selectedKeys"
              @select="onSelect"
              :showLine="{ showLeafIcon: false }"
              :show-icon="true"
              v-model:expandedKeys="leftData.expandedKeys"
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
          <div v-if="leftData.sourceTree?.length || dialog.visible">
            <a-form ref="formRef" :model="table" layout="vertical">
              <a-form-item
                  :label="$t('Management.index.799232-13')"
                  name="name"
                  validate-first
                  :rules="[
                  {
                    required: true,
                    message: $t('Management.index.799232-3'),
                  },
                  {
                    max: 64,
                    message: $t('Management.index.799232-2'),
                    trigger: 'change',
                  },
                  {
                    trigger: 'change',
                    validator: checkName,
                  },
                  {
                    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
                    message: $t('Management.index.799232-14'),
                    trigger: 'change',
                  },
              ]"
              >
                <a-input :disabled="!dialog.visible" v-model:value="table.name" :placeholder="$t('Management.index.799232-3')" />
              </a-form-item>
              <div class="ant-form-item-label">
                <label class="ant-form-item-required">{{ $t('Management.index.799232-25') }}</label>
              </div>
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
                        message: $t('Management.index.799232-2'),
                      },
                      {
                        required: true,
                        message: $t('Management.index.799232-3'),
                      },
                    ]"
                    >
                      <a-input
                          :disabled="record.old_id"
                          v-model:value="record.name"
                          :placeholder="$t('Management.index.799232-3')"
                      />
                    </a-form-item>
                  </template>
                  <template v-else-if="column.key === 'type'">
                    <a-form-item
                        :name="['data', index, 'type']"
                        :rules="[
                      {
                        max: 64,
                        message: $t('Management.index.799232-2'),
                      },
                      {
                        required: true,
                        message: $t('Management.index.799232-4'),
                      },
                    ]"
                    >
                      <a-input
                          :disabled="record.old_id"
                          v-model:value="record.type"
                          :placeholder="$t('Management.index.799232-4')"
                      />
                    </a-form-item>
                  </template>
                  <template v-else-if="column.key === 'length'">
                    <a-form-item :name="['data', index, 'length']">
                      <a-input-number
                          v-model:value="record.length"
                          :min="0"
                          :max="99999"
                          style="width: 100%"
                      />
                    </a-form-item>
                  </template>
                  <template v-else-if="column.key === 'scale'">
                    <a-form-item :name="['data', index, 'scale']">
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
                        message: $t('Management.index.799232-5'),
                      },
                    ]"
                    >
                      <a-radio-group
                          v-model:value="record.notnull"
                          button-style="solid"
                      >
                        <a-radio-button :value="true">{{ $t('Management.index.799232-6') }} </a-radio-button>
                        <a-radio-button :value="false">{{ $t('Management.index.799232-7') }} </a-radio-button>
                      </a-radio-group>
                    </a-form-item>
                  </template>
                  <template v-else-if="column.key === 'comment'">
                    <a-form-item :name="['data', index, 'comment']">
                      <a-input
                          v-model:value="record.comment"
                          :placeholder="$t('Management.index.799232-8')"
                      />
                    </a-form-item>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <j-permission-button
                        hasPermission="system/DataSource:delete"
                        type="link"
                        :tooltip="{ title: $t('Management.index.799232-9') }"
                        :danger="true"
                        :popConfirm="{
                      title: $t('Management.index.799232-10'),
                      onConfirm: () => clickDel(record, index),
                    }"
                        :disabled="record.status"
                    >
                      <AIcon type="DeleteOutlined" />
                    </j-permission-button>
                  </template>
                </template>
              </a-table>
            </a-form>

            <a-button class="add-row" @click="addRow">
              <AIcon type="PlusOutlined" />
              {{ $t('Management.index.799232-11') }}
            </a-button>

            <div class="btns">
              <a-button :loading="loading" type="primary" @click="clickSave">{{ $t('Management.index.799232-1') }} </a-button>
            </div>
          </div>
          <div v-else style="margin-top: 200px">
            <j-empty />
          </div>
        </div>
      </div>
    </FullPage>
  </j-page-container>
</template>

<script setup lang="ts" name="Management">
import {
  getDataSourceInfo_api,
  rdbTree_api,
  rdbTables_api,
  saveTable_api,
  delSaveRow_api,
} from "../../../api/dataSource";
import { onlyMessage } from "@jetlinks-web/utils";
import { randomString } from "../../../utills/utils";
import { cloneDeep } from "lodash-es";
import type { dbColumnType, dictItemType, sourceItemType } from "../typing";
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const id = useRoute().query.id as string;

const columns = [
  {
    title: $t('Management.index.799232-15'),
    dataIndex: "name",
    key: "name",
  },
  {
    title: $t('Management.index.799232-16'),
    dataIndex: "type",
    key: "type",
  },
  {
    title: $t('Management.index.799232-17'),
    dataIndex: "length",
    key: "length",
  },
  {
    title: $t('Management.index.799232-18'),
    dataIndex: "scale",
    key: "scale",
  },
  {
    title: $t('Management.index.799232-19'),
    dataIndex: "notnull",
    key: "notnull",
    width: 170,
  },
  {
    title: $t('Management.index.799232-20'),
    dataIndex: "comment",
    key: "comment",
  },
  {
    title: $t('Management.index.799232-21'),
    dataIndex: "action",
    key: "action",
  },
];
const formRef = ref();
const loading = ref(false);
const info = reactive({
  data: {} as sourceItemType,
});

const leftData = reactive({
  searchValue: "",
  sourceTree: [] as dictItemType[],
  selectedKeys: [] as string[],
  expandedKeys: [] as string[],
  oldKey: "",
});

const table = reactive({
  data: [] as dbColumnType[],
  name: undefined
});
const dialog = reactive({
  visible: false,
});
const getInfo = (_id: string) => {
  getDataSourceInfo_api(_id).then((resp: any) => {
    info.data = resp.result;
    leftData.expandedKeys = [info.data.shareConfig?.schema]
  });
};

const treeData = computed(() => {
  const list = leftData.sourceTree.filter((item) => {
    return !leftData.searchValue || item.name.includes(leftData.searchValue);
  });
  return [
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
})

// 查询表格字段
const queryTables = (key: string) => {
  if (key) {
    rdbTables_api(id, key).then((resp: any) => {
      table.data = (resp.result?.columns || []).map((item: any, index: number) => ({
        old_id: randomString(),
        ...item,
        index,
      }));
      table.name = resp.result?.name || key
    });
  }
};

const handleSearch = (refresh?: boolean) => {
  rdbTree_api(id)
    .then((resp: any) => {
      if (resp.success) {
        leftData.sourceTree = resp.result;
        if (refresh) {
          leftData.selectedKeys = [resp.result[0]?.name];
          queryTables(resp.result[0]?.name);
        } else {
          queryTables(leftData.selectedKeys[0]);
        }
      }
    })
    .catch(() => {});
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
  formRef.value?.clearValidate()
};

const addTable = (e: Event) => {
  e?.stopPropagation();
  dialog.visible = true;
  leftData.selectedKeys = []
  table.data = []
  table.name = undefined
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
  }
);

const addRow = () => {
  const initData: dbColumnType = {
    scale: 0,
    length: 0,
    notnull: false,
    type: "",
    comment: "",
    name: "",
  };
  table.data.push(initData);
};

const clickDel = (row: any, index: number) => {
  if (row.scale !== undefined) {
    const response = delSaveRow_api(id, leftData.selectedKeys[0], [row.name]);
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
      onlyMessage($t('Management.index.799232-22'), "error");
      return;
    }
    const params = {
      name: _data.name,
      columns,
    };
    loading.value = true
    saveTable_api(id, params).then((resp) => {
      if (resp.success) {
        onlyMessage($t('Management.index.799232-23'));
        leftData.selectedKeys[0] = _data.name
        handleSearch()
        dialog.visible = false
      }
    }).finally(() => {
      loading.value = false
    })
  });
};

const checkName = (_, value) => new Promise((resolve, reject) => {
  if (value) {
    const first = value.slice(0, 1);
    if (typeof Number(first) === "number" && !isNaN(Number(first))) {
      reject($t('Management.index.799232-24'));
    } else {
      resolve("");
    }
  } else {
    resolve("");
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
    display: flex;
    flex-direction: column;
    width: 300px;
    height: 100%;

    .tree {
      min-height: 0;
      flex: 1;
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
      //justify-content: right;
    }

    .add-row {
      display: block;
      text-align: center;
      width: 100%;
      margin: 24px 0;
      cursor: pointer;
    }
  }
}
</style>
