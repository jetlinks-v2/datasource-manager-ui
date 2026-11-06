# 数据源管理

运行时数据源管理前端模块，菜单配置入口为 `baseMenu.json` 的 `system/DataSource`。

## 数据源列表布局

左侧搜索参考设备管理 `runtime-ui/modules/device-manager-ui/views/device/list/components/IotDeviceScopeSidebar.vue`：使用带前置搜索图标、可清空的简单输入框，按分类名称即时过滤侧栏树并保留匹配路径；只有点击分类才切换右侧数据范围。清空搜索恢复完整树并保留选中分类；右侧列表使用公共 `ConditionFilter`。

`/system/ps/data-sources` 参考角色管理页 `runtime-ui/modules/authentication-manager-ui/views/system/Role/`，使用等高左右分栏：左侧分类标题、常驻搜索、全部/分类树、底部新增分类；右侧为同一行的条件筛选与新增入口，以及数据源表格。侧栏宽度为 `18.75rem`，支持收起，长名称省略；窄窗口由表格内部横向滚动承载业务列，操作列固定在右侧。

实现归属 `runtime-ui/modules/datasource-manager-ui`：

- `views/DataSource/index.vue`：单层透明 `FullPage` 与 `EqualHeightColumns`，组织分类和列表。
- `views/DataSource/components/DataSourceCategorySidebar.vue`：分类浏览与编辑弹窗；分类仍使用平级数据，树根“全部”用于浏览全部数据源。
- `views/DataSource/DataSourceList.vue`、`table.ts`：使用 `ConditionFilter`、`TableActions` 和 `CloudEmpty`；编辑、命令配置直接展示，删除置于更多菜单并保留确认提示。
- `views/DataSource/composables/useDataSourceCategories.ts`、`useDataSourceList.ts`、`types.ts`：管理分类请求、完整分类缓存、筛选、分页、弹窗与生命周期。左侧复用 `filterTreeNodes` 过滤新派生的树节点，不修改完整分类缓存；分类切换同步清空右侧可见筛选和查询条件；删除成功只触发一次列表刷新；分类旧刷新请求不能覆盖新响应。
- `locales/lang/zh.json`、`en.json`、`ja.json`：同步分类标题、编辑、失败重试及空态文案。

原数据源接口、权限标识、分类默认项保护、详情导航与连接配置流程保持原契约。分类侧栏使用本模块组件，是因为现有 `CategorySelect` 不提供本布局所需的自定义头尾插槽，`TagManagerSidebar` 则依赖分类与标签两级模型。

验证结果：

- `node --test tests/dataSourcePage.test.mjs`：9 项通过，覆盖分类并发刷新、简单搜索保留选中项/缓存/匹配路径、清空与空结果、重名校验、保存失败重试、默认项保护、组合筛选与分页、错误重试、操作权限、删除刷新与弹窗生命周期。
- Vue 脚本/模板与 Less 定向编译、国际化 JSON 解析、`git diff --check` 通过。当前运行时工作区没有独立 lint 或 `check:ui-style` 脚本。
- 在 `runtime-ui/` 执行 `pnpm -F jetlinks-web-core build -- --module-name datasource-manager-ui`：通过，仍有既有输出选项、共享样式及大文件分包警告。
- 在 `runtime-ui/` 执行 `pnpm exec vue-tsc --noEmit --pretty false -p modules/datasource-manager-ui/tsconfig.json`：未通过；修改前后均为相同的 221 条既有诊断，本次无新增诊断。
- 浏览器使用真实页面、共享组件和连接表单配合模拟接口验证：分类搜索/切换、名称筛选、分页、侧栏收起/展开、分类弹窗校验、行删除确认取消、数据源新增/编辑弹窗及分类回填均正常。1440px 桌面宽度无需横向滚动；900px 窗口页面无横向溢出，表格内部滚动且新增按钮保持可见；控制台无错误。
- 简单搜索浏览器复验：输入“历史”后仅左侧保留“全部 → 历史归档”，右侧仍为 18 条；点击“历史归档”后为 10 条；无匹配关键词显示搜索空态，清空恢复完整树且仍选中“历史归档”。
- 尚未连接真实后端验收实际增删改、连接测试和权限数据范围。可在仓库根目录执行 `pnpm -C runtime-ui dev`，登录后进入上述路由复验；本次浏览器验证未修改真实业务数据。

## 菜单数据权限

菜单使用 `assetTypes` 同时声明 `datasource`（数据源配置）和 `datasource_group`（数据源分类），使两类资产均可配置“自己创建”等数据范围。保留 `assetType: "datasource"`，支持多资产配置的权限解析优先使用 `assetTypes`。

分类查询入口为 `api/data/index.ts#getDataSourceGroup`，调用 `/datasource/config/group/_query/no-paging`，对应资产类型为 `datasource_group`。

菜单配置变更后需同步服务端菜单，并检查、重新保存已有授权中两种资产类型的数据范围；静态配置不会自动迁移服务端已有授权。验收时应使用不同创建人的数据源及分类，确认“自己创建”分别限制两类资产的查询结果。
