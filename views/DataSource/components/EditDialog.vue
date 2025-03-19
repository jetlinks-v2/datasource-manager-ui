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
            :label="$t('components.EditDialog.725183-0')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-1') },
              { max: 64, message: $t('components.EditDialog.725183-2') },
            ]"
          >
            <a-input v-model:value="form.data.name" :placeholder="$t('components.EditDialog.725183-1')" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            name="typeId"
            :label="$t('components.EditDialog.725183-3')"
            :rules="[{ required: true, message: $t('components.EditDialog.725183-4') }]"
          >
            <a-select
              v-model:value="form.data.typeId"
              :options="form.typeOptions"
              :placeholder="$t('components.EditDialog.725183-4')"
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
                message: $t('components.EditDialog.725183-5'),
                trigger: 'change',
              },
              { validator: checkUrl, trigger: 'blur' },
            ]"
          >
            <a-input
              v-model:value="form.data.shareConfig.url"
              :placeholder="$t('components.EditDialog.725183-6')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
            :name="['shareConfig', 'adminUrl']"
            :label="$t('components.EditDialog.725183-7')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-8') },
              { validator: validateAdminUrl },
            ]"
          >
            <a-input
              v-model:value="form.data.shareConfig.adminUrl"
              :placeholder="$t('components.EditDialog.725183-9')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
            :name="['shareConfig', 'addresses']"
            :label="$t('components.EditDialog.725183-10')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-11') }
            ]"
          >
            <!--            { validator: validateAddress },-->
            <a-input
              v-model:value="form.data.shareConfig.addresses"
              :placeholder="$t('components.EditDialog.725183-11')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-show="form.data.typeId">
        <a-col :span="12">
          <a-form-item
            :name="['shareConfig', 'username']"
            :label="$t('components.EditDialog.725183-13')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-14') },
              {
                max: 64,
                message: $t('components.EditDialog.725183-2'),
              },
            ]"
          >
            <a-input
              v-model:value="form.data.shareConfig.username"
              :placeholder="$t('components.EditDialog.725183-14')"
            />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item
            :name="['shareConfig', 'password']"
            :label="$t('components.EditDialog.725183-15')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-16') },
              {
                max: 64,
                message: $t('components.EditDialog.725183-2'),
              },
            ]"
          >
            <a-input-password
              v-model:value="form.data.shareConfig.password"
              :placeholder="$t('components.EditDialog.725183-16')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24" v-if="form.data.typeId === 'rabbitmq'">
        <a-col :span="24">
          <a-form-item
            :name="['shareConfig', 'virtualHost']"
            :label="$t('components.EditDialog.725183-17')"
            :rules="[
              { required: true, message: $t('components.EditDialog.725183-18') },
              {
                max: 64,
                message: $t('components.EditDialog.725183-2'),
              },
            ]"
          >
            <a-input
              v-model:value="form.data.shareConfig.virtualHost"
              :placeholder="$t('components.EditDialog.725183-18')"
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
              { required: true, message: $t('components.EditDialog.725183-19') },
              {
                max: 64,
                message: $t('components.EditDialog.725183-2'),
              },
            ]"
          >
            <a-input
              v-model:value="form.data.shareConfig.schema"
              :placeholder="$t('components.EditDialog.725183-19')"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-row :gutter="24">
        <a-col :span="24">
          <a-form-item name="description" :label="$t('components.EditDialog.725183-20')">
            <a-textarea
              v-model:value="form.data.description"
              :placeholder="$t('components.EditDialog.725183-21')"
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
} from "../../../api/dataSource";
import { FormInstance } from "ant-design-vue";
import { Rule } from "ant-design-vue/lib/form";
import type { dictItemType, optionItemType, sourceItemType } from "../typing";
import { onlyMessage } from "@jetlinks-web/utils";
import { useI18n } from 'vue-i18n';

const { t: $t } = useI18n();

const emits = defineEmits(["confirm", "cancel"]);
const props = defineProps<{
  data: sourceItemType;
}>();
// 弹窗相关
const dialogTitle = computed(() =>
  props.data.id ? $t('components.EditDialog.725183-22') : $t('components.EditDialog.725183-23')
);
const loading = ref(false);

const checkUrl = (_rule: Rule, value: string): Promise<any> => {
  if (!value) return Promise.resolve();
  const arr = value.split(":");
  if (arr?.[0] === "jdbc" || arr?.[0] === "r2dbc") {
    return Promise.resolve();
  } else {
    return Promise.reject($t('components.EditDialog.725183-24'));
  }
};

/**
 * 管理地址校验
 */
const validateAdminUrl = (_rule: Rule, value: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!value) {
      resolve("");
    } else {
      const arr = value.split("://");
      if (arr[0] === "http" || arr[0] === "https") {
        resolve("");
      } else {
        reject($t('components.EditDialog.725183-25'));
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
      resolve("");
    } else {
      const arr = value.split("://");
      if (arr[0] === "http" || arr[0] === "https") {
        resolve("");
      } else {
      // const reg =
      //   /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;
      // if (reg.test(value)) {
      //   resolve("");
      // } else {
        reject($t('components.EditDialog.725183-26'));
      }
    }
  });
};

const getTypeOption = () => {
  getDataTypeDict_api().then((resp: any) => {
    const result = resp.result as dictItemType[];
    const options: any = [];
    result.forEach((item) => {
      if (!['redis', 'api'].includes(item.id)) {
        options.push({
          label: item.name,
          value: item.id,
        });
      }
    });
    form.typeOptions = options;
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
    form.data = { ...newValue, shareConfig: { ...newValue?.shareConfig } };
  },
  {
    immediate: true,
    deep: true,
  }
);

onMounted(() => {
  getTypeOption();
});

const confirm = () => {
  loading.value = true;
  formRef.value
    ?.validate()
    .then(async (_data: any) => {
      const resp = await saveDataSource_api({ ...props.data, ..._data });
      if (resp.status === 200) {
        onlyMessage($t('components.EditDialog.725183-27'));
        emits("confirm");
        formRef.value?.resetFields();
      }
    })
    .finally(() => {
      loading.value = false;
    });
};
</script>
