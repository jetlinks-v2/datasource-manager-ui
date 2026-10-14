import { isPrivateDeployment } from '@jetlinks-web-core/utils/deployment'
import { CUSTOM_SOURCE_NAMESPACE } from './dataCapabilities/reference'
import { getDataSourceIcon } from './views/DataSource/table'

export default {
  dataCapabilityProviders: isPrivateDeployment() ? {
    savedQueries: {
      capabilityIds: [],
      dynamicSourceNamespace: CUSTOM_SOURCE_NAMESPACE,
      loader: () => import('./dataCapabilities'),
    },
  } : {},
  utils: {
    getDataSourceIcon
  }
}
