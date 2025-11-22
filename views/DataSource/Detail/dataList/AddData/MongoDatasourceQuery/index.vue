<template>
  <div class="mongo-datasource-query-container">
    <a-segmented
      v-model:value="activeTab"
      :options="tabOptions"
      block
      class="query-tabs"
    />

    <div class="content">
      <CommonQuery
        v-show="activeTab === 'generalQuery'"
        ref="commonQueryRef"
        :data="data"
        @update:expression="handleCommonExpressionUpdate"
      />

      <AggregateQuery
        v-show="activeTab === 'pipeline'"
        ref="aggregateQueryRef"
        :data="aggregateData"
        :is-edit="isEdit"
        :form-ref="formRef"
        @update:expression="handleAggregateExpressionUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="MongoDatasourceQuery">
import CommonQuery from './components/CommonQuery.vue'
import AggregateQuery from './components/AggregateQuery/index.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  formRef: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:expression'])

const activeTab = ref('generalQuery')
const commonQueryRef = ref<any>()
const aggregateQueryRef = ref<any>()

const tabOptions = [
  { label: '通用查询', value: 'generalQuery' },
  { label: '聚合查询', value: 'pipeline' }
]

const aggregateData = computed(() => props.data || {})

watch(
  () => props.data?.provider,
  (provider) => {
    activeTab.value = provider || 'generalQuery'
  },
  { immediate: true }
)

const handleCommonExpressionUpdate = (expression: any, resultJson: any, inputs: any) => {
  emit('update:expression', expression, resultJson, inputs)
}

const handleAggregateExpressionUpdate = (expression: any, resultJson: any, inputs: any) => {
  emit('update:expression', expression, resultJson, inputs)
}

const validateAll = async () => {
  if (activeTab.value === 'pipeline') {
    return aggregateQueryRef.value?.validateAll()
  } else {
    return commonQueryRef.value?.validateAll()
  }
}

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.mongo-datasource-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  margin: 8px;

  .query-tabs {
    margin-bottom: 16px;
    width: 350px;
  }

  .content {
    flex: 1;
  }
}
</style>
