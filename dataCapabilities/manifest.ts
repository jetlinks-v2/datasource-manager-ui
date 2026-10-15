import type { DataCapabilityProviderManifest } from '@jetlinks-web-core/data-capability'
import { isPrivateDeployment } from '@jetlinks-web-core/utils/deployment'
import { CUSTOM_SOURCE_NAMESPACE } from './reference'

/** 平台和独立消费端共用注册条件；Provider 仍在实际访问能力时加载。 */
export default (isPrivateDeployment() ? {
  savedQueries: {
    capabilityIds: [],
    dynamicSourceNamespace: CUSTOM_SOURCE_NAMESPACE,
    loader: () => import('./index'),
  },
} : {}) satisfies DataCapabilityProviderManifest
