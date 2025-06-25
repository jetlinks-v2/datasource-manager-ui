# CategorySelect 分类选择组件

一个用于显示和管理分类列表的组件，支持分类的新增、重命名和删除操作。组件已重构为更小的子组件，提高了可维护性和复用性。

## 组件结构

```
CategorySelect/
├── index.vue                # 主组件
├── components/
│   ├── CategoryHeader.vue   # 头部和搜索组件
│   ├── CategoryItem.vue     # 分类项组件
│   └── CategoryModal.vue    # 弹窗和表单组件
└── README.md                # 文档
```

## 使用示例

```vue
<template>
  <CategorySelect
    ref="categorySelect"
    :data="categoryList"
    valueKey="id"
    labelKey="name"
    :defaultKey="DEFAULT_CATEGORY_ID"
    :showId="false"
    :permission="permission"
    :active-id="activeCategory?.id"
    removeDefaultMore
    @change="handleChange"
    @search="handleSearch"
    @click="handleClick"
    @delete="handleClickDelete"
  >
    <template #content="{ item }">
      <j-ellipsis>
        <div>{{ item.name }}</div>
      </j-ellipsis>
    </template>
  </CategorySelect>
</template>

<script setup>
import CategorySelect from '@visualization/components/CategorySelect/index.vue'

// 分类数据
const categoryList = ref([
  { id: 'default', name: '全部' },
  { id: '1', name: '分类1' }
])
const activeCategory = ref({})

// 处理点击分类
const handleClick = (item) => {
  activeCategory.value = item
}

// 处理搜索
const handleSearch = (value) => {
  // 执行搜索逻辑
}

// 处理修改分类
const handleChange = (item) => {
  // 处理分类新增或修改
}

// 处理删除分类
const handleClickDelete = (id) => {
  // 处理分类删除
}
</script>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 分类数据列表 | `Array` | `[]` |
| defaultKey | 默认分类的标识 | `string` | `'default'` |
| labelKey | 分类名称的字段名 | `string` | `'text'` |
| labelRules | 分类名称的校验规则 | `Rule[]` | `[]` |
| valueKey | 分类标识的字段名 | `string` | `'value'` |
| valueRules | 分类标识的校验规则 | `Rule[]` | `[]` |
| idKey | 分类ID的字段名 | `string` | `'id'` |
| showId | 是否显示分类标识字段 | `boolean` | `true` |
| removeEdit | 是否移除编辑功能 | `boolean` | `false` |
| bodyStyle | 列表容器的样式 | `object` | `{}` |
| removeDefaultMore | 是否移除默认分类的更多操作 | `boolean` | `false` |
| activeId | 当前活动分类的ID | `string` | - |
| permission | 权限前缀 | `string` | - |

## 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| click | 点击分类项时触发 | `item: 分类项数据` |
| change | 新增或修改分类时触发 | `item: 修改后的分类数据` |
| delete | 删除分类时触发 | `id: 分类ID` |
| search | 搜索时触发 | `value: 搜索关键词` |
| more | 点击更多按钮时触发 | `id?: 分类ID` |

## 插槽

| 名称 | 说明 | 插槽参数 |
| --- | --- | --- |
| content | 分类项内容 | `{ item: 分类项数据 }` |
| action | 分类项操作区域 | `{ item: 分类项数据 }` |

## 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| setActiveId | 设置当前活动分类 | `item: 分类项数据` |
| handleCloseSearch | 关闭搜索模式 | - |

## 子组件

### CategoryHeader

头部组件，包含分类数量显示、搜索功能和添加按钮。实现了与ListHeader组件相同的搜索动画效果。

### CategoryItem

分类项组件，显示单个分类项。

### CategoryModal

弹窗组件，包含表单功能，用于新增和编辑分类。 