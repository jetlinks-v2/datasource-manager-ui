<template>
  <div class="content-warp">
    <a-form
      ref="formRef"
      :model="formData"
      layout="vertical"
    >
      <a-form-item
        :label="$t('DataSource.Array.100040-0')"
        :name="['elementType', 'type']"
        :rules="[{ required: true, message: $t('DataSource.Array.100040-1') }]"
      >
        <a-select
          v-model:value="formData.elementType.type"
          style="width: 100%"
          :placeholder="$t('DataSource.Array.100040-1')"
          :disabled="readonly"
          :options="typeOptions"
        />
      </a-form-item>

      <a-form-item v-if="currentComponent">
        <component
          :is="currentComponent"
          ref="currentRef"
          :data="formData.elementType"
          :readonly="readonly"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import { defaultApiDataTypeOptions } from '../setting'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()
import IFloat from './Float.vue'
import IBoolean from './Boolean.vue'
import IDate from './Date.vue'
import IText from './Text.vue'
import IEnum from './Enum.vue'
import IObject from './Object.vue'

const componentMap: Record<string, any> = {
  float: IFloat,
  double: IFloat,
  boolean: IBoolean,
  date: IDate,
  string: IText,
  enum: IEnum,
  object: IObject
}

const props = defineProps({
  data: { type: Object as () => any, default: () => ({}) },
  readonly: { type: Boolean, default: false }
})
const { data, readonly } = toRefs(props)

// 表单与 ref
const formRef = ref()
const formData = reactive({ elementType: { type: 'int' }, type: 'array' })
const currentRef = ref<any>(null)

const typeOptions = computed(() => defaultApiDataTypeOptions.filter((opt) => opt.value !== 'array'))

const currentComponent = computed(() => componentMap[formData.elementType.type] || null)

const getData = async () => {
  const childData = await currentRef.value?.getData()

  if (childData) {
    if (childData.error) {
      return {
        error: childData.error
      }
    }

    return {
      elementType: childData,
      type: 'array'
    }
  } else if (childData?.type === 'object') {
    return {
      error: $t('DataSource.Object.100031-0')
    }
  } else if (childData?.type === 'enum') {
    return {
      error: $t('DataSource.Enum.100030-4')
    }
  } else {
    return { ...formData }
  }
}

const setData = (value: object) => {
  Object.assign(formData, cloneDeep(value))
}

watch(
  data,
  () => {
    setData(data.value)
  },
  { immediate: true }
)

defineExpose({
  getData,
  setData
})
</script>

<style scoped lang="less">
.content-warp {
  width: 500px;
}
</style>
