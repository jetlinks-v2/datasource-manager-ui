import { isString, isObject } from 'lodash-es'
import i18n from '@jetlinks-web-core/locales'

// 格式化过期时间
export const formatExpiration = (exp: number | string) => {
  if (!exp) return i18n.global.t('DataSource.Utils.100093-0')
  const expNum = parseInt(String(exp))
  if (expNum === -1) return i18n.global.t('DataSource.Utils.100093-1')
  if (expNum === -2) return i18n.global.t('DataSource.Utils.100093-2')
  if (expNum < 0) return i18n.global.t('DataSource.Utils.100093-3')

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

// 生成随机的十六进制字符串
const generateRandomHex = (length: number): string => {
  let result = ''
  const characters = '0123456789abcdef'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

//转换对象ID
export const convertObjectId = (obj: any): string => {
  if (isString(obj)) return obj

  if (isObject(obj)) {
    const objAny = obj as any
    const timestamp = objAny.timestamp ? objAny.timestamp.toString(16).padStart(8, '0') : generateRandomHex(8)
    const machine = objAny.machine ? objAny.machine.toString(16).padStart(6, '0') : generateRandomHex(6)
    const processId = objAny.processId ? objAny.processId.toString(16).padStart(4, '0') : generateRandomHex(4)
    const counter = objAny.counter ? objAny.counter.toString(16).padStart(6, '0') : generateRandomHex(6)

    return timestamp + machine + processId + counter
  }

  return obj || generateRandomHex(24)
}
