<template>
  <a-modal
    open
    :title="preview ? $t('DataSource.CommandModal.100018-0') : $t('DataSource.CommandModal.100018-1')"
    centered
    @cancel="handleCancel"
    width="900px"
    :body-style="modalBodyStyle"
  >
    <!-- 命令信息头部 -->
    <header class="info-header">
      <div class="title">
        <AIcon type="CodeOutlined" />
        <j-ellipsis>
          <div class="title-content">{{ data.name }}</div>
        </j-ellipsis>
      </div>

      <div class="meta">
        <div class="meta-item">
          <span class="label">{{ $t('DataSource.CommandModal.100018-2') }}</span>
          <span class="value">{{ data.id }}</span>
        </div>
        <div class="meta-item">
          <span class="label">{{ $t('DataSource.CommandModal.100018-3') }}</span>
          <span class="value">{{ data.description || '--' }}</span>
        </div>
      </div>
    </header>

    <a-divider />

    <!-- 参数内容区 -->
    <section class="params-section">
      <CommandParams
        :modelValue="modelValue"
        :preview="preview"
      />
    </section>

    <template #footer>
      <a-button @click="handleCancel">{{ $t('DataSource.CommandModal.100018-4') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import CommandParams from './CommandParams/index.vue'
import { metadataConvertToTableTree } from '../utils'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  preview: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cancel', 'update'])

const modalBodyStyle = computed(() => ({
  maxHeight: '80vh',
  overflowY: 'auto' as any,
  paddingRight: '8px',
  marginRight: '-8px'
}))

const modelValue = computed(() => ({
  input: metadataConvertToTableTree(props.data.inputs, 'dataType'),
  output:
    props.data.output.type === 'array'
      ? metadataConvertToTableTree(props.data.output.elementType.properties || [], 'dataType')
      : metadataConvertToTableTree(props.data.output.properties || [], 'dataType')
}))

const handleCancel = () => emit('cancel')
</script>

<style scoped lang="less">
.info-header {
  margin-bottom: 16px;

  .title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    &-content {
      font-size: 20px;
      font-weight: 500;
    }

    .anticon {
      color: #1890ff;
      font-size: 20px;
    }
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .meta-item {
      display: flex;
      font-size: 14px;
      color: #8c8c8c;

      span {
        color: #262626;
        margin-right: 8px;
        white-space: nowrap;
      }
    }
  }
}

.params-section {
  max-height: 500px;
  padding: 4px 0;
}

.ant-divider {
  margin: 16px 0;
}
</style>
