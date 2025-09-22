import { request } from '@jetlinks-web/core'

//查询数据源列表
export const getDataSourceList = (data: any) => request.post('datasource/config/_query', data)

//新增一个数据源
export const addDataSource = (data: any) => request.post('/datasource/config', data)

//修改一个数据源
export const updateDataSource = (data: any) => request.patch('/datasource/config', data)

//禁用一个数据源
export const disableDataSource = (id: string) => request.put(`/datasource/config/${id}/_disable`)

//启用一个数据源
export const enableDataSource = (id: string) => request.put(`/datasource/config/${id}/_enable`)

//删除一个数据源
export const deleteDataSource = (id: string) => request.remove(`/datasource/config/${id}`)

//查询数据源详情
export const getDataSourceDetail = (id: string) => request.get(`/datasource/config/${id}`)

//查询数据源标识是否重复
export const getDataSourceRepeat = (data: any) => {
  return request.get(`/datasource/config/_exists?where=id is ${data}`)
}

//刷新RDB表结构
export const refreshTable = (datasourceId: string, data = {}) =>
  request.post(`/datasource/rdb/${datasourceId}/Refresh`, data)
// export const refreshTable = (data: any) =>
//   request.post(`/datasource/rdb/{datasourceId}/Refresh`, data)
//测试数据源连接状态
export const testDataSource = (data: any) => request.post('datasource/config/_state', data)

//获取数据库表
export const getDataSourceTables = (id: string) => request.get(`datasource/rdb/${id}/tables`)
// 执行SQL语句
export const handleSQL_api = (datasourceId: string, data: any) =>
  request.post(`datasource/rdb/${datasourceId}/ExecuteSql`, data)

// 新增API数据源
export const addAPIDataSource_api = (data: any) => request.post(`/datasource/config`, data)

// 编辑API数据源
export const editAPIDataSource_api = (data: any) => request.patch(`/datasource/config`, data)

//执行分页查询命令
export const queryByPage = (id: string, data: any) => request.post(`datasource/rdb/${id}/QueryPager`, data)

// 查询命令组
export const queryCommandGroup = (data: any) => request.post(`/datasource/command/group/_query/no-paging`, data)

//查询命令标识是否重复
export const checkCommandExists = (data: any) => request.post(`datasource/_exists`, data)

//新增数据源命令
export const addDataSourceCommand = (data: any) => request.post(`datasource`, data)

//编辑数据源命令
export const editDataSourceCommand = (data: any) => request.patch(`datasource`, data)

//删除数据源命令
export const deleteDataSourceCommand = (id: string) => request.remove(`datasource/${id}`)

/**
 * 测试API数据源
 * @param datasourceId 数据源ID
 * @param data 请求参数
 * @returns 测试结果
 */
export const testAPIDataSource = (datasourceId: string, data: any) =>
  request.post(`/datasource/api/${datasourceId}/HttpExprRequest`, data)

// 导入数据源
export const importDataSource = (dataSourceId: string, dataSoourceType: string, data: any) =>
  request.post(`/datasource/${dataSourceId}/${dataSoourceType}/import`, data)

/**
 * 获取数据源
 * @returns
 */
export const getDatasource = (data: any) => request.post('/datasource/_query/no-paging', data)

//根据功能查询下面支持的命令cmd
export const getDataSourceCommands = (dataSourceId: string, support: string) =>
  request.get(`/datasource/${dataSourceId}/commands?support=${support}`)
