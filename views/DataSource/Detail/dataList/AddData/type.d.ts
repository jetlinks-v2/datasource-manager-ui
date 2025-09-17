export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
export type ParamType = 'fixed' | 'dynamic'
export type DatasourceType = 'api' | 'rdb'

interface ParamsSpec {
  id: string
  name: string
  dataType: {
    maxLength?: number
    type: string
  }
  paramType: ParamType
  defaultValue?: any
  required?: boolean
  enable?: boolean
  sort?: number
  isSpecialRow?: boolean
}