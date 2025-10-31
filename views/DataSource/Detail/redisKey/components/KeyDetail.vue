<template>
  <div class="key-detail">
    <template v-if="selectedKey">
      <!-- 键信息头部 -->
      <div class="detail-header">
        <div class="header-title">
          <AIcon
            type="KeyOutlined"
            class="title-icon"
          />
          <j-ellipsis style="max-width: 500px; font-size: 16px; font-weight: 500">
            {{ selectedKey.name }}
          </j-ellipsis>
        </div>
        <div class="header-actions">
          <a-tooltip title="删除键">
            <a-button
              danger
              type="text"
              :loading="deleteLoading"
              @click="handleDelete"
            >
              <template #icon>
                <AIcon type="DeleteOutlined" />
              </template>
            </a-button>
          </a-tooltip>
        </div>
      </div>

      <!-- 键基本信息 -->
      <div class="info-section">
        <a-row :gutter="16">
          <a-col :span="12">
            <div class="info-item">
              <span class="info-label">数据类型：</span>
              <a-tag
                v-if="keyType"
                :color="getTypeColor(keyType)"
                class="type-tag"
              >
                {{ keyType.toUpperCase() }}
              </a-tag>
              <a-spin
                v-else
                size="small"
              />
            </div>
          </a-col>
          <a-col :span="12">
            <div class="info-item">
              <span class="info-label">过期时间：</span>
              <span class="info-value">{{ formatExpiration(expiration) }}</span>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 数据内容 -->
      <div class="content-section">
        <div class="section-header">
          <div class="section-title">数据内容</div>
          <div
            v-if="dataCount !== null"
            class="section-count"
          >
            {{ dataCount }}
          </div>
        </div>

        <!-- 加载状态 -->
        <div
          v-if="loading"
          class="loading-container"
        >
          <a-spin
            size="large"
            tip="加载中..."
          />
        </div>

        <!-- 数据展示 -->
        <div
          v-else-if="keyData"
          class="data-content"
        >
          <component
            :is="currentTypeComponent"
            :data="keyData"
            @count-updated="handleCountUpdate"
          />
        </div>

        <!-- 空状态 -->
        <div
          v-else
          class="empty-content"
        >
          <j-empty description="暂无数据" />
        </div>
      </div>
    </template>

    <!-- 未选中状态 -->
    <div
      v-else
      class="empty-state"
    >
      <j-empty description="请选择一个键查看详情" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { queryDataSource } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { Modal } from 'ant-design-vue'
import StringType from './dataTypes/StringType.vue'
import HashType from './dataTypes/HashType.vue'
import ListType from './dataTypes/ListType.vue'
import SetType from './dataTypes/SetType.vue'
import ZsetType from './dataTypes/ZsetType.vue'

interface KeyItem {
  type: 'dir' | 'key'
  name: string
  prefix?: string
}

const props = defineProps<{
  selectedKey: KeyItem | null
  datasourceId: string
  typeId: string
}>()

const emit = defineEmits<{
  deleted: []
  refresh: []
}>()

const loading = ref(false)
const deleteLoading = ref(false)
const keyType = ref('')
const expiration = ref('')
const keyData = ref<any>(null)
const dataCount = ref<string | null>(null)

// 类型组件映射
const typeComponents: Record<string, any> = {
  string: StringType,
  hash: HashType,
  list: ListType,
  set: SetType,
  zset: ZsetType
}

// 当前使用的类型组件
const currentTypeComponent = computed(() => {
  const type = keyType.value?.toLowerCase()
  return typeComponents[type] || null
})

// 类型颜色映射
const typeColorMap: Record<string, string> = {
  string: 'blue',
  hash: 'green',
  list: 'orange',
  set: 'purple',
  zset: 'cyan'
}

const getTypeColor = (type: string) => {
  return typeColorMap[type?.toLowerCase()] || 'default'
}

// 格式化过期时间
const formatExpiration = (exp: string) => {
  if (!exp) return '查询中...'
  const expNum = parseInt(exp)
  if (expNum === -1) return '永久'
  if (expNum === -2) return '键不存在'
  if (expNum < 0) return '未知'
  if (expNum < 60) return `${expNum}秒`
  if (expNum < 3600) return `${Math.floor(expNum / 60)}分钟`
  if (expNum < 86400) return `${Math.floor(expNum / 3600)}小时`
  return `${Math.floor(expNum / 86400)}天`
}

// 处理数量更新
const handleCountUpdate = (count: string) => {
  dataCount.value = count
}

// 查询键类型
const fetchKeyType = async () => {
  try {
    const res = await queryDataSource(props.typeId, props.datasourceId, 'DataType', {
      key: props.selectedKey?.name
    })
    if (res.status === 200) {
      keyType.value = res.result?.toLowerCase() || ''
    }
  } catch (error) {
    console.error('查询键类型失败:', error)
    keyType.value = ''
  }
}

// 查询过期时间
const fetchExpiration = async () => {
  try {
    const res = await queryDataSource(props.typeId, props.datasourceId, 'ExpirationTime', {
      key: props.selectedKey?.name
    })
    if (res.status === 200) {
      expiration.value = String(res.result)
    }
  } catch (error) {
    console.error('查询过期时间失败:', error)
    expiration.value = '-1'
  }
}

// 查询键数据
const fetchKeyData = async () => {
  if (!keyType.value) return

  try {
    // 将类型首字母大写，作为 action
    const typeAction = keyType.value.charAt(0).toUpperCase() + keyType.value.slice(1)
    const res = await queryDataSource(props.typeId, props.datasourceId, typeAction, {
      key: props.selectedKey?.name
    })
    if (res.status === 200) {
      keyData.value = res.result
    }
  } catch (error) {
    console.error('查询键数据失败:', error)
    keyData.value = null
  }
}

// 加载键详情
const loadKeyDetail = async () => {
  if (!props.selectedKey) return

  // 重置状态
  loading.value = true
  keyType.value = ''
  expiration.value = ''
  keyData.value = null
  dataCount.value = null

  try {
    // 并行查询类型和过期时间
    await Promise.all([fetchKeyType(), fetchExpiration()])

    // 等待类型查询完成后再查询数据
    if (keyType.value) {
      await fetchKeyData()
    }
  } finally {
    loading.value = false
  }
}

// 删除键
const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除键 "${props.selectedKey?.name}" 吗？删除后将无法恢复。`,
    okText: '确定',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      deleteLoading.value = true
      try {
        const res = await queryDataSource(props.typeId, props.datasourceId, 'DelKey', {
          key: props.selectedKey?.name
        })
        if (res.status === 200) {
          onlyMessage('删除成功', 'success')
          emit('deleted')
          emit('refresh')
        } else {
          onlyMessage('删除失败', 'error')
        }
      } catch (error) {
        console.error('删除键失败:', error)
        onlyMessage('删除失败', 'error')
      } finally {
        deleteLoading.value = false
      }
    }
  })
}

// 监听选中的键变化
watch(
  () => props.selectedKey,
  (newKey) => {
    if (newKey) {
      loadKeyDetail()
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.key-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .title-icon {
      font-size: 18px;
      color: #1890ff;
      flex-shrink: 0;
    }
  }
}

.info-section {
  padding: 16px;
  background: linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f0f0f0;

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    .info-label {
      color: rgba(0, 0, 0, 0.65);
      font-weight: 500;
    }

    .info-value {
      color: rgba(0, 0, 0, 0.85);
      font-weight: 500;
    }

    .type-tag {
      font-size: 13px;
      padding: 2px 12px;
      font-weight: 600;
      border-radius: 4px;
    }
  }
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.85);
    }

    .section-count {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 4px;
    }
  }

  .loading-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    gap: 16px;
  }

  .data-content {
    flex: 1;
    overflow: hidden;
    border-radius: 8px;
    min-height: 0;
  }

  .empty-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    background-color: #fafafa;
    border-radius: 8px;
    border: 1px dashed #d9d9d9;
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;
}
</style>
