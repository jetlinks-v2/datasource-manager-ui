import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'

export const useSourceDetailStore = defineStore('sourceDetail', () => {
  //  弹窗一选择类型
  const checkType = ref()
  //  基本信息
  const cachedData = ref()
  //  详情
  const relationData = ref()
  //   通用库数据
  const genericLibraryData = ref()
  // 请求头参数数据
  const headerParams = ref()
  //  缓存数据
  const saveCache = (detail: any) => {
    cachedData.value = cloneDeep(detail)
  }
  //  缓存选择类型
  const saveType = (type: string) => {
    checkType.value = type
  }
  const saveRelationData = (detail: any) => {
    relationData.value = cloneDeep(detail)
  }

  const saveGenericData = (detail: any) => {
    genericLibraryData.value = cloneDeep(detail)
  }
  //   缓存请求头参数数据
  const saveHeaderData = (detail: any) => {
    headerParams.value = cloneDeep(detail)
  }
  return {
    cachedData,
    checkType,
    relationData,
    genericLibraryData,
    headerParams,
    saveCache,
    saveType,
    saveRelationData,
    saveGenericData,
    saveHeaderData,
  }
})
