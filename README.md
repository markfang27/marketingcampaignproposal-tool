# Pitch Copilot — AI 营销提案工作台

一个面向广告 / 代理公司的 **AI 提案生成工具**：填写客户 Brief，五分钟内自动生成七个完整提案章节（洞察 → 大创意 → 策略 → 内容矩阵 → 排期 → KPI → 竞品分析），支持中英双语、预算分配、一键导出 Word 风格文档 / PPT / 网页幻灯片，并可发布成客户无需登录即可打开的在线提案链接。

> 求职作品 · 应聘 AI 营销解决方案专员

---

## 项目简介

广告公司的提案（Proposal）通常需要 Account Planner 花 1–3 天撰写。Pitch Copilot 把这个过程压缩到 5 分钟：

1. **填写客户 Brief**（品牌、行业、人群、目标、预算、周期、目标城市、竞品）
2. **AI 生成完整提案**——不是简单的文字堆砌，而是结构化的七章节提案书
3. **就地编辑**——客户信息、预算、文案都可以直接改，不需要重新生成
4. **发布 / 导出**——生成客户可打开的在线链接，或导出文档 / PPT / 幻灯片

同时内置 **知识库**（上传行业 / 市场 / 品牌 / 竞品资料，AI 优先采信上传资料而非编造）与 **素材库**（图片 / 视频素材，可直接插入提案的内容矩阵）。

## 功能亮点

### 🧠 AI 提案生成
- 七个章节一次性生成：市场洞察、大创意、策略推导、传播主题与 Slogan、四平台内容矩阵（小红书种草 / 抖音短平快 / B站深度内容 / 微博话题互动）、排期与 KPI、竞品分析
- 按章节流式生成，单章节失败自动重试，顶部横幅支持「一键重试失败章节」，避免 AI 空响应导致白屏
- 竞品分析支持**真实资料检索**（Firecrawl 联网搜索公开资料，AI 基于原文归纳优劣势 / 用户画像 / 差异化定位），并附「资料来源」列表；也可切换为纯 AI 推断
- 中英双语模式：英文提案自动生成，提案书中英文并列，适合跨国客户

### ✏️ 提案页编辑
- 「编辑内容」开关后，标题、洞察、大创意、文案、排期、KPI、竞品、预算分配表均可就地修改
- 预算分配表支持改数字、增删行、自动合计占比
- 每个内容平台可从素材库挑选配图插入

### 📤 三种导出 + 客户发布链接
- **导出提案文档**（HTML，打印即 PDF）
- **下载 PPT**（pptxgenjs 生成的 16:9 模板）
- **网页幻灯片放映**（浏览器内 ← → 翻页）
- **发布给客户**：填入企业 LOGO、联系人、电话、邮箱，生成 `/p/xxxx` 公开链接，客户免登录查看，支持更新发布与取消发布

### 📚 知识库与素材库
- 知识库：按「行业资料 / 市场研究 / 品牌资料 / 竞品资料」分类上传文档（Word / PPT / Excel / PDF / TXT，≤10MB），自动解析摘要，勾选后作为本次提案的参考上下文
- 素材库：图片（JPG/PNG/WEBP/GIF）与视频（MP4/MOV/WebM 等，单个 ≤500MB）上传，可配素材文案
- 客户 Brief 支持直接上传文件自动解析（含 docx 与图片多模态识别）

### 👤 多用户与历史记录
- 邮箱密码登录，每位用户的提案记录、知识库、素材库相互隔离（数据库行级安全）
- 左侧栏保存最近 12 条提案记录，可点开查看、删除；未保存的编辑自动保存

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | TanStack Start v1（SSR + Server Functions）· React 19 · TypeScript |
| 路由 / 数据 | TanStack Router + TanStack Query |
| 样式 | Tailwind CSS v4 |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/openai`)，结构化输出（Zod schema 约束）· Lovable AI Gateway |
| 联网检索 | Firecrawl（竞品品牌公开资料搜索） |
| 后端 | Lovable Cloud（Supabase）：PostgreSQL + 行级安全（RLS）+ Auth（邮箱密码）+ Storage |
| 导出 | pptxgenjs（PPTX）· 自研 HTML 导出 / 幻灯片放映模板 |
| 文件解析 | mammoth（docx）· 多模态模型（图片） |
| 部署 | Lovable 托管，已发布线上版本 |

### 架构要点
- **结构化 AI 输出**：每章节用独立 Zod schema 约束模型输出，失败可按章节粒度重试，不整单报废
- **Server Functions 分层**：客户端安全模块（`*.functions.ts`）与服务端私有模块（`*.server.ts`）分离，密钥只在服务端读取
- **权限模型**：proposals / knowledge_files / media_assets 三表全部启用 RLS，仅允许 `auth.uid()` 访问自己的数据；公开提案页通过 `share_slug` + `published` 状态控制可见性
- **公开配图代理**：私有存储中的提案配图通过 `/api/public/proposal-asset` 鉴权代理输出，不暴露存储地址

## 使用流程

1. **注册 / 登录**（邮箱密码）
2. **填写** 页签：填客户信息，或从示例案例库一键填充，或直接上传 Brief 文件自动解析
3. （可选）**知识库** 页签上传行业 / 品牌资料并勾选；**素材库** 页签上传图片视频
4. 填竞品品牌、总预算，选择语言（中文 / 中英双语）与资料来源（联网检索 / AI 推断）
5. 点击生成 → 约 5 分钟后得到七章节完整提案
6. 「编辑内容」就地修改文案与预算 → 「保存修改」
7. 导出文档 / PPT / 幻灯片，或填入企业信息「发布给客户」拿到分享链接

## 目录结构（核心）

```
src/
├── routes/
│   ├── index.tsx              # 工作台主页面（侧栏记录 + 表单 + 生成流程）
│   ├── auth.tsx               # 登录 / 注册
│   ├── p.$slug.tsx            # 公开提案页（客户免登录访问）
│   └── api/public/            # 公开接口（配图代理等）
├── components/pitch/
│   ├── BriefForm.tsx          # 三页签表单（填写 / 知识库 / 素材库）
│   ├── ProposalView.tsx       # 提案展示 + 就地编辑
│   ├── PublishPanel.tsx       # 发布给客户面板
│   └── Editable.tsx           # contentEditable 就地编辑组件
├── lib/
│   ├── proposal-schema.ts     # Zod schema（Brief / 七章节结构化输出）
│   ├── proposal.functions.ts  # AI 生成服务函数（策略/内容/排期/竞品/翻译）
│   ├── library.functions.ts   # 提案记录 / 知识库 / 素材库 CRUD
│   ├── firecrawl.server.ts    # 联网品牌搜索
│   ├── export-html.ts         # 提案文档导出
│   ├── export-pptx.ts         # PPT 导出
│   └── export-slides-html.ts  # 网页幻灯片
└── integrations/supabase/     # 数据库客户端（自动生成）
```

---

Built with [Lovable](https://lovable.dev)
