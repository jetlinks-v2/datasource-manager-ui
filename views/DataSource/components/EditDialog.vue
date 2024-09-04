<template>
  <a-modal
      class="edit-dialog-container"
      width="1050px"
      visible
      :title="dialogTitle"
      :confirmLoading="loading"
      @ok="confirm"
      @cancel="emits('cancel')"
  >
    <a-form ref="formRef" :model="form.data" layout="vertical">
      <a-row :gutter="24">
        <a-col :span="12">
          <a-form-item
              name="name"
              label="名称"
              :rules="[
                            { required: true, message: '请输入名称' },
                            { max: 64, message: '最多可输入64个字符' },
                        ]"
          >
            <a-input
                v-model:value="form.data.name"
                placeholder="请输入名称"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
              name="typeId"
              label="类型"
              :rules="[{ required: true, message: '请选择类型' }]"
          >
            <a-select
                v-model:value="form.data.typeId"
                :options="form.typeOptions"
                placeholder="请选择类型"
                :disabled="!!form.data.id"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rdb'">
        <a-col :span="24">
          <a-form-item
              :name="['shareConfig', 'url']"
              label="URL"
              :rules="[
                            {
                                required: true,
                                message: '请输入URL',
                                trigger: 'change',
                            },
                            { validator: checkUrl, trigger: 'blur' },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.url"
                placeholder="请输入r2bdc或者jdbc连接地址，示例：r2dbc:mysql://127.0.0.1:3306/test"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
              :name="['shareConfig', 'adminUrl']"
              label="管理地址"
              :rules="[
                            { required: true, message: '请输入管理地址' },
                            { validator: validateAdminUrl },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.adminUrl"
                placeholder="请输入管理地址，示例：http://localhost:15672"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
              :name="['shareConfig', 'addresses']"
              label="链接地址"
              :rules="[
                            { required: true, message: '请输入链接地址' },
                            { validator: validateAddress },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.addresses"
                placeholder="请输入链接地址，示例：localhost:5672"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-show="form.data.typeId">
        <a-col :span="12">
          <a-form-item
              :name="['shareConfig', 'username']"
              label="用户名"
              :rules="[
                            { required: true, message: '请输入用户名' },
                            {
                                max: 64,
                                message: '最多可输入64个字符',
                            },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.username"
                placeholder="请输入用户名"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
              :name="['shareConfig', 'password']"
              label="密码"
              :rules="[
                            { required: true, message: '请输入密码' },
                            {
                                max: 64,
                                message: '最多可输入64个字符',
                            },
                        ]"
          >
            <a-input-password
                v-model:value="form.data.shareConfig.password"
                placeholder="请输入密码"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
              :name="['shareConfig', 'virtualHost']"
              label="虚拟域"
              :rules="[
                            { required: true, message: '请输入虚拟域' },
                            {
                                max: 64,
                                message: '最多可输入64个字符',
                            },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.virtualHost"
                placeholder="请输入虚拟域"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rdb'">
        <a-col :span="24">
          <a-form-item
              :name="['shareConfig', 'schema']"
              label="schema"
              :rules="[
                            { required: true, message: '请输入schema' },
                            {
                                max: 64,
                                message: '最多可输入64个字符',
                            },
                        ]"
          >
            <a-input
                v-model:value="form.data.shareConfig.schema"
                placeholder="请输入schema"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item name="description" label="说明">
            <a-textarea
                v-model:value="form.data.description"
                placeholder="请输入说明"
                :rows="3"
                showCount
                :maxlength="200"
            />
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import {
  getDataTypeDict_api,
  saveDataSource_api,
} from '../../../api/dataSource';
import {FormInstance} from 'ant-design-vue';
import {Rule} from 'ant-design-vue/lib/form';
import type {dictItemType, optionItemType, sourceItemType} from '../typing';
import {onlyMessage} from '@jetlinks-web/utils'

const emits = defineEmits(['confirm', 'cancel']);
const props = defineProps<{
  data: sourceItemType;
}>();
// 弹窗相关
const dialogTitle = computed(() =>
    props.data.id ? '编辑数据源' : '新增数据源',
);
const loading = ref(false);

const checkUrl = (_rule: Rule, value: string): Promise<any> => {
  if (!value) return Promise.resolve();
  const arr = value.split(':');
  if (arr?.[0] === 'jdbc' || arr?.[0] === 'r2dbc') {
    return Promise.resolve();
  } else {
    return Promise.reject('请输入正确的URL');
  }
};

/**
 * 管理地址校验
 */
const validateAdminUrl = (_rule: Rule, value: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!value) {
      resolve('');
    } else {
      const arr = value.split('://');
      if (arr[0] === 'http' || arr[0] === 'https') {
        resolve('');
      } else {
        reject('请输入正确的管理地址');
      }
    }
  });
};
/**
 * 链接地址校验
 * @param _rule
 * @param value
 */
const validateAddress = (_rule: Rule, value: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!value) {
      resolve('');
    } else {
      const reg =
          /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
      if (reg.test(value)) {
        resolve('');
      } else {
        reject('请输入正确的链接地址');
      }
    }
  });
};

const getTypeOption = () => {
  getDataTypeDict_api().then((resp: any) => {
    const result = resp.result as dictItemType[];
    const options: any = []
    result.forEach((item) => {
      if (item.name !== 'redis') {
        options.push({
          label: item.name,
          value: item.id,
        })
      }
    });
    form.typeOptions = options
  });
};

const formRef = ref<FormInstance>();
const form = reactive({
  data: {
    ...props.data,
  } as sourceItemType,
  typeOptions: [] as optionItemType[],
});

watch(
    () => props.data,
    (newValue) => {
      form.data = {...newValue, shareConfig: {...newValue?.shareConfig}};
    },
    {
      immediate: true,
      deep: true,
    },
);

onMounted(() => {
  getTypeOption();
});

const confirm = () => {
  loading.value = true;
  formRef.value
      ?.validate()
      .then(async (_data: any) => {
        const resp = await saveDataSource_api({...props.data, ..._data});
        if (resp.status === 200) {
          onlyMessage('操作成功');
          emits('confirm');
          formRef.value?.resetFields();
        }
      })
      .finally(() => {
        loading.value = false;
      });
};
</script>
