import i18n from '@jetlinks-web-core/locales'
import { registerDocumentHelpPoints } from '@jetlinks-web-core/utils/documentHelpRegistry'

export function registerDataSourceHelpPoints() {
  registerDocumentHelpPoints([
    ['connection.mode', 'connectionMode', 'connection'],
    ['connection.apiAuth', 'apiAuth', 'connection'],
    ['command.support', 'commandSupport', 'commands'],
    ['command.parameters', 'commandParameters', 'commands'],
  ].map(([key, name, location]) => ({
    code: 'system/DataSource', key,
    name: () => i18n.global.t(`DataSourceDocumentHelp.${name}`),
    page: () => i18n.global.t('DataSource.index.100001-0'),
    location: () => i18n.global.t(`DataSourceDocumentHelp.${location}`),
  })))
}
