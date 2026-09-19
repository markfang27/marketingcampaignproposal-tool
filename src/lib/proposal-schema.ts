import { z } from "zod";

export const BriefInputSchema = z.object({
  brand: z.string(),
  industry: z.string(),
  product: z.string(),
  audience: z.string(),
  objective: z.string(),
  budget: z.string(),
  duration: z.string(),
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
