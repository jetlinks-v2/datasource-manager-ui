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
        @update:expression="handleExpressionUpdate"
      />

      <AggregateQuery
        v-show="activeTab === 'pipeline'"
        ref="aggregateQueryRef"
        :data="aggregateData"
        :is-edit="isEdit"
        :form-ref="formRef"
        @update:expression="handleExpressionUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="MongoDatasourceQuery">
import CommonQuery from './components/CommonQuery.vue'
import AggregateQuery from './components/AggregateQuery/index.vue'
import { useI18n } from 'vue-i18n'

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

const { t: $t } = useI18n()

const emit = defineEmits(['update:expression'])

const commonQueryRef = ref<any>()
const aggregateQueryRef = ref<any>()

const activeTab = ref('generalQuery')
const sharedSelectedCollection = ref('')

const tabOptions = computed(() => [
  { label: $t('DataSource.MongoDatasourceQuery.100055-0'), value: 'generalQuery' },
  { label: $t('DataSource.MongoDatasourceQuery.100055-1'), value: 'pipeline' }
])

const aggregateData = computed(() => props.data || {})

const handleExpressionUpdate = (expression: any, resultJson: any, inputs: any) => {
  emit('update:expression', expression, resultJson, inputs)
}

const validateAll = async () => {
  const currentRef = activeTab.value === 'pipeline' ? aggregateQueryRef.value : commonQueryRef.value
  return currentRef?.validateAll()
}

watch(activeTab, (newTab, oldTab) => {
  if (!oldTab) return

  const oldRef = oldTab === 'generalQuery' ? commonQueryRef.value : aggregateQueryRef.value
  const newRef = newTab === 'generalQuery' ? commonQueryRef.value : aggregateQueryRef.value

  if (oldRef) {
    sharedSelectedCollection.value = oldRef.getSelectedCollection()
  }

  if (newRef && sharedSelectedCollection.value) {
    nextTick(() => newRef.setSelectedCollection(sharedSelectedCollection.value))
  }
})

watch(
  () => props.data?.provider,
  (provider) => {
    activeTab.value = provider || 'generalQuery'
  },
  { immediate: true }
)

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
