import type {
  Bilingual,
  BriefInput,
  CompetitorResult,
  CompetitorSource,
  ContentResult,
  PlanResult,
  StrategyResult,
} from "./proposal-schema";

export interface SlideBullet {
  title?: string | undefined;
  body?: string | undefined;
  en?: string | undefined;
}

export interface SlideTable {
  head: string[];
  rows: string[][];
}

export interface Slide {
  kind: "cover" | "section" | "content";
  num?: string | undefined;
  title: string;
  titleEn?: string | undefined;
  subtitle?: string | undefined;
  lead?: string | undefined;
  leadEn?: string | undefined;
  bullets?: SlideBullet[] | undefined;
  table?: SlideTable | undefined;
  columns?: { label: string; value: string }[] | undefined;
}

export interface DeckInput {
  brief: BriefInput;
  strategy: StrategyResult;
  content: ContentResult;
  plan: PlanResult;
  competitors: CompetitorResult;
  sources?: CompetitorSource[];
  translation: Bilingual;
}

/** 把提案内容拆成适合放映的幻灯片序列(每页只放一个论点) */
export function buildDeck({
  brief,
  strategy,
  content,
  plan,
  competitors,
  sources = [],
  translation,
}: DeckInput): Slide[] {
  const bi = brief.language === "en";
  const trS = bi ? translation.strategy : undefined;
  const trC = bi ? translation.content : undefined;
  const trP = bi ? translation.plan : undefined;
  const trK = bi ? translation.competitors : undefined;

  const slides: Slide[] = [];

  // 封面
  slides.push({
    kind: "cover",
    title: `${brief.brand} · 整合传播提案`,
    titleEn: bi ? `${brief.brand} · Integrated Campaign Proposal` : undefined,
    subtitle: `${brief.industry} · 预算 ${brief.budget} · 周期 ${brief.duration}`,
  });

  // 客户信息
  slides.push({
    kind: "content",
    num: "00",
    title: "客户信息",
    titleEn: bi ? "Client Information" : undefined,
    columns: [
      { label: "客户名称", value: brief.clientName || brief.brand },
      { label: "项目预算", value: brief.budget },
      ...(brief.totalBudget
        ? [{ label: "总预算", value: brief.totalBudget }]
        : []),
      { label: "目标城市", value: brief.city || "全国" },
    ],
  });

  // 01 市场洞察
  slides.push({ kind: "section", num: "01", title: "市场洞察", titleEn: bi ? "Market Insight" : undefined });
  slides.push({
    kind: "content",
    num: "01",
    title: "目标人群画像",
    titleEn: bi ? "Audience Profile" : undefined,
    lead: strategy.audienceProfile,
    leadEn: trS?.audienceProfile,
  });
  slides.push({
    kind: "content",
    num: "01",
    title: "消费趋势",
    titleEn: bi ? "Consumer Trends" : undefined,
    bullets: strategy.trends.map((t, i) => ({
      title: t.title,
      body: t.detail,
      en: trS?.trends?.[i]
        ? `${trS.trends[i]!.title} — ${trS.trends[i]!.detail}`
        : undefined,
    })),
  });
  slides.push({
    kind: "content",
    num: "01",
    title: "竞争格局",
    titleEn: bi ? "Competitive Landscape" : undefined,
    bullets: strategy.competition.map((t, i) => ({
      title: t.title,
      body: t.detail,
      en: trS?.competition?.[i]
        ? `${trS.competition[i]!.title} — ${trS.competition[i]!.detail}`
        : undefined,
    })),
  });

  // 02 核心策略
  slides.push({ kind: "section", num: "02", title: "核心策略", titleEn: bi ? "Core Strategy" : undefined });
  slides.push({
    kind: "content",
    num: "02",
    title: "Key Insight",
    lead: strategy.keyInsight,
    leadEn: trS?.keyInsight,
  });
  slides.push({
    kind: "content",
    num: "02",
    title: `Big Idea:${strategy.bigIdeaTitle}`,
    titleEn: trS?.bigIdeaTitle,
    lead: strategy.bigIdeaDescription,
    leadEn: trS?.bigIdeaDescription,
  });
  slides.push({
    kind: "content",
    num: "02",
    title: "策略推导逻辑",
    titleEn: bi ? "Strategic Rationale" : undefined,
    lead: strategy.strategyLogic,
    leadEn: trS?.strategyLogic,
  });

  // 03 传播主题
  slides.push({ kind: "section", num: "03", title: "传播主题", titleEn: bi ? "Campaign Theme" : undefined });
  slides.push({
    kind: "content",
    num: "03",
    title: strategy.campaignTheme,
    titleEn: trS?.campaignTheme,
    bullets: strategy.slogans.map((s, i) => ({
      title: s,
      en: trS?.slogans?.[i],
    })),
  });

  // 04 内容矩阵:每平台一页
  slides.push({ kind: "section", num: "04", title: "内容矩阵", titleEn: bi ? "Content Matrix" : undefined });
  content.platforms.forEach((p, pi) => {
    const tp = trC?.platforms?.[pi];
    slides.push({
      kind: "content",
      num: "04",
      title: p.platform,
      titleEn: tp?.platform,
      lead: p.positioning,
      leadEn: tp?.positioning,
      bullets: p.items.map((it, i) => ({
        title: it.title,
        body: it.body,
        en: tp?.items?.[i]
          ? `${tp.items[i]!.title} — ${tp.items[i]!.body}`
          : undefined,
      })),
    });
  });

  // 05 执行排期:每阶段一页 + 预算分配
  slides.push({ kind: "section", num: "05", title: "执行排期", titleEn: bi ? "Execution Timeline" : undefined });
  plan.phases.forEach((ph, i) => {
    const tph = trP?.phases?.[i];
    slides.push({
      kind: "content",
      num: "05",
      title: `${ph.name}(${ph.weeks})`,
      titleEn: tph ? `${tph.name} (${tph.weeks})` : undefined,
      lead: ph.goal,
      leadEn: tph?.goal,
      bullets: ph.actions.map((a, ai) => ({ title: a, en: tph?.actions?.[ai] })),
    });
  });
  slides.push({
    kind: "content",
    num: "05",
    title: "预算分配",
    titleEn: bi ? "Budget Allocation" : undefined,
    table: {
      head: ["项目", "占比", "金额", "分配理由"],
      rows: plan.budgetAllocation.map((b) => [
        b.item,
        b.percent,
        b.amount,
        b.rationale,
      ]),
    },
  });

  // 06 KPI
  slides.push({ kind: "section", num: "06", title: "KPI 框架", titleEn: bi ? "KPI Framework" : undefined });
  slides.push({
    kind: "content",
    num: "06",
    title: "衡量指标",
    titleEn: bi ? "Measurement" : undefined,
    table: {
      head: ["层级", "指标", "目标值"],
      rows: plan.kpis.map((k) => [k.layer, k.metric, k.target]),
    },
  });

  // 07 竞品分析:每竞品一页 + 差异化定位
  slides.push({ kind: "section", num: "07", title: "竞品分析", titleEn: bi ? "Competitive Analysis" : undefined });
  competitors.competitors.forEach((c, i) => {
    const tc = trK?.competitors?.[i];
    slides.push({
      kind: "content",
      num: "07",
      title: c.name,
      titleEn: tc?.name,
      lead: c.persona,
      leadEn: tc?.persona,
      bullets: [
        ...c.strengths.map((s, si) => ({
          title: "优势",
          body: s,
          en: tc?.strengths?.[si],
        })),
        ...c.weaknesses.map((w, wi) => ({
          title: "劣势",
          body: w,
          en: tc?.weaknesses?.[wi],
        })),
      ],
    });
  });
  slides.push({
    kind: "content",
    num: "07",
    title: "我方差异化定位",
    titleEn: bi ? "Our Differentiation" : undefined,
    lead: competitors.differentiation,
    leadEn: trK?.differentiation,
  });

  if (sources.length) {
    slides.push({
      kind: "bullets",
      eyebrow: "07",
      title: "资料来源",
      titleEn: "Sources",
      bullets: sources.map((s) => ({
        label: s.brand,
        text: `${s.title || s.url} — ${s.url}`,
      })),
    });
  }



  // 结尾
  slides.push({
    kind: "cover",
    title: "Thank You",
    subtitle: `${brief.clientName || brief.brand} · ${brief.brand} 整合传播提案`,
  });

  return slides;
}

export function deckFileName(brief: BriefInput) {
  return `${brief.brand}-整合传播提案`;
}
