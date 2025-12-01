<template>
  <div class="content-warp">
    <a-form
      ref="formRef"
      :model="formData"
      layout="vertical"
    >
      <a-form-item
        :label="$t('DataSource.Text.100027-0')"
        name="maxLength"
      >
        <a-input-number
          v-model:value="formData.expands.maxLength"
          style="width: 100%"
          :min="0"
          :max="9999"
          :precision="0"
          :disabled="readonly"
          :placeholder="$t('DataSource.Text.100027-1')"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { cloneDeep } from 'lodash-es'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const { data, readonly } = toRefs(props)

const formData = reactive({ expands: { maxLength: undefined }, type: 'string' })
const formRef = ref()

const getData = async () => {
  const valid = await formRef.value.validate()
  if (valid) return formData
}

const setData = (data: object) => {
  Object.assign(formData, cloneDeep(data))
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
  width: 100%;
}
</style>
