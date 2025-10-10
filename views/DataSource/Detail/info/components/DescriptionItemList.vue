<template>
  <div class="description-item-list">
    <TitleComponent
      v-if="title"
      :data="title"
      class="title"
    />

    <a-descriptions
      :column="column"
      bordered
    >
      <a-descriptions-item
        v-for="item in visibleItems"
        :key="item.key"
      >
        <template #label>
          <span v-if="!isComplexLabel(item.label)">{{ item.label }}</span>
          <a-space v-else>
            <span style="white-space: nowrap">{{ item.label.text }}</span>
            <a-tooltip v-if="item.label.tooltip">
              <template #title>{{ item.label.tooltip }}</template>
              <AIcon
                type="QuestionCircleFilled"
                style="color: #777"
              />
            </a-tooltip>
          </a-space>
        </template>

        <!-- 如果有对应的插槽，使用插槽 -->
        <slot
          v-if="$slots[item.key]"
          :name="item.key"
          :item="item"
        ></slot>
        <!-- 否则使用默认渲染 -->
        <component
          v-else
          :is="item.component || 'j-ellipsis'"
          v-bind="item.componentProps"
        >
          <template v-if="!item.component">
            {{ item.value ?? placeholder }}
          </template>
        </component>
      </a-descriptions-item>
    </a-descriptions>
  </div>
</template>

<script lang="ts" setup>
export interface DescriptionLabel {
  text: string
  tooltip?: string
}

export interface DescriptionItem {
  key: string
  label: string | DescriptionLabel
  value?: string
  component?: Component | string
  componentProps?: Record<string, any>
  condition?: boolean
}

const props = withDefaults(
  defineProps<{
    column?: number
    title?: string
    items: DescriptionItem[]
    placeholder?: string
  }>(),
  {
    column: 3,
    title: '',
    placeholder: '--'
  }
)

const visibleItems = computed(() =>
  props.items.filter((item) => (item.condition === undefined ? true : item.condition))
)

const isComplexLabel = (label: DescriptionItem['label']) => typeof label !== 'string'
</script>

<style lang="less" scoped>
.description-item-list {
  margin-bottom: 16px;
  .title {
    font-size: 16px;
    height: 32px;
    line-height: 32px;
  }
}
</style>
