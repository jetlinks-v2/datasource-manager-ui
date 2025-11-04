<template>
  <div class="redis-datasource-query-container">
    <div class="header">
      <div class="segmented-control">
        <a-button
          class="segmented-control__button"
          :class="{ active: activeTab === 'pattern' }"
          @click="handleActiveTabChange('pattern')"
        >
          通用查询
        </a-button>
        <a-button
          class="segmented-control__button"
          :class="{ active: activeTab === 'script' }"
          @click="handleActiveTabChange('script')"
        >
          脚本查询
        </a-button>
      </div>
    </div>

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

// 脚本查询数据
const scriptData = computed(() => ({
  script: props.data?.script || '',
  variables: props.data?.variables || {}
}))

const handleActiveTabChange = (tab: string) => {
  if (activeTab.value === tab) return
  activeTab.value = tab
}

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

  .header {
    display: flex;
    justify-content: flex-start;
    padding: 0 16px;

    .segmented-control {
      display: inline-flex;
      border: 1px solid #d9d9d9;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f5f5f5;

      &__button {
        background-color: transparent;
        color: #595959;
        border: none;
        flex: 1;
        min-width: 100px;
        transition: all 0.3s ease;

        &:not(:first-child) {
          border-left: 1px solid #d9d9d9;
        }

        &.active {
          background-color: #ffffff;
          color: #2f54eb;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
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
