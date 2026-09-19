import { z } from "zod";

export const BriefInputSchema = z.object({
  brand: z.string(),
  clientName: z.string().default(""),
  city: z.string().default(""),
  industry: z.string(),
  product: z.string(),
  audience: z.string(),
  objective: z.string(),
  budget: z.string(),
  duration: z.string(),
  competitors: z.string().default(""),
  totalBudget: z.string().default(""),
  language: z.enum(["zh", "en"]).default("zh"),
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

// Group C: 执行排期 + KPI 框架 + 预算分配
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
  budgetAllocation: z.array(
    z.object({
      item: z.string(),
      percent: z.string(),
      amount: z.string(),
      rationale: z.string(),
    }),
  ),
});

export type PlanResult = z.infer<typeof PlanOutputSchema>;

// Group D: 竞品分析
export const CompetitorOutputSchema = z.object({
  competitors: z.array(
    z.object({
      name: z.string(),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
      persona: z.string(),
    }),
  ),
  differentiation: z.string(),
});

export type CompetitorResult = z.infer<typeof CompetitorOutputSchema>;

// 中英双语:各章节的英文译文,结构与中文结果一一对应
export type TranslatableKind = "strategy" | "content" | "plan" | "competitors";

export interface Bilingual {
  strategy?: StrategyResult;
  content?: ContentResult;
  plan?: PlanResult;
  competitors?: CompetitorResult;
}

export type GroupName =
  | "strategy"
  | "content"
  | "plan"
  | "competitors"
  | "translation";

export type GroupStatus = "loading" | "done" | "error";

export const SECTIONS = [
  { id: "insight", num: "01", title: "市场洞察", group: "strategy" },
  { id: "core", num: "02", title: "核心策略", group: "strategy" },
  { id: "theme", num: "03", title: "传播主题", group: "strategy" },
  { id: "matrix", num: "04", title: "内容矩阵", group: "content" },
  { id: "schedule", num: "05", title: "执行排期", group: "plan" },
  { id: "kpi", num: "06", title: "KPI 框架", group: "plan" },
  { id: "competitor", num: "07", title: "竞品分析", group: "competitors" },
] as const;
