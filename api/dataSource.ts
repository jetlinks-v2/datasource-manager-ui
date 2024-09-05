import {request} from '@jetlinks-web/core'

// 获取数据源列表
export const getDataSourceList_api = (data: object) => request.post(`/datasource/config/_query/`, data);
// 获取数据源信息
export const getDataSourceInfo_api = (id: string) => request.get(`/datasource/config/${id}`);

// 获取数据库类型字典
export const getDataTypeDict_api = () => request.get(`/datasource/config/types`);

// 修改数据源状态
export const changeStatus_api = (id: string, status: '_disable' | '_enable') => request.put(`/datasource/config/${id}/${status}`);
// 新增/更新数据源
export const saveDataSource_api = (data: any) => data.id ? request.patch(`datasource/config`, data) : request.post(`/datasource/config`, data)

// 删除数据源
export const delDataSource_api = (id: string) => request.remove(`/datasource/config/${id}`);
// 获取左侧树
export const rdbTree_api = (id: string) => request.get(`/datasource/rdb/${id}/tables?includeColumns=false`);
// 获取右侧表格
export const rdbTables_api = (id: string, key: string) => request.get(`/datasource/rdb/${id}/table/${key}`);
// 保存表格
export const saveTable_api = (id: string, data: object) => request.patch(`/datasource/rdb/${id}/table`, data);
/**
 * 删除已保存的行
 */
export const delSaveRow_api = (datasourceId: string, table: string, data: any) => request.post(`/datasource/rdb/${datasourceId}/table/${table}/drop-column`, data);
