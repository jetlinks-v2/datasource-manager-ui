<template>
  <div class="script-query">
    <div class="placeholder-content">
      <a-empty description="脚本查询功能开发中">
        <template #description>
          <span class="placeholder-text">脚本查询功能开发中，敬请期待</span>
        </template>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts" name="ScriptQuery">
defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:configuration'])

const updateConfiguration = () => {
  const config = {
    pattern: '',
    provider: 'script',
    description: ''
  }
  emit('update:configuration', config)
}

const validateAll = async () => {
  return true
}

onMounted(() => {
  updateConfiguration()
})

defineExpose({
  validateAll
})
</script>

<style scoped lang="less">
.script-query {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-content {
    text-align: center;
  }

  .placeholder-text {
    color: #8c8c8c;
    font-size: 14px;
  }
}
</style>