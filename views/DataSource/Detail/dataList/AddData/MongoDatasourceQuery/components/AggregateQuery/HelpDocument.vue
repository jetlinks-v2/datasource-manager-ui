<template>
  <div class="help-content">
    <h4>{{ $t('DataSource.MongoAggregateHelp.100050-0') }}</h4>
    <p v-html="$t('DataSource.MongoAggregateHelp.100050-1')" />

    <h5 v-html="dynamicParamTitle" />
    <p v-html="$t('DataSource.MongoAggregateHelp.100050-3')" />
    <p v-html="$t('DataSource.MongoAggregateHelp.100050-4')" />
    <ul>
      <li
        v-for="(rule, idx) in dynamicParamRules"
        :key="idx"
        v-html="rule"
      />
    </ul>

    <h5>{{ $t('DataSource.MongoAggregateHelp.100050-7') }}</h5>
    <div class="mode-comparison">
      <div
        v-for="(mode, modeIndex) in modes"
        :key="modeIndex"
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

    <h5>{{ $t('DataSource.MongoAggregateHelp.100050-22') }}</h5>
    <p>{{ $t('DataSource.MongoAggregateHelp.100050-23') }}</p>
    <ul>
      <li
        v-for="(item, idx) in advancedScenarios"
        :key="idx"
      >
        <strong>{{ item.label }}</strong>
        ：{{ item.text }}
      </li>
    </ul>

    <h5>{{ $t('DataSource.MongoAggregateHelp.100050-34') }}</h5>
    <ul>
      <li
        v-for="(type, idx) in dataTypes"
        :key="idx"
      >
        {{ type.name }} →
        <code>{{ type.example }}</code>
      </li>
    </ul>

    <h5>{{ $t('DataSource.MongoAggregateHelp.100050-45') }}</h5>
    <p v-html="$t('DataSource.MongoAggregateHelp.100050-46')" />
    <pre>{{ normalModeExample }}</pre>
    <p v-html="$t('DataSource.MongoAggregateHelp.100050-48')" />
    <pre>{{ advancedModeExample }}</pre>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t: $t } = useI18n()

const buildPlaceholder = (name: string) => '${' + name + '}'

const dynamicExpressionSnippet = '${ ... }'
const objectExampleSnippet = '{ "key": "value" }'
const paramNameSnippet = computed(() => buildPlaceholder($t('DataSource.MongoAggregateHelp.100050-58')))

const dynamicParamTitle = computed(() =>
  $t('DataSource.MongoAggregateHelp.100050-2', { code: dynamicExpressionSnippet })
)

const dynamicParamRules = computed(() => [
  $t('DataSource.MongoAggregateHelp.100050-5', { code: paramNameSnippet.value }),
  $t('DataSource.MongoAggregateHelp.100050-6')
])

const samplePlaceholders = {
  status: buildPlaceholder('status'),
  minAge: buildPlaceholder('minAge'),
  tagList: buildPlaceholder('tagList')
}

const modes = computed(() => [
  {
    title: $t('DataSource.MongoAggregateHelp.100050-8'),
    items: [
      {
        label: $t('DataSource.MongoAggregateHelp.100050-10'),
        text: $t('DataSource.MongoAggregateHelp.100050-11')
      },
      {
        label: $t('DataSource.MongoAggregateHelp.100050-12'),
        text: $t('DataSource.MongoAggregateHelp.100050-13')
      },
      {
        label: $t('DataSource.MongoAggregateHelp.100050-14'),
        text: $t('DataSource.MongoAggregateHelp.100050-15', { value: samplePlaceholders.status })
      }
    ]
  },
  {
    title: $t('DataSource.MongoAggregateHelp.100050-16'),
    items: [
      {
        label: $t('DataSource.MongoAggregateHelp.100050-17'),
        text: $t('DataSource.MongoAggregateHelp.100050-18')
      },
      {
        label: $t('DataSource.MongoAggregateHelp.100050-12'),
        text: $t('DataSource.MongoAggregateHelp.100050-19')
      },
      {
        label: $t('DataSource.MongoAggregateHelp.100050-14'),
        text: $t('DataSource.MongoAggregateHelp.100050-20', { value: samplePlaceholders.minAge })
      },
      {
        label: $t('DataSource.MongoAggregateHelp.100050-14'),
        text: $t('DataSource.MongoAggregateHelp.100050-21', { value: samplePlaceholders.tagList })
      }
    ]
  }
])

const advancedScenarios = computed(() => [
  {
    label: $t('DataSource.MongoAggregateHelp.100050-24'),
    text: $t('DataSource.MongoAggregateHelp.100050-25')
  },
  {
    label: $t('DataSource.MongoAggregateHelp.100050-26'),
    text: $t('DataSource.MongoAggregateHelp.100050-27')
  },
  {
    label: $t('DataSource.MongoAggregateHelp.100050-28'),
    text: $t('DataSource.MongoAggregateHelp.100050-29')
  },
  {
    label: $t('DataSource.MongoAggregateHelp.100050-30'),
    text: $t('DataSource.MongoAggregateHelp.100050-31')
  },
  {
    label: $t('DataSource.MongoAggregateHelp.100050-32'),
    text: $t('DataSource.MongoAggregateHelp.100050-33')
  }
])

const dataTypes = computed(() => [
  {
    name: $t('DataSource.MongoAggregateHelp.100050-35'),
    example: $t('DataSource.MongoAggregateHelp.100050-36')
  },
  {
    name: $t('DataSource.MongoAggregateHelp.100050-37'),
    example: $t('DataSource.MongoAggregateHelp.100050-38')
  },
  {
    name: $t('DataSource.MongoAggregateHelp.100050-39'),
    example: $t('DataSource.MongoAggregateHelp.100050-40')
  },
  {
    name: $t('DataSource.MongoAggregateHelp.100050-41'),
    example: $t('DataSource.MongoAggregateHelp.100050-42', { objectExample: objectExampleSnippet })
  },
  {
    name: $t('DataSource.MongoAggregateHelp.100050-43'),
    example: $t('DataSource.MongoAggregateHelp.100050-44')
  }
])

const normalModeExample = computed(() => {
  const lines = [
    `// ${$t('DataSource.MongoAggregateHelp.100050-47')}`,
    '[',
    '  {',
    '    "$match": {',
    '      "status": ${status},        // ' + $t('DataSource.MongoAggregateHelp.100050-56'),
    '      "category": ${category}     // ' + $t('DataSource.MongoAggregateHelp.100050-57'),
    '    }',
    '  }',
    ']'
  ]
  return lines.join('\n')
})
const advancedModeExample = computed(() => {
  const lines = [
    `// ${$t('DataSource.MongoAggregateHelp.100050-49')}`,
    '[',
    '  {',
    '    "$match": {',
    '      "status": ${status},        // ' + $t('DataSource.MongoAggregateHelp.100050-50'),
    '      "age": { "$gte": ${minAge} },  // ' + $t('DataSource.MongoAggregateHelp.100050-51'),
    '      "isActive": ${isActive},    // ' + $t('DataSource.MongoAggregateHelp.100050-52'),
    '      "tags": { "$in": ${tagList} }  // ' + $t('DataSource.MongoAggregateHelp.100050-53'),
    '    }',
    '  },',
    '  { "$limit": ${pageSize} },      // ' + $t('DataSource.MongoAggregateHelp.100050-54'),
    '  { "$sort": { "createdAt": ${sortDir} } }  // ' + $t('DataSource.MongoAggregateHelp.100050-55'),
    ']'
  ]
  return lines.join('\n')
})
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
