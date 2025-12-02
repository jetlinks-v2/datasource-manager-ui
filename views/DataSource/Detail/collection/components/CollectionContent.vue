<template>
  <div class="collection-content">
    <template v-if="props.currentCollection">
      <a-tabs
        v-model:activeKey="activeTab"
        class="collection-tabs"
        type="card"
      >
        <a-tab-pane
          key="stats"
          :tab="$t('DataSource.Collection.100094-0')"
        >
          <CollectionStats
            ref="statsRef"
            :current-collection="props.currentCollection"
          />
        </a-tab-pane>

        <a-tab-pane
          key="data"
          :tab="$t('DataSource.Collection.100094-1')"
        >
          <CollectionDataTable :current-collection="props.currentCollection" />
        </a-tab-pane>
      </a-tabs>
    </template>
    <div
      v-else
      class="empty-content"
    >
      <j-empty :description="$t('DataSource.Collection.100094-2')" />
    </div>
  </div>
</template>

<script setup lang="ts" name="CollectionContent">
import CollectionDataTable from './CollectionDataTable.vue'
import CollectionStats from './CollectionStats.vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const props = defineProps<{
  currentCollection: string
}>()

const activeTab = ref('stats')
const statsRef = ref<InstanceType<typeof CollectionStats>>()

// 监听 tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'stats' && props.currentCollection) {
    statsRef.value?.fetchStats()
  }
})

// 监听集合切换
watch(
  () => props.currentCollection,
  (newCollection) => {
    // 如果当前在状态 tab，切换集合时自动刷新统计信息
    if (activeTab.value === 'stats' && newCollection) {
      nextTick(() => {
        statsRef.value?.fetchStats()
      })
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="less">
.collection-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-left: 24px;

  :deep(.collection-tabs) {
    height: 100%;
    display: flex;
    flex-direction: column;

    .ant-tabs-content {
      height: 100%;
    }
  }
}

.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 360px);
}
</style>
