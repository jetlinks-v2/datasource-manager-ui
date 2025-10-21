<template>
  <a-modal
    open
    title="在线调试"
    centered
    @cancel="handleCancel"
    width="900px"
    :body-style="modalBodyStyle"
  >
    <!-- 命令信息头部 -->
    <header class="info-header">
      <div class="title">
        <AIcon type="BugOutlined" />
        <j-ellipsis>
          <div class="title-content">{{ data.name }}</div>
        </j-ellipsis>
      </div>

      <div class="meta">
        <div class="meta-item">
          <span>标识：</span>
          {{ data.id }}
        </div>
        <div class="meta-item">
          <span>说明：</span>
          <j-ellipsis>{{ data.description || '--' }}</j-ellipsis>
        </div>
      </div>
    </header>

    <a-divider />

    <!-- 调试内容区 -->
    <section class="debug-section">
      <!-- 输入参数区域 -->
      <div class="params-section">
        <TitleComponent
          data="输入参数"
          :style="{ fontSize: '16px' }"
        />

        <div class="section-content">
          <a-form
            ref="formRef"
            :model="formData"
            layout="vertical"
          >
            <template v-if="commandInputs.length">
              <DataInputsItem
                v-model="formData.inputs"
                v-for="item in commandInputs"
                :key="item.id"
                :name="item.id"
                :item="item"
                :isDark="false"
                :expands="_expands"
                @change="handleInputStateChange"
              />
            </template>
            <div
              class="empty"
              v-else
            >
              <j-empty description="无需输入参数" />
            </div>
          </a-form>
        </div>
      </div>

      <a-divider />

      <!-- 执行结果区域 -->
      <div class="result-section">
        <h4 class="section-title">
          <TitleComponent
            data="执行结果"
            :style="{ fontSize: '16px' }"
          />
        </h4>
        <div class="section-content">
          <template v-if="debugLoading">
            <div class="loading-wrapper">
              <a-spin
                size="large"
                tip="执行中..."
              />
            </div>
          </template>
          <template v-else-if="debugResult">
            <div class="result-wrapper">
              <!-- 执行状态 -->
              <div class="result-status">
                <a-tag
                  :color="debugResult.success ? 'success' : 'error'"
                  style="font-size: 14px; padding: 4px 12px"
                >
                  <template #icon>
                    <AIcon :type="debugResult.success ? 'CheckCircleOutlined' : 'CloseCircleOutlined'" />
                  </template>
                  {{ debugResult.success ? '执行成功' : '执行失败' }}
                </a-tag>
                <span class="execute-time">执行时间: {{ debugResult.executeTime || '--' }}ms</span>
              </div>

              <!-- 结果内容 -->
              <div class="result-data">
                <JsonEditor
                  :value="JSON.stringify(debugResult.data, null, 2)"
                  height="400px"
                  :readOnly="true"
                  :showFormatBtn="false"
                  formatOnBlur
                  showMinimap
                  :placeholder="debugResult.success ? '返回结果为空' : ''"
                />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="empty">
              <j-empty description="点击「运行」按钮查看结果" />
            </div>
          </template>
        </div>
      </div>
    </section>

    <template #footer>
      <div class="modal-footer">
        <a-button @click="handleCancel">关闭</a-button>
        <a-button
          type="primary"
          :loading="debugLoading"
          @click="handleExecuteDebug"
        >
          <template #icon>
            <AIcon type="ThunderboltOutlined" />
          </template>
          运行
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import JsonEditor from './JsonEditor.vue'
import { queryDataSourceCm1 } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { moduleRegistry } from '@/utils/module-registry'

const { DataInputsItem } = moduleRegistry.getResource('visualization-designer-ui', 'components')

interface DebugResult {
  success: boolean
  data: any
  executeTime?: number
  message?: string
}

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  info: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cancel'])

const formRef = ref()
const formData = reactive<Record<string, any>>({
  inputs: {}
})
const debugLoading = ref(false)
const debugResult = ref<DebugResult | null>(null)

const modalBodyStyle = computed(() => ({
  maxHeight: '80vh',
  overflowY: 'auto' as any,
  paddingRight: '8px',
  marginRight: '-8px'
}))

const commandInputs = ref<any[]>([])
const _expands = ref<Record<string, any>>({})

const handleInputStateChange = (value: any) => {
  formData.inputs = { ...formData.inputs, ...value }
}

const handleExecuteDebug = async () => {
  try {
    debugLoading.value = true
    debugResult.value = null

    const startTime = Date.now()
    const res = await queryDataSourceCm1(formData.inputs)
    const executeTime = Date.now() - startTime

    if (res.success) {
      debugResult.value = {
        success: true,
        data: res,
        executeTime
      }
      onlyMessage('执行成功')
    } else {
      throw new Error('执行失败')
    }
  } catch (error: any) {
    debugResult.value = {
      success: false,
      data: {
        error: error.message || '执行失败',
        stack: error.stack
      }
    }
    onlyMessage('执行失败: ' + (error.message || '未知错误'), 'error')
  } finally {
    debugLoading.value = false
    await scrollToBottom()
  }
}

const scrollToBottom = async () => {
  await nextTick()

  const modalBody = document.querySelector('.ant-modal-body')
  if (modalBody) {
    modalBody.scrollTop = modalBody.scrollHeight
  }
}

const handleCancel = () => {
  emit('cancel')
}

onMounted(() => {
  commandInputs.value = props.data.inputs?.filter((item: any) => !item.expands?.hidden) || []
  _expands.value = props.data.expands || {}
})
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

.debug-section {
  max-height: 500px;
  padding: 12px;

  .section-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 500;
  }

  .section-content {
    margin-bottom: 24px;
    min-height: 300px;

    .empty {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 300px;
    }
  }
}

.params-section {
  margin-bottom: 16px;
}

.result-section {
  .section-title {
    justify-content: space-between;
  }
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.result-wrapper {
  display: flex;
  flex-direction: column;

  .result-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;

    .execute-time {
      color: #8c8c8c;
      font-size: 14px;
    }
  }

  .result-data {
    flex: 1;
    border: 1px solid #d9d9d9;
    overflow: hidden;
    background: #fff;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.ant-divider {
  margin: 16px 0;
}
</style>
