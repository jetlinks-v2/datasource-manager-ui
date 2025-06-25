/**
 * 生成随机数
 * @param length
 * @returns
 */
export const randomString = (length?: number) => {
  const tempLength = length || 32
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678'
  const maxPos = chars.length
  let pwd = ''
  for (let i = 0; i < tempLength; i += 1) {
    pwd += chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return pwd
}

/**
 * 验证字符串前后不能有空格
 * @param value
 * @returns {Promise<void>}
 */
export const spaceValidator = async (_: any, value: string) => {
  const reg = /(^\s+)|(\s+$)/
  if (reg.test(value)) {
    return Promise.reject(new Error('前后不能有空格'))
  }
  return Promise.resolve()
}

/**
 * 为了区分是本地的图片还是线上的图片
 * @param id
 * @param thumb 压缩参数: 长_宽
 */
export const getImageUrl = (id: string, thumb?: string) => {
  if (id.includes('localhost')) {
    return getImage(id.replace('localhost', ''))
  }
  return getFileUrlById(id, thumb)
}
