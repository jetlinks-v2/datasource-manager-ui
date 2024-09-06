export default [
    {
        code: 'system',
        name: '系统管理',
        owner: 'iot',
        id: 'fd1670b860ae58cc58bcd01d027ccd35',
        url: '/system',
        icon: 'icon-xitongguanli1',
        sortIndex: 4,
        permissions: [],
        buttons: [],
        children: [
            {
                code: 'system/DataSource',
                name: '数据源管理',
                owner: 'iot',
                //parentId: '3',
                id: 'c62a6bd5018763dae9fc0d869b6df3a2',
                sortIndex: 8,
                url: '/system/DataSource',
                icon: 'icon-shebei',
                showPage: ['datasource-config'],
                permissions: [],
                buttons: [
                    {
                        id: 'manage',
                        name: '管理',
                        permissions: [
                            {
                                permission: 'datasource-config',
                                actions: [
                                    'query',
                                    'del-mongodb-collection',
                                    'save',
                                    'rdb-ddl',
                                    'create-mongodb-collection',
                                ],
                            },
                        ],
                    },
                    {
                        id: 'delete',
                        name: '删除',
                        permissions: [
                            {
                                permission: 'datasource-config',
                                actions: ['query', 'delete'],
                            },
                        ],
                    },
                    {
                        id: 'action',
                        name: '启用/禁用',
                        permissions: [
                            {
                                permission: 'datasource-config',
                                actions: ['query', 'save'],
                            },
                        ],
                    },
                    {
                        id: 'update',
                        name: '编辑',
                        permissions: [
                            {
                                permission: 'datasource-config',
                                actions: [
                                    'query',
                                    'del-mongodb-collection',
                                    'save',
                                    'rdb-ddl',
                                    'create-mongodb-collection',
                                ],
                            },
                        ],
                    },
                    {
                        id: 'add',
                        name: '新增',
                        permissions: [
                            {
                                permission: 'datasource-config',
                                actions: [
                                    'query',
                                    'del-mongodb-collection',
                                    'save',
                                    'rdb-ddl',
                                    'create-mongodb-collection',
                                ],
                            },
                        ],
                    },
                ],
                accessSupport: { text: "支持", value: "support" },
                supportDataAccess: true,
                assetType: 'datasource'
            },
        ]
    }
]
