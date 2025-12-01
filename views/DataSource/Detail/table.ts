import i18n from '@/locales'

export const fieldColumns = [
  {
    dataIndex: 'primaryKey',
    key: 'primaryKey',
    width: 40,
    scopedSlots: true,
    fixed: 'center',
    align: 'center'
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-0'),
    dataIndex: 'index',
    key: 'index',
    width: 100,
    scopedSlots: true
  },
  {
    title: i18n.global.t('DataSource.table.100003-0'),
    dataIndex: 'name',
    key: 'name',
    ellipsis: true
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-1'),
    dataIndex: 'comment',
    key: 'comment',
    ellipsis: true
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-2'),
    dataIndex: 'type',
    key: 'type',
    width: 180
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-3'),
    dataIndex: 'length',
    key: 'length',
    width: 120
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-4'),
    dataIndex: 'scale',
    key: 'scale',
    width: 120
  },
  {
    title: i18n.global.t('DataSource.Detail.table.100009-5'),
    dataIndex: 'notnull',
    key: 'notnull',
    width: 100,
    scopedSlots: true,
    align: 'center'
  }
]
