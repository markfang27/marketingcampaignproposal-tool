import { createServerFn } from "@tanstack/react-start";
import { Output, NoObjectGeneratedError, streamText } from "ai";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";
import { webSearch } from "./firecrawl.server";
import {
  BriefInputSchema,
  CompetitorOutputSchema,
  ContentOutputSchema,
  PlanOutputSchema,
  StrategyOutputSchema,
  type BriefInput,
  type CompetitorResult,
  type CompetitorSource,
  type ContentResult,
  type PlanResult,
  type StrategyResult,
  type TranslatableKind,
} from "./proposal-schema";

const MODEL_ID = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `你是资深整合营销策略总监,任职于中国一线广告代理公司,擅长从客户 Brief 推导消费洞察与创意主张,并为新消费品牌操盘整合传播战役。所有输出使用专业、具体的中文,可直接用于向客户提交的提案。要求:
- 洞察要有真实的市场观察感,引用具体的人群行为与场景,避免空话套话;
- Big Idea 必须有一个可记忆、可延展的核心概念;
- 平台内容必须贴合各平台调性:小红书是真诚种草笔记、抖音是强钩子短平快视频、B站是有知识密度的深度内容、微博是话题互动;
- 数字与建议要匹配 Brief 给出的预算量级与投放周期,不要夸大。`;

function buildModel() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI 服务未配置,请联系管理员");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key, // satisfies the SDK; the gateway authenticates on the header below
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return lovable.responses(MODEL_ID);
}

function briefPrompt(b: BriefInput) {
  return [
    "以下是客户 Brief:",
    `品牌名称:${b.brand}`,
    `所属行业:${b.industry}`,
    `产品/服务简介:${b.product}`,
    `目标人群:${b.audience}`,
    `营销诉求:${b.objective}`,
    `预算量级:${b.budget}`,
    `投放周期:${b.duration}`,
  ].join("\n");
}

const PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

// 空响应守卫:AI 返回内容为空或缺关键字段时抛错,触发上层重试而不是渲染空白
const NON_EMPTY = "AI 返回内容为空,请重试";

function assertStrategy(o: StrategyResult): StrategyResult {
  if (
    !o ||
    !o.audienceProfile?.trim() ||
    !o.keyInsight?.trim() ||
    !o.bigIdeaTitle?.trim() ||
    !o.campaignTheme?.trim() ||
    !o.trends?.length ||
    !o.competition?.length ||
    !o.slogans?.length
  ) {
    throw new Error(NON_EMPTY);
  }
  return o;
}

function assertContent(o: ContentResult): ContentResult {
  if (
    !o ||
    !o.platforms?.length ||
    o.platforms.some((p) => !p.items?.length)
  ) {
    throw new Error(NON_EMPTY);
  }
  return o;
}

function assertPlan(o: PlanResult): PlanResult {
  if (
    !o ||
    !o.phases?.length ||
    !o.kpis?.length ||
    !o.budgetAllocation?.length
  ) {
    throw new Error(NON_EMPTY);
  }
  return o;
}

function assertCompetitors(o: CompetitorResult): CompetitorResult {
  if (
    !o ||
    !o.competitors?.length ||
    o.competitors.some((c) => !c.name?.trim() || !c.strengths?.length || !c.weaknesses?.length) ||
    !o.differentiation?.trim()
  ) {
    throw new Error(NON_EMPTY);
  }
  return o;
}

export const generateStrategy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefInputSchema.parse(input))
  .handler(async ({ data }) => {
    const model = buildModel();
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `${briefPrompt(data)}

请输出提案的第一部分(市场洞察、核心策略与传播主题):
1. 目标人群画像:一段 100 字以内的具体描述;
2. 消费趋势要点:3-5 条,每条含小标题和 40 字以内说明;
3. 竞争格局要点:3-5 条,每条含小标题和 40 字以内说明;
4. Key Insight:一句话,指向人群未被满足的需求或矛盾;
5. Big Idea:名称(8 字以内)+ 100 字以内的创意阐述;
6. 策略推导逻辑:120 字以内,讲清从洞察如何推导出 Big Idea;
7. Campaign 主题:一句话主主题;
8. 备选传播口号:3 个,每个 12 字以内。`,
      output: Output.object({ schema: StrategyOutputSchema }),
      providerOptions: PROVIDER_OPTIONS,
    });
    try {
      return assertStrategy(await result.output);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 返回内容格式异常,请重试本模块");
      }
      throw error;
    }
  });

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefInputSchema.parse(input))
  .handler(async ({ data }) => {
    const model = buildModel();
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `${briefPrompt(data)}

请输出提案的多平台内容矩阵,覆盖 4 个平台:小红书、抖音、B站、微博。同一 Big Idea 必须转译为各平台原生风格:小红书=种草风(真实体验、生活场景、口碑表达),抖音=短平快风(前三秒钩子、快节奏、明确行动引导),B站=深度内容风(知识密度、完整论证、系列化栏目),微博=话题互动风。每个平台给出:1 句平台打法定位(30 字以内)+ 3 条具体内容选题,每条含标题和 60 字以内内容要点。内容标题要有平台原生感(如小红书 emoji 标题、抖音钩子开头、B站栏目化标题)。`,
      output: Output.object({ schema: ContentOutputSchema }),
      providerOptions: PROVIDER_OPTIONS,
    });
    try {
      return assertContent(await result.output);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 返回内容格式异常,请重试本模块");
      }
      throw error;
    }
  });

export const generatePlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefInputSchema.parse(input))
  .handler(async ({ data }) => {
    const model = buildModel();
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `${briefPrompt(data)}

请输出提案的执行排期、预算分配与 KPI 框架。排期动作与指标权重必须体现多平台内容矩阵(小红书种草、抖音短平快、B站深度内容、微博话题)的生产方式和核心行为指标:
1. 执行排期:按投放周期(${data.duration})划分为预热期、引爆期、延续期 3 个阶段,每阶段含名称、覆盖时间(如"第 1-2 周")、阶段目标(30 字以内)、4-6 条具体动作;
2. 预算分配:将总预算${data.totalBudget ? `(人民币 ${data.totalBudget})` : `(参考预算量级 ${data.budget},金额可写"约 XX 万元")`}拆分到内容制作、达人/媒体投放、传播执行(含平台采买与活动落地)三大项,每项含项目名、占比(如 "35%")、金额估算和 30 字以内的分配理由,三项占比合计 100%;
3. KPI 框架:按曝光层、互动层、转化层各给 2 条指标,每条含指标名和参考目标值(目标值要匹配预算量级 ${data.budget})。`,
      output: Output.object({ schema: PlanOutputSchema }),
      providerOptions: PROVIDER_OPTIONS,
    });
    try {
      return assertPlan(await result.output);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 返回内容格式异常,请重试本模块");
      }
      throw error;
    }
  });

export const generateCompetitors = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefInputSchema.parse(input))
  .handler(async ({ data }) => {
    const model = buildModel();
    const target = data.competitors.trim()
      ? `重点分析客户指定的以下竞品:${data.competitors}`
      : "请自行选取该品类中 2-3 个最具代表性、客户提案中最常被拿来对比的竞品品牌";
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `${briefPrompt(data)}

请输出提案的竞品分析模块。${target}。
每个竞品输出:
1. 品牌名;
2. 优势 2-3 条(每条 25 字以内,要具体到产品、渠道或人群资产);
3. 劣势 2-3 条(每条 25 字以内,是可以被我们品牌攻击的薄弱点);
4. 用户画像(60 字以内,描述它吸引的是哪类人、满足什么需求)。
最后输出我方品牌的差异化定位:80 字以内,讲清与上述竞品错位竞争的位置,并承接 Brief 的核心诉求。`,
      output: Output.object({ schema: CompetitorOutputSchema }),
      providerOptions: PROVIDER_OPTIONS,
    });
    try {
      return assertCompetitors(await result.output);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 返回内容格式异常,请重试本模块");
      }
      throw error;
    }
  });

const TRANSLATE_INPUT = z.object({
  kind: z.enum(["strategy", "content", "plan", "competitors"]),
  payload: z.unknown(),
});

const KIND_LABEL: Record<TranslatableKind, string> = {
  strategy: "市场洞察与核心策略",
  content: "多平台内容矩阵",
  plan: "执行排期、预算分配与 KPI",
  competitors: "竞品分析",
};

const OUTPUT_SCHEMAS: Record<
  TranslatableKind,
  typeof StrategyOutputSchema | typeof ContentOutputSchema | typeof PlanOutputSchema | typeof CompetitorOutputSchema
> = {
  strategy: StrategyOutputSchema,
  content: ContentOutputSchema,
  plan: PlanOutputSchema,
  competitors: CompetitorOutputSchema,
};

// 中英双语提案:将已生成的中文章节整段翻译为专业英文,结构不变
export const translateGroup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TRANSLATE_INPUT.parse(input))
  .handler(async ({ data }) => {
    const model = buildModel();
    const result = streamText({
      model,
      system:
        "你是资深广告代理公司的双语提案撰稿人,负责把中文整合传播提案翻译成专业地道的英文,供跨国客户审阅。要求:广告与营销行业惯用英文表达,语体专业简洁;品牌名与产品名保留原文;所有数字、占比、金额保持不变;不增删信息,严格保持原文的结构与条目数量。",
      prompt: `请把以下提案「${KIND_LABEL[data.kind]}」章节的中文内容完整翻译成英文,按相同结构输出。\n\n${JSON.stringify(data.payload)}`,
      // 四种章节 schema 结构已知,已在上方按 kind 确定输出结构
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      output: Output.object({ schema: OUTPUT_SCHEMAS[data.kind] as any }),
      providerOptions: PROVIDER_OPTIONS,
    });
    try {
      return (await result.output) as
        | StrategyResult
        | ContentResult
        | PlanResult
        | CompetitorResult;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 翻译返回格式异常,请重试本模块");
      }
      throw error;
    }
  });

// ---------- 竞品品牌搜索:从公开网页找候选品牌 ----------
const BRAND_QUERY = z.object({ query: z.string(), industry: z.string() });

export const searchBrands = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BRAND_QUERY.parse(input))
  .handler(async ({ data }) => {
    const q = data.query.trim();
    if (!q) return [] as { name: string; note: string; url: string }[];
    const results = await webSearch(
      `${q} ${data.industry} 品牌 竞品 对比`,
      6,
      false,
    );
    return results.map((r) => ({
      name: r.title.replace(/[|｜\-–—].*$/, "").trim().slice(0, 40) || r.url,
      note: r.description.slice(0, 80),
      url: r.url,
    }));
  });

// ---------- 竞品分析:先抓公开资料,再由 AI 基于原文归纳 ----------
function splitBrands(raw: string) {
  return raw
    .split(/[,,、;;\/|\s]+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export const researchCompetitors = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BriefInputSchema.parse(input))
  .handler(async ({ data }) => {
    const brands = splitBrands(data.competitors);
    const queries = brands.length
      ? brands
      : [`${data.industry} ${data.product} 头部品牌 竞品分析`];

    const sources: CompetitorSource[] = [];
    const evidence: string[] = [];

    for (const brand of queries) {
      try {
        const hits = await webSearch(
          brands.length
            ? `${brand} 品牌 产品 用户评价 优势 劣势 ${data.industry}`
            : brand,
          3,
          true,
        );
        hits.forEach((h) => {
          sources.push({ brand, title: h.title, url: h.url });
          evidence.push(
            `【${brand}】来源:${h.title} (${h.url})\n${h.markdown || h.description}`,
          );
        });
      } catch (error) {
        console.error(`[research] ${brand} 检索失败`, error);
      }
    }

    if (!evidence.length) {
      throw new Error("未检索到公开资料,请改用 AI 推断或稍后重试");
    }

    const model = buildModel();
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: `${briefPrompt(data)}

以下是从公开网页检索到的竞品资料原文(可能含噪音,请只采信与品牌、产品、渠道、用户评价相关的事实):

${evidence.join("\n\n---\n\n").slice(0, 24000)}

请严格基于上述公开资料撰写竞品分析,不要编造资料中没有的事实;资料没覆盖的判断可以做行业常识性推断,但要保守。
${
  brands.length
    ? `重点分析这些竞品:${brands.join("、")}。`
    : "从资料中选出 2-3 个最具代表性的竞品品牌。"
}
每个竞品输出:
1. 品牌名;
2. 优势 2-3 条(每条 25 字以内,尽量引用资料中的具体产品、渠道或口碑事实);
3. 劣势 2-3 条(每条 25 字以内,是我们可攻击的薄弱点);
4. 用户画像(60 字以内)。
最后输出我方品牌的差异化定位:80 字以内,承接 Brief 的核心诉求。`,
      output: Output.object({ schema: CompetitorOutputSchema }),
      providerOptions: PROVIDER_OPTIONS,
    });

    try {
      return { data: assertCompetitors(await result.output), sources };
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("AI 返回内容格式异常,请重试本模块");
      }
      throw error;
    }
  });
