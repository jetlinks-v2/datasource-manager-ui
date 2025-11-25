import { testDataSource } from '@datasource-manager-ui/api/data/datasource'
import { onlyMessage } from '@jetlinks-web/utils'

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
   */
  const testConnection = async (typeId: string, name: string, testData: any) => {
    try {
      loading.value = true
      const res = await testDataSource({
        typeId,
        name: name || 'test',
        shareConfig: testData,
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
