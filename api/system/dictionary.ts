import { request } from '@jetlinks-web/core'

/**
 * 查询字典项不分页
 */
export const queryDicItemNoPage = (data: any) => request.post('/dictionary-item/_query/no-paging', data)
