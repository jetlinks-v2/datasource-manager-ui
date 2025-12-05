import DataApi from '@datasource-manager-ui/assets/svg/data-api.svg'
import DataDm from '@datasource-manager-ui/assets/svg/data-dm.svg'
import DataEsApi from '@datasource-manager-ui/assets/svg/data-es-api.svg'
import DataMariadb from '@datasource-manager-ui/assets/svg/data-mariadb.svg'
import DataMongodb from '@datasource-manager-ui/assets/svg/data-mongodb.svg'
import DataMysql from '@datasource-manager-ui/assets/svg/data-mysql.svg'
import DataPostgresql from '@datasource-manager-ui/assets/svg/data-postgresql.svg'
import DataOracle from '@datasource-manager-ui/assets/svg/data-orcale.svg'
import DataRedis from '@datasource-manager-ui/assets/svg/data-redis.svg'
import DataSqlserver from '@datasource-manager-ui/assets/svg/data-sqlserver.svg'
import DataWebsocket from '@datasource-manager-ui/assets/svg/data-websocket.svg'
import { isArray } from 'lodash-es'
import i18n from '@/locales'

export enum DATA_TYPE_ITEM {
  RDB_DATASOURCE = 'rdb', // 关系型数据库表单 (MySQL, PostgreSQL等)
  API_SEND = 'api', // 通用表单 (API)
  WEBSOCKET_DATASOURCE = 'websocket', // WebSocket表单
  ELASTICSEARCH_DATASOURCE = 'elasticsearch', // Elasticsearch表单
  REDIS_DATASOURCE = 'redis', // Redis表单
  MONGODB_DATASOURCE = 'mongodb' // MongoDB表单
}

//数据源类型
export const DATASOURCE_TYPE = {
  API: 'api',
  WEBSOCKET: 'websocket',
  MYSQL: 'mysql',
  MARIADB: 'mariadb',
  POSTGRESQL: 'postgresql',
  ORACLE: 'oracle',
  SQLSERVER: 'sqlserver',
  MONGODB: 'mongodb',
  DAMENG: 'dm',
  REDIS: 'redis',
  ELASTICSEARCH: 'elasticsearch'
}

export const DATASOURCE_NAME = {
  [DATASOURCE_TYPE.API]: 'API',
  [DATASOURCE_TYPE.WEBSOCKET]: 'WebSocket',
  [DATASOURCE_TYPE.MYSQL]: 'MySQL',
  [DATASOURCE_TYPE.MARIADB]: 'MariaDB',
  [DATASOURCE_TYPE.POSTGRESQL]: 'PostgreSQL',
  [DATASOURCE_TYPE.ORACLE]: 'Oracle',
  [DATASOURCE_TYPE.SQLSERVER]: 'SQLServer',
  [DATASOURCE_TYPE.MONGODB]: 'MongoDB',
  [DATASOURCE_TYPE.DAMENG]: 'DM',
  [DATASOURCE_TYPE.REDIS]: 'Redis',
  [DATASOURCE_TYPE.ELASTICSEARCH]: 'Elasticsearch'
}

export const typesData = [
  {
    title: i18n.global.t('DataSource.Type.100098-0'),
    value: 'common',
    types: [
      {
        icon: DataApi,
        value: DATASOURCE_TYPE.API,
        name: DATASOURCE_NAME[DATASOURCE_TYPE.API],
        formType: DATA_TYPE_ITEM.API_SEND
      },
      {
        icon: DataWebsocket,
        value: DATASOURCE_TYPE.WEBSOCKET,
        name: DATASOURCE_NAME[DATASOURCE_TYPE.WEBSOCKET],
        formType: DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE,
        defaultConfig: {
          handshakeTimeout: 0,
          reconnectionAttempts: 0,
          maxMessageSize: 2,
          reconnectionIntervals: 5000,
          payloadType: 'JSON'
        }
      }
    ]
  },
  {
    title: i18n.global.t('DataSource.Type.100098-1'),
    value: 'database',
    types: [
      {
        icon: DataMysql,
        value: DATASOURCE_TYPE.MYSQL,
        jdbcHeaders: 'r2dbc:mysql://',
        headersEnum: ['r2dbc:mysql://', 'jdbc:mysql://'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.MYSQL],
        placeholderPort: '3306',
        type: 'r2dbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataPostgresql,
        value: DATASOURCE_TYPE.POSTGRESQL,
        jdbcHeaders: 'r2dbc:postgresql://',
        headersEnum: ['r2dbc:postgresql://', 'jdbc:postgresql://'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.POSTGRESQL],
        placeholderPort: '5432',
        type: 'r2dbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataSqlserver,
        value: DATASOURCE_TYPE.SQLSERVER,
        jdbcHeaders: 'jdbc:sqlserver://',
        headersEnum: ['jdbc:sqlserver://'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.SQLSERVER],
        placeholderPort: '1433',
        type: 'jdbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataDm,
        value: DATASOURCE_TYPE.DAMENG,
        jdbcHeaders: 'jdbc:dm://',
        headersEnum: ['jdbc:dm://', 'r2dbc:jdbc:dm://'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.DAMENG],
        placeholderPort: '5236',
        type: 'jdbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataMariadb,
        value: DATASOURCE_TYPE.MARIADB,
        jdbcHeaders: 'r2dbc:mysql://',
        headersEnum: ['r2dbc:mysql://', 'r2dbc:mariadb://'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.MARIADB],
        placeholderPort: '3306',
        type: 'r2dbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataOracle,
        value: DATASOURCE_TYPE.ORACLE,
        jdbcHeaders: 'jdbc:oracle:thin:@//',
        headersEnum: ['jdbc:oracle:thin:@//', 'jdbc:oracle:thin:@', 'jdbc:oracle:thin:user/password@//'],
        name: DATASOURCE_NAME[DATASOURCE_TYPE.ORACLE],
        placeholderPort: '1521',
        type: 'jdbc',
        formType: DATA_TYPE_ITEM.RDB_DATASOURCE
      },
      {
        icon: DataMongodb,
        value: DATASOURCE_TYPE.MONGODB,
        name: DATASOURCE_NAME[DATASOURCE_TYPE.MONGODB],
        formType: DATA_TYPE_ITEM.MONGODB_DATASOURCE
      },
      {
        icon: DataRedis,
        value: DATASOURCE_TYPE.REDIS,
        name: DATASOURCE_NAME[DATASOURCE_TYPE.REDIS],
        formType: DATA_TYPE_ITEM.REDIS_DATASOURCE
      },
      {
        icon: DataEsApi,
        value: DATASOURCE_TYPE.ELASTICSEARCH,
        name: DATASOURCE_NAME[DATASOURCE_TYPE.ELASTICSEARCH],
        formType: DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE
      }
    ]
  }
]

//获取数据源详情
export const getTypesDataDetail = (value: string) => {
  return typesData.flatMap((data: any) => data.types).find((type: any) => type.value === value)
}

/**
 * 解析URL协议部分
 */
const parseProtocol = (url: string, active: any): { protocol: string; restUrl: string } => {
  const headersEnum: string[] = isArray(active?.headersEnum) ? active.headersEnum : []
  // 优先精确匹配
  let header = headersEnum.find((h) => url.startsWith(h))
  if (header) {
    return {
      protocol: header,
      restUrl: url.slice(header.length)
    }
  }

  // 针对 oracle 特殊格式 jdbc:oracle:thin:user/password@//
  if (active.value === DATASOURCE_TYPE.ORACLE) {
    const match = url.match(/^jdbc:oracle:thin:([^@]+)@\/\//)
    if (match) {
      const dynamicHeader = `jdbc:oracle:thin:${match[1]}@//`
      return {
        protocol: dynamicHeader,
        restUrl: url.slice(dynamicHeader.length)
      }
    }
  }

  const protocolEndIndex = url.indexOf('//') + 2
  if (protocolEndIndex > 1) {
    return {
      protocol: url.substring(0, protocolEndIndex),
      restUrl: url.substring(protocolEndIndex)
    }
  }

  return { protocol: '', restUrl: url }
}

/**
 * 解析主机和端口部分
 */
const parseHostAndPort = (connectionString: string): { host: string; port: string } => {
  // 先提取主机端口部分（分号前的部分）
  const hostPortPart = connectionString.split(';')[0]
  const portSeparatorIndex = hostPortPart.lastIndexOf(':')

  if (portSeparatorIndex === -1) {
    return { host: hostPortPart, port: '' }
  }

  const potentialPort = hostPortPart.substring(portSeparatorIndex + 1)

  // 检查是否为有效端口号
  if (/^\d+$/.test(potentialPort)) {
    return {
      host: hostPortPart.substring(0, portSeparatorIndex),
      port: potentialPort
    }
  }

  return { host: hostPortPart, port: '' }
}
/**
 * 解析路径和查询参数
 */
const parsePathAndQuery = (pathPart: string): { path: string; queryParams: { [key: string]: string } } => {
  const queryIndex = pathPart.indexOf('?')

  if (queryIndex === -1) {
    return { path: pathPart, queryParams: {} }
  }

  const path = pathPart.substring(0, queryIndex)
  const queryString = pathPart.substring(queryIndex + 1)

  const queryParams: { [key: string]: string } = {}
  if (queryString) {
    queryString.split('&').forEach((param) => {
      const [key, value] = param.split('=')
      if (key) {
        queryParams[key] = value || ''
      }
    })
  }

  return { path, queryParams }
}

/**
 * 处理特殊数据库URL格式 (;database=)
 */
const handleDatabaseFormat = (url: string): { port: string; path: string } => {
  if (!url.includes(';database=')) {
    return { port: '', path: '' }
  }

  // 解析端口
  const lastColonIndex = url.lastIndexOf(':')
  const semicolonIndex = url.indexOf(';', lastColonIndex)

  let port = ''
  if (lastColonIndex !== -1 && semicolonIndex !== -1 && lastColonIndex < semicolonIndex) {
    port = url.substring(lastColonIndex + 1, semicolonIndex)
  }

  // 解析数据库名
  const databaseStartIndex = url.indexOf(';database=') + ';database='.length
  let databaseEndIndex = url.indexOf(';', databaseStartIndex)
  if (databaseEndIndex === -1) {
    databaseEndIndex = url.length
  }

  const path = url.substring(databaseStartIndex, databaseEndIndex)

  return { port, path }
}

/**
 * 解析URL
 * @param url 要解析的URL字符串
 * @param active 当前选中的数据源类型对象
 */
export const datasourceParseUrl = (url: string, active: any) => {
  // 解析协议
  const { protocol, restUrl } = parseProtocol(url, active)

  // 分离主机端口部分和路径部分
  const pathStartIndex = restUrl.indexOf('/')
  let hostAndPortPart = restUrl
  let pathPart = ''

  if (pathStartIndex !== -1) {
    hostAndPortPart = restUrl.substring(0, pathStartIndex)
    pathPart = restUrl.substring(pathStartIndex)

    // 如果pathPart以/结尾，则去掉/
    if (pathPart.endsWith('/')) {
      pathPart = pathPart.slice(0, -1)
    }

    // 如果pathPart以/开头，则去掉/
    if (pathPart.startsWith('/')) {
      pathPart = pathPart.slice(1)
    }
  }

  // 解析主机和端口
  let { host, port } = parseHostAndPort(hostAndPortPart)

  // 解析路径和查询参数
  let { path, queryParams } = parsePathAndQuery(pathPart)

  // 处理特殊的数据库URL格式
  if (url.includes(';database=')) {
    const specialFormat = handleDatabaseFormat(url)
    port = specialFormat.port
    path = specialFormat.path
  }

  return {
    protocol,
    host,
    port,
    path,
    queryParams
  }
}
