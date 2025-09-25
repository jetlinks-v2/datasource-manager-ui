<template>
  <div
    class="card"
    @click.stop="handlePreview"
  >
    <header>
      <AIcon type="CodeOutlined" />
      <j-ellipsis>
        <div class="title">{{ data.name }}</div>
      </j-ellipsis>
    </header>

    <div class="badge-wrapper">
      <span class="badge">标识：</span>
      <j-ellipsis>{{ data.id }}</j-ellipsis>
    </div>

    <section>
      <p>
        <a-space>
          <span>说明：</span>
          <j-ellipsis>{{ data.description || '--' }}</j-ellipsis>
        </a-space>
      </p>
      <p>
        <span>创建时间：</span>
        {{ formatTime }}
      </p>
    </section>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'

const props = defineProps({
  data: {
    type: Object,
    required: true,
    default: () => ({
      name: '',
      id: '',
      description: '',
      createTime: ''
    })
  },
  createTime: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['click'])

const formatTime = computed(() => dayjs(props.createTime).format('YYYY-MM-DD HH:mm:ss'))

const handlePreview = () => emit('click', props.data)
</script>

<style lang="less" scoped>
.card {
  margin: 8px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .anticon {
      font-size: 16px;
      color: #1890ff;
    }

    .title {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .badge-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    color: #8c8c8c;

    .badge {
      white-space: nowrap;
    }
  }

  section {
    margin-top: 12px;

    p {
      margin: 8px 0;
      color: #8c8c8c;

      span {
        color: #262626;
        margin-right: 4px;
        white-space: nowrap;
      }
    }
  }
}
</style>
