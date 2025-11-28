<template>
  <div class="redis-datasource-query-container">
    <a-segmented
      v-model:value="activeTab"
      :options="tabOptions"
      block
      class="query-tabs"
    />

    <div class="content">
      <CommonQuery
        v-show="activeTab === 'pattern'"
        ref="commonQueryRef"
        :data="data"
        @update:expression="handleCommonExpressionUpdate"
      />

      <ScriptQuery
        v-show="activeTab === 'script'"
        ref="scriptQueryRef"
        :data="scriptData"
        :is-edit="isEdit"
        :form-ref="formRef"
        @update:expression="handleScriptExpressionUpdate"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="RedisDatasourceQuery">
import CommonQuery from './components/CommonQuery.vue'
import ScriptQuery from './components/ScriptQuery.vue'

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

const activeTab = ref('pattern')
const scriptQueryRef = ref<any>()
const commonQueryRef = ref<any>()

const tabOptions = [
  { label: '通用查询', value: 'pattern' },
  { label: '脚本查询', value: 'script' }
]

// 脚本查询数据
const scriptData = computed(() => props.data || {})

watch(
  () => props.data?.provider,
  (provider) => {
    activeTab.value = provider || 'pattern'
  },
  { immediate: true }
)

const handleCommonExpressionUpdate = (expression: any, resultJson: any, inputs: any) => {
  emit('update:expression', expression, resultJson, inputs)
}

const handleScriptExpressionUpdate = (expression: any, resultJson: any, inputs: any) => {
  emit('update:expression', expression, resultJson, inputs)
}

const validateAll = async () => {
  if (activeTab.value === 'script') {
    return scriptQueryRef.value?.validateAll()
  } else {
    return commonQueryRef.value?.validateAll()
  }
}

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.redis-datasource-query-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .query-tabs {
    margin-left: 16px;
    width: 350px;
  }

  .content {
    flex: 1;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;

    .script-content {
      overflow-y: auto;
      padding: 0;
    }
  }
}
</style>
