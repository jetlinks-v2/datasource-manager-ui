<template>
  <a-modal
    open
    :title="preview ? $t('DataSource.CommandModal.100018-0') : $t('DataSource.CommandModal.100018-1')"
    centered
    :maskClosable="false"
    @cancel="handleCancel"
    width="900px"
    :body-style="modalBodyStyle"
  >
    <div class="command-info">
      <h3 class="command-title">
        <AIcon
          type="CodeOutlined"
          class="command-title-icon"
        />
        {{ data.name }}
      </h3>
      <div class="command-meta">
        <p class="command-id">
          <span class="label">{{ $t('DataSource.CommandModal.100018-2') }}</span>
          <span class="value">{{ data.id }}</span>
        </p>
        <j-ellipsis class="command-desc">
          <span class="label">{{ $t('DataSource.CommandModal.100018-3') }}</span>
          <span class="value">{{ data.description || '--' }}</span>
        </j-ellipsis>
      </div>
    </div>

    <a-divider style="margin: 16px 0" />

    <div class="command-params-container">
      <CommandParams
        :modelValue="modelValue"
        :preview="preview"
        class="command-params"
      />
    </div>

    <template #footer>
      <div class="modal-footer">
        <a-button @click="handleCancel">{{ $t('DataSource.CommandModal.100018-4') }}</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts" name="CommandModal">
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

const modelValue = computed(() => {
  return {
    input: metadataConvertToTableTree(props.data.inputs, 'dataType'),
    output:
      props.data.output.type === 'array'
        ? metadataConvertToTableTree(props.data.output.elementType.properties || [], 'dataType')
        : metadataConvertToTableTree(props.data.output.properties || [], 'dataType')
  }
})

const handleCancel = () => {
  emit('cancel')
}
</script>

<style scoped lang="less">
.command-modal {
  width: 100%;
}

.command-info {
  .command-title {
    font-size: 20px;
    font-weight: 500;
    color: #1f1f1f;
    margin-bottom: 16px;
    display: flex;
    align-items: center;

    &-icon {
      margin-right: 8px;
      color: #1890ff;
    }
  }

  .command-meta {
    .command-id,
    .command-desc {
      margin-bottom: 8px;
      font-size: 14px;

      .label {
        font-weight: 500;
      }

      .value {
        color: #333;
        max-width: 220px;
      }
    }
  }
}

.command-params {
  margin-top: 16px;
  overflow-y: scroll;
}

.modal-footer {
  text-align: right;

  .ant-btn {
    margin-left: 8px;
  }
}
</style>
