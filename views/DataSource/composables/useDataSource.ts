import { randomString, onlyMessage } from '@jetlinks-web/utils'
import {
  addDataSource,
  updateDataSource,
  disableDataSource,
  enableDataSource
} from '@datasource-manager-ui/api/data/datasource'
import { DEFAULT_CATEGORY_ID } from '@datasource-manager-ui/utils/const'
import { DATASOURCE_TYPE, DATA_TYPE_ITEM, datasourceParseUrl } from '../components/table'

export type EmitFn = (event: string, ...args: any[]) => void

// 数据源相关操作
export const useDataSource = (opts: {
  baseFormData: Ref<any>
  formData: Ref<any>
  activeType: Ref<any>
  formType: Ref<string>
  isEditor: Ref<boolean>
  requestFlag: Ref<boolean>
  emit: EmitFn
}) => {
  const { baseFormData, formData, activeType, formType, isEditor, requestFlag, emit } = opts

  const submitDataSource = async (params: any) => {
    const action = isEditor.value ? updateDataSource : addDataSource

    try {
      const res = await action(params)
      if (res?.success) {
        emit('close')
        emit('update')
        onlyMessage(isEditor.value ? '修改成功' : '新增成功')
      }
    } finally {
      Promise.resolve().then(() => {
        requestFlag.value = false
      })
    }
  }

  const universalDataAdd = async () => {
    const buildAuthConfig = (authType: string, data: any) => {
      const { username, password, token: token1, OAuth2 } = data || {}

      const configBuilders: Record<string, () => any> = {
        basic: () => ({
          authType: 'basic',
          basic: { username, password }
        }),
        bearer: () => ({
          authType: 'bearer',
          bearer: { token: token1 }
        }),
        OAuth2: () => ({
          authType: 'OAuth2',
          oauth2: {
            grantType: 'client_credentials',
            clientId: OAuth2?.clientId,
            clientSecret: OAuth2?.clientSecret,
            tokenUrl: OAuth2?.token,
            tokenRequestType: OAuth2?.request,
            scope: OAuth2?.scope || '*'
          }
        }),
        none: () => ({ authType: 'none' })
      }

      return configBuilders[authType]?.() || { authType: 'none' }
    }

    const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
    const { universalData } = formData.value
    const { api, authType, protocol, OAuth2 } = universalData

    const params: any = {
      name,
      typeId: DATA_TYPE_ITEM.API_SEND,
      id: id || `data_source_${randomString(4)}`,
      group,
      shareConfig: {
        baseUrl: protocol + api,
        authConfig: buildAuthConfig(authType, universalData),
        others: {}
      },
      shareCluster: true,
      description,
      searchCode: activeType.value.value
    }

    if (authType === 'OAuth2' && OAuth2) {
      params.shareConfig.headers = [...(OAuth2.headers || [])]
      params.shareConfig.parameters = [...(OAuth2.params || [])]
    }

    await submitDataSource(params)
  }

  const relationDataAdd = async () => {
    const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
    const { relationData } = formData.value
    const { connectionMode, username, password, url, schema, dataBase } = relationData
    const { value: activeValue } = activeType.value

    const type = connectionMode === 'common' ? activeType.value.type : url.substring(0, url.indexOf(':'))

    const params: any = {
      name,
      typeId: DATA_TYPE_ITEM.RDB_DATASOURCE,
      id: id || `data_source_${randomString(4)}`,
      group,
      shareConfig: {
        type,
        username,
        password,
        schema,
        url,
        other: { connectionMode }
      },
      shareCluster: true,
      description,
      searchCode: activeValue
    }

    if (activeValue === DATASOURCE_TYPE.SQLSERVER) {
      params.dataBase = dataBase
    }

    await submitDataSource(params)
  }

  const websocketDataAdd = async () => {
    const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
    const { websocketData } = formData.value
    const { value: activeValue, defaultConfig } = activeType.value

    const params = {
      id: id || `data_source_${randomString(4)}`,
      name,
      typeId: DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE,
      group,
      shareConfig: {
        ...defaultConfig,
        ...Object.fromEntries(
          Object.entries(websocketData).filter(([_, value]) => value !== null && value !== undefined && value !== '')
        )
      },
      shareCluster: true,
      description,
      searchCode: activeValue
    }

    await submitDataSource(params)
  }

  const elasticsearchDataAdd = async () => {
    const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
    const { elasticsearchData } = formData.value
    const { value: activeValue } = activeType.value

    const params = {
      id: id || `data_source_${randomString(4)}`,
      name,
      typeId: DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE,
      group,
      shareConfig: { ...elasticsearchData },
      shareCluster: true,
      description,
      searchCode: activeValue
    }

    await submitDataSource(params)
  }

  const redisDataAdd = async () => {
    const { name, id, group = DEFAULT_CATEGORY_ID, description } = baseFormData.value
    const { redisData } = formData.value
    const { value: activeValue } = activeType.value

    const params = {
      id: id || `data_source_${randomString(4)}`,
      name,
      typeId: DATA_TYPE_ITEM.REDIS_DATASOURCE,
      group,
      shareConfig: { ...redisData },
      shareCluster: true,
      description,
      searchCode: activeValue
    }

    await submitDataSource(params)
  }

  const getDataHandlerByType = (type: string) => {
    const handlerMap: Record<string, Function> = {
      [DATA_TYPE_ITEM.API_SEND]: universalDataAdd,
      [DATA_TYPE_ITEM.RDB_DATASOURCE]: relationDataAdd,
      [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: websocketDataAdd,
      [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: elasticsearchDataAdd,
      [DATA_TYPE_ITEM.REDIS_DATASOURCE]: redisDataAdd
    }
    return handlerMap[type]
  }

  // 解析不同数据源配置（基于当前表单类型与激活类型）
  const parseDataSourceConfig = (searchCode: string, shareConfig: any) => {
    const parsers: Record<string, () => any> = {
      [DATA_TYPE_ITEM.RDB_DATASOURCE]: () => {
        const { other, username, password, url, schema } = shareConfig || {}
        const { protocol, host, port, path } = datasourceParseUrl(url, activeType.value)
        const connectionMode = other?.connectionMode || 'common'
        const isBasic = connectionMode === 'basic'

        return {
          relationData: {
            connectionMode,
            username,
            password,
            jdbcHeaders: protocol,
            schema,
            host: isBasic ? host : '',
            port: isBasic ? port : '',
            jdbcUrl: isBasic ? protocol : url,
            serviceName: isBasic && searchCode === DATASOURCE_TYPE.ORACLE ? path : '',
            url
          }
        }
      },
      [DATA_TYPE_ITEM.API_SEND]: () => {
        const { authConfig = {}, baseUrl: api = '', headers = [], parameters = [] } = shareConfig || {}
        const { protocol } = datasourceParseUrl(api, activeType.value)

        const parseAuthData = () => {
          const baseData: any = { authType: authConfig.authType, api, protocol }
          const basic = authConfig.basic || {}
          const bearer = authConfig.bearer || {}
          const oauth2 = authConfig.oauth2 || {}

          switch (authConfig.authType) {
            case 'basic':
              return { ...baseData, ...basic }
            case 'bearer':
              return { ...baseData, token: bearer.token }
            case 'OAuth2':
              return {
                ...baseData,
                OAuth2: {
                  mode: oauth2.grantType,
                  clientId: oauth2.clientId,
                  clientSecret: oauth2.clientSecret,
                  token: oauth2.tokenUrl,
                  request: oauth2.tokenRequestType,
                  scope: oauth2.scope === '*' ? '' : oauth2.scope,
                  headers,
                  params: parameters
                }
              }
            default:
              return baseData
          }
        }

        return { universalData: parseAuthData() }
      },
      [DATA_TYPE_ITEM.WEBSOCKET_DATASOURCE]: () => {
        const config = shareConfig || {}
        return {
          websocketData: {
            handshakeTimeout: config.handshakeTimeout,
            reconnectionAttempts: config.reconnectionAttempts,
            maxMessageSize: config.maxMessageSize,
            reconnectionIntervals: config.reconnectionIntervals,
            payloadType: config.payloadType
          }
        }
      },
      [DATA_TYPE_ITEM.ELASTICSEARCH_DATASOURCE]: () => {
        const config = shareConfig || {}
        return {
          elasticsearchData: {
            uri: config.uri || '',
            pathPrefix: config.pathPrefix || '',
            username: config.username || '',
            password: config.password || ''
          }
        }
      },
      [DATA_TYPE_ITEM.REDIS_DATASOURCE]: () => {
        const config = shareConfig || {}
        return {
          redisData: {
            host: config.host || '',
            port: config.port || 6379,
            userName: config.userName || '',
            password: config.password || '',
            databaseIndex: config.databaseIndex ?? 0,
            separator: config.separator ?? ':'
          }
        }
      }
    }

    return parsers[formType.value]?.() || {}
  }

  const withDisableDuringEdit = async (fn: () => Promise<void>) => {
    if (!isEditor.value) return fn()
    await disableDataSource(baseFormData.value.id)
    try {
      await fn()
    } finally {
      await enableDataSource(baseFormData.value.id)
    }
  }

  return {
    getDataHandlerByType,
    parseDataSourceConfig,
    withDisableDuringEdit
  }
}
