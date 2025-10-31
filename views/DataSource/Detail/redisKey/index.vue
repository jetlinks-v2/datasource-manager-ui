<template>
  <div class="redis-key-container">
    <KeyList
      ref="keyListRef"
      @select="handleSelect"
      :info="info"
    />

    <a-divider
      type="vertical"
      class="divider"
    />

    <div class="content-panel">
      <KeyDetail
        :selected-key="selectedKey"
        :datasource-id="datasourceId"
        :type-id="typeId"
        @deleted="handleDeleted"
        @refresh="handleRefresh"
      />
    </div>
  </div>
</template>

<script setup lang="ts" name="RedisKey">
import KeyList from './components/KeyList.vue'
import KeyDetail from './components/KeyDetail.vue'

const keyListRef = ref()

interface KeyItem {
  type: 'dir' | 'key'
  name: string
  prefix?: string
}

const props = defineProps<{
  info: Object
}>()

const route = useRoute()
const { info } = toRefs(props)

const selectedKey = ref<KeyItem | null>(null)
const datasourceId = computed(() => route.params.id as string)
const typeId = computed(() => route.query.typeId as string)

const handleSelect = (key: KeyItem) => {
  selectedKey.value = key
}

const handleDeleted = () => {
  selectedKey.value = null
}

const handleRefresh = () => {
  keyListRef.value?.refresh()
  selectedKey.value = null
}
</script>

<style scoped lang="less">
.redis-key-container {
  display: flex;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.divider {
  height: 100%;
  margin: 0;
}

.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 16px 24px 0 24px;
}
</style>
