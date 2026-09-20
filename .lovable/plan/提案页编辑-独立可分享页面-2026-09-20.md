# 提案页编辑 + 独立可分享页面

## 一、提案页编辑功能

在提案页顶部加一个「编辑内容」开关。打开后，提案里的文字变成可直接点击修改的状态，改完点「保存修改」即写回这条提案记录，不需要重新生成。

可编辑的范围：
- 文字：标题、洞察、大创意、策略推导、传播主题与 slogan、内容矩阵每条文案、排期阶段与关键动作、KPI、竞品优劣势与差异化定位。
- 预算：预算分配表格的项目、占比、金额、说明都能改，也能新增/删除一行；页面顶部同步显示合计占比，方便检查是否 100%。
- 图片：内容矩阵每个平台可以从素材库挑一张图片插入（也可删除），让提案更像成稿。

交互细节：
- 编辑态下每个可改的文字块显示浅色底，点进去就地输入，失焦即记入草稿。
- 有未保存修改时，顶部显示「有未保存的修改」并提供「保存修改 / 放弃修改」。
- 英文对照行、资料来源等 AI 生成的辅助内容保持只读，避免中英不一致。
- 导出文档 / PPT / 幻灯片都使用编辑后的内容。

## 二、可独立发布的提案页面

新增一个「发布给客户」面板：
- 填写企业信息：企业名称、LOGO（上传图片）、联系人、电话、邮箱、公司网址/微信，一句结尾致谢语。
- 点「发布」生成一个独立链接（形如 `/p/xxxxxx`），可复制发给客户。客户打开无需登录，看到的是一份干净的提案页：顶部企业 LOGO + 客户信息，正文与提案一致，页尾是联系方式卡片，可直接打印成 PDF。
- 可以「更新发布内容」（把最新编辑同步到已发布页面）或「取消发布」（链接立即失效）。
- 未发布 / 已取消的提案，链接访问显示「该提案链接已失效」。

## 三、技术说明

数据库（新迁移）：
- `proposals` 增加 `share_slug text unique`、`published boolean default false`、`branding jsonb default '{}'`、`updated_at timestamptz`。
- 新增只读策略：`anon` 与 `authenticated` 可 `select` `published = true` 的行；配套 `GRANT SELECT ON public.proposals TO anon`。
- 新建公开 bucket `brand-logos`，写入限本人目录，读取公开。

服务端（`src/lib/library.functions.ts`）：
- `saveProposal` 改为支持 `id` 的 upsert，前端保存编辑时更新同一行而不是新插一条。
- 新增 `publishProposal`（生成/复用 slug、写 branding、置 published）、`unpublishProposal`。
- 新增公开读取：`src/lib/public-proposal.functions.ts` 的 `getPublicProposal`（不带 auth 中间件，用 publishable key 客户端按 slug 读已发布行）。

前端：
- 新增 `src/routes/p.$slug.tsx` 公开路由（自带 head 标题/描述），渲染只读版提案 + LOGO + 联系方式。
- 提案渲染抽成共享组件，编辑态与公开页复用同一套结构：`ProposalView` 负责编辑/导出工具条，`ProposalBody` 负责内容，`Editable` 负责就地编辑。
- `src/routes/index.tsx` 维护 `proposalId`、编辑草稿状态与 dirty 标记；导出与 PPT 使用草稿数据。
- 编辑写入用不可变更新（按 section + index 路径），类型仍走现有 `StrategyResult` 等接口。
