<template>
  <div class="help-content">
    <h4>聚合查询</h4>
    <p>
      本工具用于在页面上编写
      <strong>MongoDB 聚合脚本（aggregate pipeline）</strong>
      ，
      一步步处理并返回数据结果。脚本由多个"阶段（stage）"组成，每个阶段完成一种操作（过滤、分组、排序…），按从上到下的顺序执行。
    </p>

    <h5>
      动态参数
      <code>${ ... }</code>
      规则
    </h5>
    <p>
      <strong>作用</strong>
      ：执行时根据你给的参数自动替换。
    </p>
    <p><strong>写法与要求</strong></p>
    <ul>
      <li>
        变量写成
        <code>${参数名}</code>
        ，
        <strong>不要</strong>
        再加引号，否则会报错。
      </li>
      <li>
        只能放在"值"的位置，
        <strong>不要</strong>
        写在字段名里，也
        <strong>不要</strong>
        与其他文字拼接。
      </li>
    </ul>

    <h5>普通模式 vs 高级模式</h5>
    <div class="mode-comparison">
      <div
        v-for="mode in modes"
        :key="mode.title"
        class="mode-item"
      >
        <h6>{{ mode.title }}</h6>
        <ul>
          <li
            v-for="(item, idx) in mode.items"
            :key="idx"
          >
            <strong>{{ item.label }}</strong>
            ：
            <span v-html="item.text" />
          </li>
        </ul>
      </div>
    </div>

    <h5>何时需要高级模式？</h5>
    <p>当你的动态参数用于以下场景时，必须使用高级模式：</p>
    <ul>
      <li
        v-for="(item, idx) in advancedScenarios"
        :key="idx"
      >
        <strong>{{ item.label }}</strong>
        ：{{ item.text }}
      </li>
    </ul>

    <h5>支持的数据类型</h5>
    <ul>
      <li
        v-for="(type, idx) in dataTypes"
        :key="idx"
      >
        {{ type.name }} →
        <code>{{ type.example }}</code>
      </li>
    </ul>

    <h5>示例</h5>
    <p><strong>普通模式示例（仅字符串）：</strong></p>
    <pre>{{ normalModeExample }}</pre>
    <p><strong>高级模式示例（多种类型）：</strong></p>
    <pre>{{ advancedModeExample }}</pre>
  </div>
</template>

<script setup lang="ts">
const modes = [
  {
    title: '普通模式',
    items: [
      { label: '限制', text: '动态参数只能输入<strong>字符串类型</strong>' },
      { label: '适用场景', text: '参数值都是字符串，如状态码、名称、ID 等' },
      { label: '示例', text: '<code>"status": ${status}</code> → 输入 "active"' }
    ]
  },
  {
    title: '高级模式',
    items: [
      { label: '支持', text: '可以输入<strong>任意 JSON 类型</strong>（数字、布尔、对象、数组）' },
      { label: '适用场景', text: '需要传入数字、布尔值、对象或数组类型的参数' },
      { label: '示例', text: '<code>"age": ${minAge}</code> → 输入 18（数字）' },
      { label: '示例', text: '<code>"tags": ${tagList}</code> → 输入 ["tag1", "tag2"]（数组）' }
    ]
  }
]

const advancedScenarios = [
  { label: '数字类型阶段', text: '$limit、$skip 等需要数字参数' },
  { label: '数组类型阶段', text: '$unset、$documents 等需要数组参数' },
  { label: '对象中的非字符串值', text: '如年龄、价格、数量等数字字段' },
  { label: '布尔值', text: '如开关状态、是否启用等' },
  { label: '复杂对象或数组', text: '如嵌套的查询条件、标签列表等' }
]

const dataTypes = [
  { name: '字符串', example: '"abc"' },
  { name: '数字', example: '123' },
  { name: '布尔', example: 'true/false' },
  { name: '对象', example: '{ "key": "value" }' },
  { name: '数组', example: '["item1", "item2"]' }
]

const normalModeExample = `// 普通模式：所有参数都是字符串
[
  {
    "$match": {
      "status": \${status},        // 输入: "active"
      "category": \${category}     // 输入: "electronics"
    }
  }
]`

const advancedModeExample = `// 高级模式：支持多种数据类型
[
  {
    "$match": {
      "status": \${status},        // 字符串: "active"
      "age": { "$gte": \${minAge} },  // 数字: 18
      "isActive": \${isActive},    // 布尔: true
      "tags": { "$in": \${tagList} }  // 数组: ["tag1", "tag2"]
    }
  },
  { "$limit": \${pageSize} },      // 数字: 10
  { "$sort": { "createdAt": \${sortDir} } }  // 数字: -1 或 1
]`
</script>

<style scoped lang="less">
.help-content {
  max-height: 500px;
  max-width: 580px;
  overflow-y: auto;
  padding: 4px;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  h5 {
    margin: 20px 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #262626;
    &:first-of-type {
      margin-top: 16px;
    }
  }

  p {
    margin: 0 0 16px 0;
    line-height: 1.6;
    color: #595959;
    font-size: 14px;
    strong {
      color: #262626;
      font-weight: 600;
    }
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

  .mode-comparison {
    display: flex;
    gap: 16px;
    margin: 12px 0 16px 0;

    .mode-item {
      flex: 1;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 6px;
      border: 1px solid #e8e8e8;

      h6 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #262626;
      }
      ul {
        margin: 0;
        padding-left: 20px;
        li {
          margin: 6px 0;
          font-size: 13px;
        }
      }
    }
  }
}
</style>
