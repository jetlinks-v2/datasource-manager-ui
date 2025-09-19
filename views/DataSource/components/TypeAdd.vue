<template>
  <a-modal
    :open="true"
    title="新增数据源连接"
    @cancel="emit('close')"
    centered
    :width="616"
    :bodyStyle="{ maxHeight: '75vh', padding: '8px' }"
  >
    <a-row class="data-source-modal">
      <TitleComponent data="类型" />
      <a-col :span="24">
        <div
          v-for="(dataTypeItem, index) in dataType"
          :key="index"
          class="type-section"
        >
          <span class="type-title">{{ dataTypeItem.title }}</span>
          <div class="type-grid">
            <div
              v-for="item in dataTypeItem.types"
              :key="item.value"
              class="type-grid-item"
              @click="handleSelect(item)"
            >
              <div
                class="type-card"
                :class="{
                  'is-disabled': item.disable,
                  'is-active': item.value === activeType.value
                }"
              >
                <img
                  :alt="item.value"
                  :src="item.icon"
                  class="type-image"
                  draggable="false"
                />
                <!-- 选中标记 -->
                <div
                  v-if="item.value === activeType.value"
                  class="selected-mark"
                >
                  <AIcon
                    type="CheckOutlined"
                    class="check-icon"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <template #footer>
      <a-space>
        <a-button
          type="primary"
          @click="handleClickNext"
        >
          下一步
        </a-button>
      </a-space>
    </template>
  </a-modal>
</template>

<script setup lang="ts" name="TypeAdd">
import { typesData } from './table'
import { cloneDeep } from 'lodash-es'
import { useSourceDetailStore } from '@datasource-manager-ui/stores/sourceDetail'

const emit = defineEmits(['close'])
const props = defineProps({
  active: {
    type: Object,
    default: {}
  }
})
const sourceDetailStore = useSourceDetailStore()
const dataType = ref(cloneDeep(typesData))
const activeType = ref(props.active)
const handleSelect = (item: any) => {
  if (!item.disable) {
    activeType.value = {
      group: activeType.value.group,
      ...item
    }
  }
}

const handleClickNext = () => {
  // 缓存选择类型
  sourceDetailStore.saveType(activeType.value.name)
  emit('close', activeType.value)
}
</script>

<style lang="less" scoped>
.data-source-modal {
  .type-section {
    margin-bottom: 16px;

    .type-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--ant-text-color);
      margin-bottom: 16px;
      display: block;
    }
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .type-grid-item {
    cursor: pointer;
  }

  .type-card {
    position: relative;
    width: 94px;
    height: 94px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.3s;
    overflow: hidden;

    &:hover:not(.is-disabled) {
      border-color: var(--ant-primary-color-hover);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    }

    &.is-active {
      border-color: var(--ant-primary-color);
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .type-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .selected-mark {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 0;
      height: 0;
      border: 12px solid transparent;
      border-bottom-color: var(--ant-primary-color);
      border-right-color: var(--ant-primary-color);
      border-bottom-right-radius: 6px;

      .check-icon {
        position: absolute;
        right: -10px;
        bottom: -10px;
        color: #fff;
        font-size: 10px;
        font-weight: bold;
      }
    }
  }
}
</style>
