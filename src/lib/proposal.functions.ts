import { createServerFn } from "@tanstack/react-start";
import { Output, NoObjectGeneratedError, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";
import {
  BriefInputSchema,
  ContentOutputSchema,
  PlanOutputSchema,
  PROPOSAL_STYLES,
  StrategyOutputSchema,
  type BriefInput,
  type ContentResult,
  type PlanResult,
  type StrategyResult,
} from "./proposal-schema";

const MODEL_ID = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `你是资深整合营销策略总监,任职于中国一线广告代理公司,擅长从客户 Brief 推导消费洞察与创意主张,并为新消费品牌操盘整合传播战役。所有输出使用专业、具体的中文,可直接用于向客户提交的提案。要求:
- 洞察要有真实的市场观察感,引用具体的人群行为与场景,避免空话套话;
- Big Idea 必须有一个可记忆、可延展的核心概念;
- 平台内容必须贴合各平台调性:小红书是真诚种草笔记、抖音是强钩子短视频、微信是深度内容、微博是话题互动;
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
    `内容主风格:${PROPOSAL_STYLES[b.style].label}`,
    `风格执行要求:${PROPOSAL_STYLES[b.style].instruction}`,
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
  if (!o || !o.phases?.length || !o.kpis?.length) {
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

请输出提案的第一部分(市场洞察、核心策略与传播主题)。所选风格必须影响洞察切口、创意机制、传播节奏与表达方式，而不只是措辞变化:
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

请输出提案的多平台内容矩阵,覆盖 4 个平台:小红书、抖音、微信(公众号)、微博。所选主风格是整场 campaign 的内容母体：主阵地应获得最鲜明、最完整的表达，其他平台则将同一创意机制转译为各自原生形式。每个平台给出:1 句平台打法定位(30 字以内)+ 3 条具体内容选题,每条含标题和 60 字以内内容要点。内容标题要有平台原生感(如小红书 emoji 标题、抖音钩子开头)。`,
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

请输出提案的执行排期与 KPI 框架。排期动作与指标权重必须体现所选主风格对应平台的内容生产方式和核心行为指标:
1. 执行排期:按投放周期(${data.duration})划分为预热期、引爆期、延续期 3 个阶段,每阶段含名称、覆盖时间(如"第 1-2 周")、阶段目标(30 字以内)、4-6 条具体动作;
2. KPI 框架:按曝光层、互动层、转化层各给 2 条指标,每条含指标名和参考目标值(目标值要匹配预算量级 ${data.budget})。`,
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
