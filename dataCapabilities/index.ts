import i18n from '@jetlinks-web-core/locales'
import { getDataCapabilityRequest } from '@jetlinks-web-core/data-capability'
import { isPrivateDeployment } from '@jetlinks-web-core/utils/deployment'
import { createCustomSourceProvider } from './provider'

export default createCustomSourceProvider({
  request: getDataCapabilityRequest,
  enabled: isPrivateDeployment,
  translate: key => String(i18n.global.t(key)),
})
