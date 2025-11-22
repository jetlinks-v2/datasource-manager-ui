<template>
  <div class="help-content">
    <h4>参数占位符使用说明</h4>
    <p>
      在阶段 JSON 中使用
      <code>${'${paramName}'}</code>
      标记动态值，执行时会替换为实际参数值。
    </p>

    <h5>示例：</h5>
    <pre>{{ helpExamples }}</pre>

    <h5>支持的阶段类型：</h5>
    <ul>
      <li>
        <strong>$match</strong>
        - 条件过滤
      </li>
      <li>
        <strong>$project</strong>
        - 字段投影/计算
      </li>
      <li>
        <strong>$group</strong>
        - 分组聚合
      </li>
      <li>
        <strong>$sort</strong>
        - 排序
      </li>
      <li>
        <strong>$limit</strong>
        - 限制条数
      </li>
      <li>
        <strong>$skip</strong>
        - 跳过条数
      </li>
      <li>
        <strong>$lookup</strong>
        - 关联集合
      </li>
      <li>
        <strong>$unwind</strong>
        - 拆分数组
      </li>
      <li>
        <strong>$addFields</strong>
        - 添加计算字段
      </li>
      <li>
        <strong>$facet</strong>
        - 多路子管道
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const helpExamples = `{
  "status": "\${status}",
  "age": { "$gte": \${minAge} },
  "category": "\${category}"
}`
</script>

<style scoped lang="less">
.help-content {
  max-height: 500px;
  max-width: 480px;
  overflow-y: auto;
  padding: 4px;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
    line-height: 1.4;
  }

  h5 {
    margin: 20px 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    line-height: 1.4;

    &:first-of-type {
      margin-top: 16px;
    }
  }

  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
    color: #595959;
    font-size: 14px;
  }

  code {
    padding: 3px 8px;
    background: #fff7e6;
    border: 1px solid #ffd591;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    color: #d46b08;
    font-weight: 500;
  }

  pre {
    padding: 16px;
    background: #fafafa;
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    overflow-x: auto;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #262626;
    margin: 12px 0;
  }

  ul {
    margin: 0 0 16px 0;
    padding-left: 24px;

    li {
      margin: 8px 0;
      line-height: 1.6;
      color: #595959;
      font-size: 14px;

      strong {
        color: #1890ff;
        font-weight: 600;
        font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
        font-size: 13px;
      }
    }
  }
}
</style>
