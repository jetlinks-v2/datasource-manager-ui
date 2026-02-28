<template>
  <a-modal
    v-model:open="visible"
    :maskClosable="false"
    destroy-on-close
    width="650px"
    @cancel="handleClose"
  >
    <template #title>
      <span>{{ $t('DataSource.DialogTips.100098-0') }}</span>
    </template>
    <template #footer>
      <a-button @click="handleClose">{{ $t('DataSource.DialogTips.100098-1') }}</a-button>
    </template>

    <div class="tips-content">
      <div class="tips-header">
        <AIcon
          type="CheckCircleOutlined"
          class="success-icon"
        />
        <div class="success-title">{{ $t('DataSource.DialogTips.100098-0') }}</div>
      </div>

      <div class="tips-id-row">
        <div class="tips-id">{{ $t('DataSource.DialogTips.100098-2') }} {{ datasourceId }}</div>
        <div
          class="tips-detail"
          @click="handleViewDetail"
        >
          {{ $t('DataSource.DialogTips.100098-3') }}
        </div>
      </div>

      <div>{{ $t('DataSource.DialogTips.100098-4') }}</div>
      <div class="tips-main">{{ $t('DataSource.DialogTips.100098-5') }}</div>
      <div class="tips-text">{{ $t('DataSource.DialogTips.100098-6') }}</div>
      <div class="tips-main">{{ $t('DataSource.DialogTips.100098-7') }}</div>
      <div class="tips-text">{{ $t('DataSource.DialogTips.100098-8') }}</div>
      <div class="tips-main">{{ $t('DataSource.DialogTips.100098-9') }}</div>
      <div class="tips-text">{{ $t('DataSource.DialogTips.100098-10') }}</div>
    </div>
  </a-modal>
</template>

<script setup lang="ts" name="DataSourceDialogTips">
import { useMenuStore } from '@jetlinks-web-core/store'

const visible = ref(false)
const datasourceId = ref('')
const typeId = ref('')
const menuStore = useMenuStore()

const handleClose = () => {
  visible.value = false
}

const show = (payload: { id: string; typeId?: string }) => {
  datasourceId.value = payload.id
  typeId.value = payload.typeId || ''
  visible.value = true
}

const handleViewDetail = () => {
  if (!datasourceId.value) return
  menuStore.jumpPage('system/DataSource/Detail', {
    params: { id: datasourceId.value },
    query: { typeId: typeId.value }
  })
}

defineExpose({
  show
})
</script>

<style scoped lang="less">
.tips-content {
  .tips-header {
    display: flex;
  }

  .success-icon {
    color: #52c41a;
    font-size: 25px;
  }

  .success-title {
    margin-left: 10px;
    margin-top: 2px;
    font-weight: 600;
  }

  .tips-id-row {
    display: flex;
  }

  .tips-id {
    margin: 10px 15px 10px 0;
    max-width: 520px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .tips-detail {
    margin: 10px 0;
    color: #0297d7;
    cursor: pointer;
  }

  .tips-main {
    font-weight: 600;
  }

  .tips-text {
    color: #757575;
  }
}
</style>
