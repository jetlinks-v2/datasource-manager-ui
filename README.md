# 数据源管理

运行时数据源管理前端模块，菜单配置入口为 `baseMenu.json` 的 `system/DataSource`。

## 菜单数据权限

菜单使用 `assetTypes` 同时声明 `datasource`（数据源配置）和 `datasource_group`（数据源分类），使两类资产均可配置“自己创建”等数据范围。保留 `assetType: "datasource"`，支持多资产配置的权限解析优先使用 `assetTypes`。

分类查询入口为 `api/data/index.ts#getDataSourceGroup`，调用 `/datasource/config/group/_query/no-paging`，对应资产类型为 `datasource_group`。

菜单配置变更后需同步服务端菜单，并检查、重新保存已有授权中两种资产类型的数据范围；静态配置不会自动迁移服务端已有授权。验收时应使用不同创建人的数据源及分类，确认“自己创建”分别限制两类资产的查询结果。
