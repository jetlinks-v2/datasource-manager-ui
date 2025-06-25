import { request } from '@jetlinks-web/core'
import { getToken } from '@jetlinks-web/utils'
import { BASE_API, TOKEN_KEY_URL } from '@jetlinks-web/constants'

export const FileStatic = '/file/upload'

/**
 * 批量上传
 * @param data 文件列表
 * @param publicAccess 是否鉴权
 * @returns
 */
export const fileBatchUpload = (data: any, publicAccess?: boolean) => {
  const url = '/file/batch/upload'
  return request.post(publicAccess ? url : url + '?options=publicAccess', data)
}

/**
 * 获取文件url
 * @param id 文件id
 * @param thumb 压缩参数
 * @returns
 */
export const getFileUrlById = (id: string, thumb?: string) => {
  const thumbParam = thumb ? `&thumb=${thumb}` : ''
  const token = `${TOKEN_KEY_URL}=${getToken()}`
  return `${BASE_API}/file/${id}?${token}${thumbParam}`
}
