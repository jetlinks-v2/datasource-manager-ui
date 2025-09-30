import { cloneDeep } from 'lodash-es'

// 弹窗一选择类型
let checkType: string | null = null
let cachedData: any = null
let relationData: any = null
let genericLibraryData: any = null
let headerParams: any = null
let elasticsearchData: any = null

export function useSourceDetailStore() {
  // 缓存基本信息
  const saveCache = (detail: any) => {
    cachedData = cloneDeep(detail)
  }

  // 缓存选择类型
  const saveType = (type: string) => {
    checkType = type
  }

  // 缓存详情
  const saveRelationData = (detail: any) => {
    relationData = cloneDeep(detail)
  }

  // 缓存通用库数据
  const saveGenericData = (detail: any) => {
    genericLibraryData = cloneDeep(detail)
  }

  // 缓存请求头参数数据
  const saveHeaderData = (detail: any) => {
    headerParams = cloneDeep(detail)
  }

  // 缓存ES数据
  const saveElasticsearchData = (detail: any) => {
    elasticsearchData = cloneDeep(detail)
  }

  // 清除缓存
  const clearCache = () => {
    cachedData = null
    checkType = null
    relationData = null
    genericLibraryData = null
    headerParams = null
    elasticsearchData = null
  }

  return {
    cachedData,
    checkType,
    relationData,
    genericLibraryData,
    headerParams,
    elasticsearchData,
    saveCache,
    saveType,
    saveRelationData,
    saveGenericData,
    saveHeaderData,
    saveElasticsearchData,
    clearCache
  }
}
