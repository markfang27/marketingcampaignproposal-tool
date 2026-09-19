import type {
  Bilingual,
  BriefInput,
  CompetitorResult,
  CompetitorSource,
  ContentResult,
  PlanResult,
  StrategyResult,
} from "@/lib/proposal-schema";

// Builds a standalone, print-ready HTML proposal document.

const esc = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function buildExportHtml({
  brief,
  strategy,
  content,
  plan,
  competitors,
  sources = [],
  translation,
}: {
  brief: BriefInput;
  strategy: StrategyResult;
  content: ContentResult;
  plan: PlanResult;
  competitors: CompetitorResult;
  sources?: CompetitorSource[];
  translation: Bilingual;
}): string {
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const bilingual = brief.language === "en";
  const enS = translation.strategy;
  const enC = translation.content;
  const enP = translation.plan;
  const enK = translation.competitors;

  // 双语对照的英文行;非双语提案返回空串
  const en = (text: string | undefined) =>
    bilingual && text ? `<p class="en">${esc(text)}</p>` : "";

  const trendList = strategy.trends
    .map(
      (t, i) =>
        `<li><strong>${esc(t.title)}</strong>${en(enS?.trends?.[i]?.title)}<span>${esc(t.detail)}</span>${en(enS?.trends?.[i]?.detail)}</li>`,
    )
    .join("");
  const compList = strategy.competition
    .map(
      (c, i) =>
        `<li><strong>${esc(c.title)}</strong>${en(enS?.competition?.[i]?.title)}<span>${esc(c.detail)}</span>${en(enS?.competition?.[i]?.detail)}</li>`,
    )
    .join("");
  const slogans = strategy.slogans
    .map(
      (s, i) =>
        `<li><span class="idx">${i + 1}</span><div>${esc(s)}${en(enS?.slogans?.[i])}</div></li>`,
    )
    .join("");
  const platforms = content.platforms
    .map(
      (p, pi) => `
      <div class="platform">
        <h3>${esc(p.platform)}</h3>
        <p class="pos">${esc(p.positioning)}${en(enC?.platforms?.[pi]?.positioning)}</p>
        ${p.items
          .map(
            (it, ii) =>
              `<div class="item"><h4>${esc(it.title)}</h4>${en(enC?.platforms?.[pi]?.items?.[ii]?.title)}<p>${esc(it.body)}</p>${en(enC?.platforms?.[pi]?.items?.[ii]?.body)}</div>`,
          )
          .join("")}
      </div>`,
    )
    .join("");
  const phases = plan.phases
    .map(
      (ph, i) => `
      <tr>
        <td class="phase">${esc(ph.name)}${en(enP?.phases?.[i]?.name)}<span>${esc(ph.weeks)}</span></td>
        <td>${esc(ph.goal)}${en(enP?.phases?.[i]?.goal)}</td>
        <td><ul>${ph.actions
          .map((a, ai) => `<li>${esc(a)}${en(enP?.phases?.[i]?.actions?.[ai])}</li>`)
          .join("")}</ul></td>
      </tr>`,
    )
    .join("");
  const budgetRows = plan.budgetAllocation
    .map(
      (b, i) =>
        `<tr><td><strong>${esc(b.item)}</strong>${en(enP?.budgetAllocation?.[i]?.item)}</td><td>${esc(b.percent)}</td><td>${esc(b.amount)}</td><td>${esc(b.rationale)}${en(enP?.budgetAllocation?.[i]?.rationale)}</td></tr>`,
    )
    .join("");
  const kpis = plan.kpis
    .map(
      (k, i) =>
        `<tr><td>${esc(k.layer)}${en(enP?.kpis?.[i]?.layer)}</td><td>${esc(k.metric)}${en(enP?.kpis?.[i]?.metric)}</td><td>${esc(k.target)}${en(enP?.kpis?.[i]?.target)}</td></tr>`,
    )
    .join("");
  const competitorCards = competitors.competitors
    .map((c, i) => {
      const strengths = c.strengths
        .map((s, si) => `<li>${esc(s)}${en(enK?.competitors?.[i]?.strengths?.[si])}</li>`)
        .join("");
      const weaknesses = c.weaknesses
        .map((w, wi) => `<li>${esc(w)}${en(enK?.competitors?.[i]?.weaknesses?.[wi])}</li>`)
        .join("");
      return `
      <div class="comp-card">
        <h3>${esc(c.name)}</h3>
        <p class="comp-label">优势</p>
        <ul class="pros">${strengths}</ul>
        <p class="comp-label">劣势</p>
        <ul class="cons">${weaknesses}</ul>
        <p class="comp-label">用户画像</p>
        <p class="comp-persona">${esc(c.persona)}${en(enK?.competitors?.[i]?.persona)}</p>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(brief.brand)} · 整合传播提案</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    color: #2b2620; background: #f6f3eb; line-height: 1.7;
    padding: 48px 24px;
  }
  .page { max-width: 820px; margin: 0 auto; background: #fbf9f4;
    border: 1px solid #ddd5c4; padding: 64px 72px; }
  .display { font-family: "Noto Serif SC", "Songti SC", serif; }
  header { border-bottom: 2px solid #2b2620; padding-bottom: 28px; }
  header .kicker { font-size: 12px; letter-spacing: .25em; color: #b0430f; }
  header h1 { font-size: 34px; margin-top: 12px; font-weight: 700; }
  header .subtitle { font-size: 16px; color: #7d7466; font-style: italic; margin-top: 4px; }
  header .meta { margin-top: 10px; font-size: 13px; color: #7d7466; }
  .client { padding: 26px 0; border-bottom: 1px solid #e4ddcd; }
  .client .kicker2 { font-size: 11px; letter-spacing: .25em; color: #b0430f; font-weight: 500; }
  .client .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-top: 16px; }
  .client .grid.cols4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .client .label { font-size: 11px; letter-spacing: .15em; color: #7d7466; }
  .client .value { font-family: "Noto Serif SC", serif; font-size: 16px; font-weight: 700; margin-top: 4px; }
  section { padding: 36px 0; border-bottom: 1px solid #e4ddcd; }
  section:last-of-type { border-bottom: none; }
  .sec-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 22px; }
  .sec-head .num { font-family: "Noto Serif SC", serif; font-style: italic;
    font-size: 26px; color: #b0430f; }
  .sec-head h2 { font-size: 21px; font-weight: 700; }
  .en { font-size: 12px; color: #8a8172; font-style: italic; margin-top: 2px; }
  .profile { font-size: 15px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 22px; }
  .cols h3 { font-size: 14px; letter-spacing: .1em; color: #7d7466; margin-bottom: 12px; }
  .cols ul { list-style: none; }
  .cols li { margin-bottom: 12px; font-size: 13.5px; }
  .cols li strong { display: block; font-size: 14px; }
  .cols li span { color: #5d564b; }
  .insight { border-left: 3px solid #b0430f; padding: 4px 0 4px 20px; margin: 8px 0 26px; }
  .insight p { font-family: "Noto Serif SC", serif; font-size: 19px; font-weight: 600; }
  .insight p.en { font-family: "Noto Sans SC", sans-serif; font-size: 12.5px; font-weight: 400; }
  .insight .label { font-family: "Noto Sans SC", sans-serif; font-size: 11px;
    letter-spacing: .25em; color: #b0430f; font-weight: 500; }
  .bigidea h3 { font-family: "Noto Serif SC", serif; font-size: 30px;
    font-weight: 900; margin-bottom: 4px; }
  .bigidea p { font-size: 14.5px; color: #443e35; }
  .logic { margin-top: 22px; font-size: 13.5px; color: #5d564b;
    background: #f1ecdf; padding: 16px 20px; }
  .logic strong { color: #2b2620; }
  .logic + .en { padding: 4px 20px 0; }
  .theme { font-family: "Noto Serif SC", serif; font-size: 24px; font-weight: 700;
    margin-bottom: 18px; }
  ol.slogans { list-style: none; }
  ol.slogans li { display: flex; gap: 12px; align-items: baseline; font-size: 16px;
    padding: 8px 0; border-bottom: 1px dashed #e4ddcd; }
  ol.slogans .idx { font-family: "Noto Serif SC", serif; font-style: italic;
    color: #b0430f; font-size: 14px; }
  .platform { margin-bottom: 26px; }
  .platform h3 { font-size: 17px; font-weight: 700; }
  .platform .pos { font-size: 13px; color: #7d7466; margin: 2px 0 12px; }
  .item { padding: 12px 0; border-top: 1px solid #e9e2d2; }
  .item h4 { font-size: 14.5px; }
  .item p { font-size: 13.5px; color: #5d564b; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th { text-align: left; font-size: 12px; letter-spacing: .1em; color: #7d7466;
    border-bottom: 2px solid #2b2620; padding: 0 12px 10px 0; }
  td { padding: 14px 12px 14px 0; border-bottom: 1px solid #e4ddcd;
    vertical-align: top; }
  td.phase { font-weight: 700; white-space: nowrap; }
  td.phase span { display: block; font-weight: 400; font-size: 12px; color: #7d7466; }
  td ul { padding-left: 16px; }
  .budget-head { font-size: 14px; letter-spacing: .1em; color: #7d7466;
    margin: 30px 0 14px; }
  .comp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .comp-card { border: 1px solid #e4ddcd; background: #f6f2e8; padding: 18px; }
  .comp-card h3 { font-size: 15px; font-weight: 700; }
  .comp-label { font-size: 11px; letter-spacing: .15em; color: #7d7466; margin-top: 12px; }
  .comp-card ul { list-style: disc; padding-left: 16px; font-size: 13px; }
  .comp-card .pros li { color: #2b2620; }
  .comp-card .cons li { color: #5d564b; }
  .comp-persona { font-size: 13px; color: #5d564b; margin-top: 4px; }
  .diff { border-left: 3px solid #b0430f; padding: 4px 0 4px 20px; margin-top: 22px; }
  .diff .label { font-size: 11px; letter-spacing: .25em; color: #b0430f; font-weight: 500; }
  .diff p { font-size: 14.5px; margin-top: 6px; }
  footer { margin-top: 36px; font-size: 12px; color: #9a917f; text-align: center; }
  @media print {
    body { background: #fff; padding: 0; }
    .page { border: none; max-width: none; padding: 40px 56px; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <p class="kicker">INTEGRATED CAMPAIGN PROPOSAL</p>
    <h1 class="display">${esc(brief.brand)} · 整合传播提案</h1>
    ${bilingual ? `<p class="subtitle">${esc(brief.brand)} · Integrated Campaign Proposal</p>` : ""}
    <p class="meta">${esc(brief.industry)} · 预算 ${esc(brief.budget)} · 周期 ${esc(brief.duration)} · ${today}</p>
  </header>

  <div class="client">
    <p class="kicker2">CLIENT INFORMATION · 客户信息</p>
    <div class="grid${brief.totalBudget ? " cols4" : ""}">
      <div><p class="label">客户名称</p><p class="value">${esc(brief.clientName || brief.brand)}</p></div>
      <div><p class="label">项目预算</p><p class="value">${esc(brief.budget)}</p></div>
      ${brief.totalBudget ? `<div><p class="label">总预算</p><p class="value">${esc(brief.totalBudget)}</p></div>` : ""}
      <div><p class="label">目标城市</p><p class="value">${esc(brief.city || "全国")}</p></div>
    </div>
  </div>

  <section>
    <div class="sec-head"><span class="num">01</span><h2 class="display">市场洞察</h2></div>
    <p class="profile">${esc(strategy.audienceProfile)}${en(enS?.audienceProfile)}</p>
    <div class="cols">
      <div><h3>消费趋势</h3><ul>${trendList}</ul></div>
      <div><h3>竞争格局</h3><ul>${compList}</ul></div>
    </div>
  </section>

  <section>
    <div class="sec-head"><span class="num">02</span><h2 class="display">核心策略</h2></div>
    <div class="insight">
      <p class="label">KEY INSIGHT</p>
      <p>${esc(strategy.keyInsight)}${en(enS?.keyInsight)}</p>
    </div>
    <div class="bigidea">
      <h3>${esc(strategy.bigIdeaTitle)}</h3>
      ${en(enS?.bigIdeaTitle)}
      <p>${esc(strategy.bigIdeaDescription)}</p>
      ${en(enS?.bigIdeaDescription)}
    </div>
    <p class="logic"><strong>策略推导:</strong>${esc(strategy.strategyLogic)}</p>
    ${en(enS?.strategyLogic)}
  </section>

  <section>
    <div class="sec-head"><span class="num">03</span><h2 class="display">传播主题</h2></div>
    <p class="theme">「${esc(strategy.campaignTheme)}」</p>
    ${en(enS?.campaignTheme)}
    <ol class="slogans">${slogans}</ol>
  </section>

  <section>
    <div class="sec-head"><span class="num">04</span><h2 class="display">多平台内容矩阵</h2></div>
    ${platforms}
  </section>

  <section>
    <div class="sec-head"><span class="num">05</span><h2 class="display">执行排期</h2></div>
    <table>
      <thead><tr><th style="width:140px">阶段</th><th style="width:200px">目标</th><th>关键动作</th></tr></thead>
      <tbody>${phases}</tbody>
    </table>
    <p class="budget-head">预算分配${brief.totalBudget ? ` · 总预算 ${esc(brief.totalBudget)}` : ""}</p>
    <table>
      <thead><tr><th style="width:120px">项目</th><th style="width:80px">占比</th><th style="width:150px">金额估算</th><th>分配理由</th></tr></thead>
      <tbody>${budgetRows}</tbody>
    </table>
  </section>

  <section>
    <div class="sec-head"><span class="num">06</span><h2 class="display">KPI 框架</h2></div>
    <table>
      <thead><tr><th style="width:100px">层级</th><th>指标</th><th style="width:180px">参考目标</th></tr></thead>
      <tbody>${kpis}</tbody>
    </table>
  </section>

  <section>
    <div class="sec-head"><span class="num">07</span><h2 class="display">竞品分析</h2></div>
    <div class="comp-grid">${competitorCards}</div>
    <div class="diff">
      <p class="label">差异化定位 · DIFFERENTIATION</p>
      <p>${esc(competitors.differentiation)}${en(enK?.differentiation)}</p>
      ${
        sources.length
          ? `<div class="sources"><p class="sources-title">资料来源 · SOURCES</p><ul>${sources
              .map(
                (s) =>
                  `<li>${esc(s.brand)} · ${esc(s.title || s.url)}<br><span>${esc(s.url)}</span></li>`,
              )
              .join("")}</ul></div>`
          : ""
      }
    </div>
  </section>

  <footer>由 Pitch Copilot 生成 · AI 营销提案工作台</footer>
</div>
</body>
</html>`;
}

export function openExport(html: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
