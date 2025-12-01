<template>
  <a-modal
    open
    :title="isEdit ? $t('DataSource.AddData.100016-0') : $t('DataSource.AddData.100016-1')"
    centered
    :maskClosable="false"
    @cancel="emit('cancel')"
    :width="sourceClassify === DATA_TYPE_ITEM.RDB_DATASOURCE && currentStep === 1 ? '600px' : '1200px'"
    :bodyStyle="modalBodyStyle"
  >
    <a-form
      :model="formData"
      ref="formRef"
      layout="vertical"
    >
      <a-steps
        :current="currentStep"
        class="mb-6"
      >
        <a-step :title="$t('DataSource.AddData.100016-2')" />
        <a-step :title="$t('DataSource.AddData.100016-3')" />
      </a-steps>

      <div v-show="currentStep === 0">
        <component
          ref="componentRef"
          :is="components[sourceClassify]"
          :isEdit="isEdit"
          :dataSourceId="info.id"
          :formRef="formRef"
          :data="formData.configuration"
          @update:expression="updateExpressionData"
          @update:configuration="handleConfigUpdate"
        />
      </div>

      <div v-show="currentStep === 1">
        <BasicForm
          ref="basicFormRef"
          :modelValue="formData"
          :testData="checkTestDataSource"
          :dynamicParams="dynamicParams"
          :isEdit="isEdit"
          :isRdb="sourceClassify === DATA_TYPE_ITEM.RDB_DATASOURCE"
          @update="handleFormUpdate"
        />
      </div>
    </a-form>

    <template #footer>
      <div class="footer-wrapper">
        <div>
          <a-button
            v-if="currentStep > 0"
            @click="prev"
          >
            {{ $t('DataSource.SourceAdd.100005-11') }}
          </a-button>
        </div>

        <a-button
          v-if="currentStep < 1"
          type="primary"
          @click="next"
        >
          {{ $t('DataSource.TypeAdd.100004-2') }}
        </a-button>
        <a-button
          v-else
          type="primary"
          @click="handleSave"
        >
          {{ $t('DataSource.AddData.100016-4') }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { DATA_TYPE_ITEM } from '@datasource-manager-ui/enums/dataEnums'
import RdbDatasourceQuery from './RdbDatasourceQuery/index.vue'
import ApiSend from './ApiSend/index.vue'
import BasicForm from './components/BasicForm.vue'
import { addDataSourceCommand, editDataSourceCommand } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { DatasourceType } from './type'
import { parseTableTreeToMetadata, metadataConvertToTableTree } from './utils'
import { transformArray } from './ApiSend/utils'
import { isArray, isObject } from 'lodash-es'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  },
  info: {
    type: Object,
    default: () => ({})
  }
})
const emit = defineEmits(['cancel', 'ok'])

const route = useRoute()
const formRef = ref()
const componentRef = ref()
const basicFormRef = ref()

const currentStep = ref(0)
const checkTestDataSource = ref<any>()
const dynamicParams = ref<any[]>([])
const formData = reactive<any>({
  id: props.data.id,
  dataSourceId: props.info.id,
  support: '',
  name: '',
  dataSourceTypeId: route.query.typeId as string,
  description: '',
  configuration: {
    commandId: '',
    commandName: '',
    output: {},
    input: [],
    expression: {
      uri: {
        url: ''
      },
      method: 'GET',
      body: {
        contentType: '',
        content: ''
      },
      queryParams: [],
      headers: []
    }
  }
})

const modalBodyStyle = computed(() => ({
  maxHeight: '80vh',
  overflowY: 'auto' as any,
  paddingRight: '8px',
  marginRight: '-8px'
}))

const isEdit = computed(() => {
  if (props.data.id) {
    currentStep.value = 1
    return true
  }
  currentStep.value = 0
  return false
})

const sourceClassify = computed(() => {
  return route.query.typeId as DatasourceType
})

const updateExpressionData = (expression: any, testData: any, dynamicParamsData: any) => {
  formData.configuration.expression = expression
  checkTestDataSource.value = testData.body
  dynamicParams.value = dynamicParamsData
}

const handleConfigUpdate = (config: any) => {
  formData.configuration = {
    rdbDefinition: config,
    provider: 'definition'
  }
}

const next = async (): Promise<void> => {
  try {
    const componentValid = await componentRef.value?.validateAll()
    if (componentValid) {
      currentStep.value++
    } else {
      console.log($t('DataSource.AddData.100016-10'), { componentValid })
    }
  } catch (e) {
    console.error('Validation error:', e)
  }
}

const prev = () => {
  currentStep.value--
}

const components: any = {
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: RdbDatasourceQuery,
  [DATA_TYPE_ITEM.API_SEND]: ApiSend
}

const handleFormUpdate = (newData: any) => {
  Object.assign(formData, newData)
}

const handleSave = async () => {
  try {
    let params = {}
    if (sourceClassify.value === DATA_TYPE_ITEM.API_SEND) {
      const valid = await formRef.value?.validate().catch((e: any) => {
        onlyMessage(e.errorFields[0].errors[0], 'error')
      })
      if (!valid) return

      const formData = await basicFormRef.value?.getFormData()
      if (!formData) return

      const isDataSourceArray = isEdit.value
        ? props.data.configuration.output.type === 'array'
        : isArray(checkTestDataSource.value)
      const { queryParams, headers, uri } = formData.configuration.expression

      params = {
        ...formData,
        configuration: {
          ...formData.configuration,
          expression: {
            ...formData.configuration.expression,
            queryParams: transformArray(queryParams),
            headers: transformArray(headers),
            uri: {
              url: uri.url.split('?')[0]
            }
          },
          input: parseTableTreeToMetadata(formData.configuration.input),
          output: {
            name: isDataSourceArray ? $t('DataSource.AddData.100016-11') : $t('DataSource.AddData.100016-12'),
            id: isDataSourceArray ? 'array' : 'object',
            type: isDataSourceArray ? 'array' : 'object',
            ...(isDataSourceArray
              ? {
                  elementType: {
                    type: 'object',
                    properties: parseTableTreeToMetadata(formData.configuration.output)
                  }
                }
              : {
                  properties: parseTableTreeToMetadata(formData.configuration.output)
                })
          },
          provider: 'expression'
        }
      }

      if (!formData.configuration.output.length) {
        Modal.confirm({
          title: $t('DataSource.DataList.100014-2'),
          content: $t('DataSource.AddData.100016-5'),
          cancelText: $t('DataSource.SourceAdd.100005-12'),
          okText: $t('DataSource.SourceAdd.100005-13'),
          onOk: () => onSaveData(params)
        })
      } else {
        await onSaveData(params)
      }
    } else {
      const valid = await formRef.value?.validate()
      if (!valid) return

      const componentValid = await componentRef.value?.validateAll()
      if (!componentValid) return

      params = formData
      await onSaveData(params)
    }
  } catch (e) {
    console.log(e)
    // 验证失败不保存
  }
}

const onSaveData = async (formData: any) => {
  const res = isEdit.value ? await editDataSourceCommand(formData) : await addDataSourceCommand(formData)

  if (res.success) {
    onlyMessage(isEdit.value ? $t('DataSource.AddData.100016-6') : $t('DataSource.AddData.100016-7'))
    emit('ok')
    emit('cancel')
  } else {
    onlyMessage(isEdit.value ? $t('DataSource.AddData.100016-8') : $t('DataSource.AddData.100016-9'), 'error')
  }
}

onMounted(() => {
  if (!props.data || !Object.keys(props.data).length) return

  // 合并表单数据
  Object.keys(formData).forEach((key) => {
    if (!props.data.hasOwnProperty(key)) return

    const isComplexObject = isObject(formData[key]) && !isArray(formData[key])
    isComplexObject ? Object.assign(formData[key], props.data[key]) : (formData[key] = props.data[key])
  })

  if (sourceClassify.value === DATA_TYPE_ITEM.API_SEND) {
    // 处理API发送类型数据
    const { queryParams, headers, uri } = props.data.configuration.expression
    const transformParam = (item: any) => ({
      ...item,
      key: item.key.value,
      value: item.value.value
    })

    formData.configuration.expression = {
      ...props.data.configuration.expression,
      queryParams: queryParams.map(transformParam),
      headers: headers.map(transformParam)
    }

    if (uri) {
      const queryString = formData.configuration.expression.queryParams
        ?.map((item: any) => {
          if (item.enable) {
            return `${item.key}=${item.value}`
          }
        })
        .filter(Boolean)
        .join('&')
      if (queryString) {
        const separator = uri.url.includes('?') ? '&' : '?'
        formData.configuration.expression.uri.url = `${uri.url}${separator}${queryString}`
      }
    }

    // 处理输入输出配置
    formData.configuration.input = metadataConvertToTableTree(props.data.configuration.input, 'dataType')

    const { output } = props.data.configuration
    if (output.type === 'array') {
      formData.configuration.output = metadataConvertToTableTree(output.elementType.properties, 'dataType')
    } else if (output.type === 'object') {
      formData.configuration.output = metadataConvertToTableTree(output.properties, 'dataType')
    }
  } else {
    // 处理RDB类型数据
    formData.configuration.rdbDefinition = props.data.configuration.rdbDefinition
  }
})
</script>

<style scoped lang="less">
.mb-6 {
  width: 70%;
  margin: 0 auto 16px;
}

.footer-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
