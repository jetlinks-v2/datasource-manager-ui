<template>
  <div class="redis-key-container">
    <KeyList
      @select="handleSelect"
      :info="info"
    />

    <a-divider
      type="vertical"
      class="divider"
    />

    <div class="content-panel">
      <div class="content-placeholder">
        <j-empty description="请选择一个键查看详情" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RedisKey">
import KeyList from './components/KeyList.vue'

const props = defineProps<{
  info: Object
}>()

const { info } = toRefs(props)
// info数据示例
/**
 *{
     "id": "data_source_MZyR",
     "typeId": "redis",
     "name": "测试1",
     "group": "1983828842281148416",
     "searchCode": "redis",
     "description": "",
     "creatorId": "1199596756811550720",
     "creatorName": "超级管理员",
     "createTime": 1761816697465,
     "shareConfig": {
         "host": "192.168.32.154",
         "port": 26379,
         "userName": "",
         "password": "",
         "databaseIndex": 0,
         "delimiter": ":"
     },
     "shareCluster": true,
     "state": {
         "text": "正常",
         "value": "enabled"
     }
 }
 */
console.log(info.value, 'info')

const handleSelect = (key: string) => {
  console.log(key)
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
  overflow: hidden;
  padding: 16px 24px;

  .content-placeholder {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
}
</style>
