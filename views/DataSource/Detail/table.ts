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
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 100,
    scopedSlots: true,
  },
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    ellipsis: true
  },
  {
    title: '注释',
    dataIndex: 'comment',
    key: 'comment',
    ellipsis: true
  },
  {
    title: '字段类型',
    dataIndex: 'type',
    key: 'type',
    width: 180,
  },
  {
    title: '长度',
    dataIndex: 'length',
    key: 'length',
    width: 120,
  },
  {
    title: '精度',
    dataIndex: 'scale',
    key: 'scale',
    width: 120,
  },
  {
    title: '是否为空',
    dataIndex: 'notnull',
    key: 'notnull',
    width: 100,
    scopedSlots: true,
    align: 'center'
  }
]