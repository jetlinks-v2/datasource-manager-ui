// 格式化过期时间
export const formatExpiration = (exp: number | string) => {
  if (!exp) return '查询中...'
  const expNum = parseInt(String(exp))
  if (expNum === -1) return '永久'
  if (expNum === -2) return '键不存在'
  if (expNum < 0) return '未知'

  const now = new Date()
  const expirationTime = new Date(now.getTime() + expNum * 1000)

  const year = expirationTime.getFullYear()
  const month = String(expirationTime.getMonth() + 1).padStart(2, '0')
  const day = String(expirationTime.getDate()).padStart(2, '0')
  const hours = String(expirationTime.getHours()).padStart(2, '0')
  const minutes = String(expirationTime.getMinutes()).padStart(2, '0')
  const seconds = String(expirationTime.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}
