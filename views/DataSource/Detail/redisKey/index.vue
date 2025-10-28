<template>
  <div class="redis-key-container">
    {{ info }}
    <a-divider
      type="vertical"
      class="divider"
    />
  </div>
</template>

<script setup lang="ts" name="RedisKey">
const props = defineProps<{
  info: Object
}>()

const { info } = toRefs(props)
</script>

<style scoped>
.redis-key-container {
  display: flex;
  height: 100%;
  border-radius: 8px;
}

.divider {
  height: 100%;
  margin: 0;
}
</style>
