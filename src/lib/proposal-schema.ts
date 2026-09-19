import { z } from "zod";

export const PROPOSAL_STYLE_KEYS = ["xiaohongshu", "douyin", "bilibili"] as const;

export type ProposalStyle = (typeof PROPOSAL_STYLE_KEYS)[number];

export const PROPOSAL_STYLES: Record<
  ProposalStyle,
  { label: string; shortLabel: string; description: string; instruction: string }
> = {
  xiaohongshu: {
    label: "小红书种草风",
    shortLabel: "小红书",
    description: "真实体验 · 生活场景 · 口碑表达",
    instruction:
      "以小红书种草逻辑统领整份提案：从真实生活场景和细微痛点切入，强调亲历感、可分享的体验与可信口碑；语言自然、有画面感，避免硬广腔。内容和节奏优先适配收藏、评论与搜索种草。",
  },
  douyin: {
    label: "抖音短平快风",
    shortLabel: "抖音",
    description: "强力钩子 · 快节奏 · 行动引导",
    instruction:
      "以抖音短视频传播逻辑统领整份提案：前三秒给出冲突或利益钩子，信息短、密、快，强化可视化动作、反差和记忆点，并设置明确行动引导。内容和节奏优先适配完播、互动与即时转化。",
  },
  bilibili: {
    label: "B站深度内容风",
    shortLabel: "B站",
    description: "知识密度 · 完整论证 · 系列内容",
    instruction:
      "以 B站深度内容逻辑统领整份提案：提供可信背景、完整论证与有用知识，允许适度展开但保持结构清晰；突出创作者视角、系列化栏目和社区讨论价值。内容和节奏优先适配长时观看、投币收藏与深度认同。",
  },
};

export const BriefInputSchema = z.object({
  brand: z.string(),
  industry: z.string(),
  product: z.string(),
  audience: z.string(),
  objective: z.string(),
  budget: z.string(),
  duration: z.string(),
  style: z.enum(PROPOSAL_STYLE_KEYS),
});

export type BriefInput = z.infer<typeof BriefInputSchema>;

// Group A: 市场洞察 + 核心策略 + 传播主题
export const StrategyOutputSchema = z.object({
  audienceProfile: z.string(),
  trends: z.array(z.object({ title: z.string(), detail: z.string() })),
  competition: z.array(z.object({ title: z.string(), detail: z.string() })),
  keyInsight: z.string(),
  bigIdeaTitle: z.string(),
  bigIdeaDescription: z.string(),
  strategyLogic: z.string(),
  campaignTheme: z.string(),
  slogans: z.array(z.string()),
});

export type StrategyResult = z.infer<typeof StrategyOutputSchema>;

// Group B: 多平台内容矩阵
export const ContentOutputSchema = z.object({
  platforms: z.array(
    z.object({
      platform: z.string(),
      positioning: z.string(),
      items: z.array(z.object({ title: z.string(), body: z.string() })),
    }),
  ),
});

export type ContentResult = z.infer<typeof ContentOutputSchema>;

// Group C: 执行排期 + KPI 框架
export const PlanOutputSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string(),
      weeks: z.string(),
      goal: z.string(),
      actions: z.array(z.string()),
    }),
  ),
  kpis: z.array(
    z.object({
      layer: z.string(),
      metric: z.string(),
      target: z.string(),
    }),
  ),
});

export type PlanResult = z.infer<typeof PlanOutputSchema>;

export type GroupName = "strategy" | "content" | "plan";

export type GroupStatus = "loading" | "done" | "error";

export const SECTIONS = [
  { id: "insight", num: "01", title: "市场洞察", group: "strategy" },
  { id: "core", num: "02", title: "核心策略", group: "strategy" },
  { id: "theme", num: "03", title: "传播主题", group: "strategy" },
  { id: "matrix", num: "04", title: "内容矩阵", group: "content" },
  { id: "schedule", num: "05", title: "执行排期", group: "plan" },
  { id: "kpi", num: "06", title: "KPI 框架", group: "plan" },
] as const;
