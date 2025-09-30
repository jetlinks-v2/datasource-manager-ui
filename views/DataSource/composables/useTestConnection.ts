import { ref } from 'vue'
import { testDataSource } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'
import { DATA_TYPE_ITEM } from '../components/table'

/**
 * 测试连接配置类型
 */
export type TestConnectionConfig = {
  buildShareConfig: (data: any, extraParams?: any) => any
}

/**
 * 测试连接配置映射
 */
export const testConnectionConfigs: Record<string, TestConnectionConfig> = {
  // RDB 数据源配置
  [DATA_TYPE_ITEM.RDB_DATASOURCE]: {
    buildShareConfig: (data: any, extraParams?: any) => {
      const { url, username, password, schema, type } = data
      const dbType = extraParams?.type || type
      return {
        type: dbType,
        url,
        username,
        password,
        schema,
        others: {}
      }
    }
  },
  // Elasticsearch 数据源配置
  [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: {
    buildShareConfig: (data: any) => {
      const { uri, pathPrefix, username, password } = data
      return {
        uri,
        pathPrefix,
        username,
        password
      }
    }
  }
}

/**
 * 测试连接 Composable
 */
export function useTestConnection() {
  const loading = ref(false)

  /**
   * 通用测试连接函数
   * @param typeId 数据源类型ID
   * @param name 数据源名称
   * @param testData 测试数据
   * @param extraParams 额外参数
   */
  const testConnection = async (typeId: string, name: string, testData: any, extraParams?: any) => {
    const config = testConnectionConfigs[typeId]
    if (!config) {
      onlyMessage('不支持的数据源类型', 'error')
      return false
    }

    const { buildShareConfig } = config

    try {
      loading.value = true

      const shareConfig = buildShareConfig(testData, extraParams)

      const res = await testDataSource({
        typeId,
        name: name || 'test',
        shareConfig,
        shareCluster: true
      })

      if (res?.result.ok === true) {
        onlyMessage('连接数据源成功')
        return true
      } else {
        const errorMsg = res?.result?.reason?.cause?.message || '请求超时'
        onlyMessage(`连接数据源失败，${errorMsg}`, 'error')
        return false
      }
    } catch (err) {
      onlyMessage('连接数据源失败', 'error')
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    testConnection
  }
}
