import { request } from '@jetlinks-web/core'
/**
 * 数据源通用命令接口
 * @param {string} datasourceId
 * @param {string} command
 * @param data
 */
export const datasourceExecuteCommand_api = (datasourceId: string, command: string, data: any) =>
  request.post(`/datasource/rdb/${datasourceId}/${command}`, data)

/**
 * API数据校验
 * @param {string} datasourceId
 * @param data
 */
export const sendHttpRequest = (datasourceId: string, data: any = {}) =>
  request.post(`/datasource/api/${datasourceId}/HttpRequest`, data)

// 获取数据源列表
export const getDataSourceList = (data: any) => request.post(`/datasource/_query`, data)

// 获取数据源分类列表
export const getDataSourceGroup = (data: any) => request.post('/datasource/config/group/_query/no-paging', data)

// 新增数据源分类
export const addDataSourceGroup = (data: any) => request.post('/datasource/config/group', data)

// 编辑数据源分类
export const updateDataSourceGroup = (id: string, data: any) => request.put(`/datasource/config/group/${id}`, data)

// 删除数据源分类
export const deleteDataSourceGroup = (id: string) => request.remove(`/datasource/config/group/${id}`)
