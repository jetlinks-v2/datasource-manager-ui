# 可视化自定义查询 Provider

`dataCapabilities/manifest.ts` 是平台 `register.ts` 与独立播放器共用的公开清单，`index.ts` 仍导出实际 Provider。清单仅在私有化构建中注册 `datasource.saved-query` 动态命名空间。SaaS / cloud 不装配 Provider，也不读取连接目录。

`discover` 分页读取连接及其保存查询，再按 support 获取命令元数据；同一查询的多个命令分别展示。单个查询元数据加载失败返回部分目录诊断，不影响其他查询。`resolve` 直接读取保存查询、所属连接详情及命令，不读取连接管理列表，适用于已保存组件直接进入预览 / 发布页。连接不存在或所属关系不匹配时不恢复，停用连接仍展示不可用原因并禁止执行。

所有读取与执行通过传入的 `CapabilityContext.request`；不缓存远程定义或用户身份。稳定 ID 使用 UTF-8 hex 编码 `[queryId, commandId]`，不包含查询名称、连接配置、SQL 或凭据。

目录平铺“功能列表”中的每个可执行功能，标题使用命令的本地化名称 / 名称，缺省时使用命令 ID；说明优先使用命令说明，缺省时使用所属保存查询的说明。名称不拼接连接名或功能组名。不同命令仍使用各自的稳定 ID，连接名与功能组名保存在 facets 的 `connectionName` / `queryName` 中，供悬浮提示和搜索识别来源。

参数 / 输出通过 `schema.ts` 递归转换。查询参数只使用明确声明的默认值，不为未设置的可选对象或数组自动补空值。声明 `isTermsQuery` 且 `formComponent` 为根级 `query` 的命令将元数据中的字段转换为 `querySchema.queryEditor`；普通 API 的同名参数不会被当成条件协议，返回字段也不会自动成为可查询字段。RDB / Elasticsearch 的 `QueryList` 输出元数据为单行时补上数组，`QueryPager` 按声明的分页契约提取 `data`，保留总数。已保存 API 命令在后端返回响应体，不再猜测或剥离用户的 `body` / `result` 字段。

自动预览与轮询仅接受明确 `forQuery` 且非动作 / 无限订阅的命令，以及已知 RDB / Elasticsearch 只读查询和 GET / HEAD API 查询。其他命令显示不可用原因。WebSocket 实时订阅 / 断线重连不在此契约内。元数据、查询详情和执行权限由服务端检查；运行时不会用普通登录身份替代发布身份。

回归入口：`pnpm test:data-capabilities`。测试加载真实 Provider / Schema / service，仅替换 HTTP 传输；覆盖稳定引用、私有环境装配、分页目录、只读白名单、连接状态、调用者身份及错误响应。
