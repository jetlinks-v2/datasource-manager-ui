<template>
  <div
    class="table-card"
    @click.stop="handlePreview"
  >
    <div class="card-container">
      <div class="card-header">
        <div class="title">
          <AIcon
            type="CodeOutlined"
            class="title-icon"
          />
          <j-ellipsis>
            {{ data.name }}
          </j-ellipsis>
        </div>
        <j-ellipsis>
          <div class="badge">标识：{{ data.id }}</div>
        </j-ellipsis>
      </div>
      <a-divider class="divider" />
      <div class="card-content">
        <div class="content-row">
          <div class="label">说明：</div>
          <j-ellipsis>
            <div class="text">{{ data.description || '--' }}</div>
          </j-ellipsis>
        </div>
        <div class="content-row horizontal">
          <div class="label">创建时间：</div>
          <div class="text date">{{ dayjs(createTime).format('YYYY-MM-DD HH:mm:ss') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" name="TaleCard" setup>
import dayjs from 'dayjs'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      commandId: '',
      description: '',
      createTime: ''
    })
  },
  createTime: {
    type: String,
    required: true,
    default: ''
  }
})
const emit = defineEmits(['click'])

const handlePreview = () => {
  emit('click', props.data)
}
</script>

<style lang="less" scoped>
.table-card {
  width: 100%;
  margin: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
  }
}

.card-container {
  height: 100%;
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: transparent;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  height: 24px;
  color: #262626;
  transition: color 0.3s ease;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;

  &-icon {
    color: #1890ff;
    font-size: 16px;
  }
}

.badge {
  color: #8c8c8c;
  max-width: 100%;
}

.divider {
  margin: 8px 0 12px;
  border-color: rgba(0, 0, 0, 0.06);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.content-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.horizontal {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
  }
}

.label {
  color: #262626;
  font-weight: normal;
}

.text {
  line-height: 1.5715;
  color: #8c8c8c;

  &.date {
    color: #8c8c8c;
  }
}
</style>
