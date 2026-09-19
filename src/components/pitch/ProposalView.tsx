import { Check, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SECTIONS,
  type Bilingual,
  type BriefInput,
  type CompetitorResult,
  type ContentResult,
  type GroupName,
  type GroupStatus,
  type PlanResult,
  type StrategyResult,
} from "@/lib/proposal-schema";

const TRANSLATE_ORDER = ["strategy", "content", "plan", "competitors"] as const;

interface Props {
  brief: BriefInput;
  strategy: StrategyResult | null;
  content: ContentResult | null;
  plan: PlanResult | null;
  competitors: CompetitorResult | null;
  translation: Bilingual;
  groupStatus: Record<GroupName, GroupStatus | "idle">;
  onRetry: (group: GroupName) => void;
  onExport: () => void;
  onExportSlides: () => void;
  onExportPptx: () => void;
  pptxBusy?: boolean;
}

// 英文对照行:双语提案时显示在中文下方
function En({ text }: { text: string | undefined }) {
  if (!text?.trim()) return null;
  return (
    <p className="mt-1 text-[12px] leading-6 text-muted-foreground italic">
      {text}
    </p>
  );
}

function SectionShell({
  num,
  title,
  status,
  onRetry,
  children,
}: {
  num: string;
  title: string;
  status: GroupStatus;
  onRetry: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={num} className="scroll-mt-28 border-b border-border py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl italic text-brand">
            {num}
          </span>
          <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
            {title}
          </h2>
        </div>
        {status === "error" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-8 gap-1.5 text-[13px] text-destructive hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            重新生成本节
          </Button>
        )}
      </div>

      {status === "loading" ? (
        <Skeleton />
      ) : status === "error" ? (
        <p className="flex items-center gap-2 py-4 text-sm text-destructive">
          <TriangleAlert className="h-4 w-4" />
          本节生成失败,可点击右上角重试,不影响其他章节。
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 py-2">
      <div className="h-4 w-3/4 bg-secondary" />
      <div className="h-4 w-1/2 bg-secondary" />
      <div className="h-4 w-2/3 bg-secondary" />
    </div>
  );
}

function Bullet({
  title,
  detail,
  en,
}: {
  title: string;
  detail: string;
  en: { title: string; detail: string } | undefined;
}) {
  return (
    <li className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
        {detail}
      </p>
      {en && <En text={en.title} />}
      {en && <En text={en.detail} />}
    </li>
  );
}

export function ProposalView({
  brief,
  strategy,
  content,
  plan,
  competitors,
  translation,
  groupStatus,
  onRetry,
  onExport,
  onExportSlides,
  onExportPptx,
  pptxBusy,
}: Props) {
  const trS = translation.strategy;
  const trC = translation.content;
  const trP = translation.plan;
  const trK = translation.competitors;

  // 数据为空的「成功」按失败处理,避免渲染空白章节
  const groupOf = (g: GroupName): GroupStatus => {
    const s = groupStatus[g];
    if (s === "error") return "error";
    if (s === "done") {
      if (g === "strategy") return strategy ? "done" : "error";
      if (g === "content") return content ? "done" : "error";
      if (g === "plan") return plan ? "done" : "error";
      if (g === "competitors") return competitors ? "done" : "error";
      return trS && trC && trP && trK ? "done" : "error";
    }
    return "loading";
  };

  const groups: GroupName[] = [
    "strategy",
    "content",
    "plan",
    "competitors",
    "translation",
  ];
  const failedGroups = groups.filter((g) => groupOf(g) === "error");
  const anyLoading = groups.some((g) => groupOf(g) === "loading");

  const baseDone =
    strategy && content && plan && competitors && !anyLoading;
  const translationDone =
    brief.language !== "en" || Boolean(trS && trC && trP && trK);
  const exportReady = Boolean(baseDone && translationDone);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* 提案头 */}
      <header className="border-b-2 border-foreground pb-8">
        <p className="text-[11px] font-medium tracking-[0.3em] text-brand">
          INTEGRATED CAMPAIGN PROPOSAL
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">
          {brief.brand} · 整合传播提案
        </h1>
        {brief.language === "en" && (
          <p className="mt-1 font-display text-lg text-muted-foreground italic">
            {brief.brand} · Integrated Campaign Proposal
          </p>
        )}
        <p className="mt-3 text-[13px] text-muted-foreground">
          {brief.industry} · 预算 {brief.budget} · 周期 {brief.duration}
        </p>
      </header>

      {/* 客户信息页 */}
      <section className="border-b border-border py-8">
        <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
          CLIENT INFORMATION · 客户信息
        </p>
        <div
          className={`mt-5 grid gap-6 sm:grid-cols-2 ${
            brief.totalBudget ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          <div>
            <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
              客户名称
            </p>
            <p className="mt-1.5 font-display text-[16px] font-semibold text-foreground">
              {brief.clientName || brief.brand}
            </p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
              项目预算
            </p>
            <p className="mt-1.5 font-display text-[16px] font-semibold text-foreground">
              {brief.budget}
            </p>
          </div>
          {brief.totalBudget && (
            <div>
              <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                总预算
              </p>
              <p className="mt-1.5 font-display text-[16px] font-semibold text-foreground">
                {brief.totalBudget}
              </p>
            </div>
          )}
          <div>
            <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
              目标城市
            </p>
            <p className="mt-1.5 font-display text-[16px] font-semibold text-foreground">
              {brief.city || "全国"}
            </p>
          </div>
        </div>
      </section>

      {failedGroups.length > 0 && !anyLoading && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-destructive/40 bg-destructive/5 px-5 py-4">
          <p className="flex items-center gap-2 text-[13.5px] text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            有 {failedGroups.length} 组章节生成失败(AI 响应异常),已成功章节不受影响。
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => failedGroups.forEach((g) => onRetry(g))}
            className="h-8 gap-1.5 border-destructive/40 text-[13px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            一键重试失败章节
          </Button>
        </div>
      )}

      <div className="grid gap-12 pt-2 md:grid-cols-[190px_1fr] md:gap-16">
        {/* 章节导航 */}
        <nav className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => {
              const st = groupOf(s.group);
              return (
                <a
                  key={s.id}
                  href={`#${s.num}`}
                  className="group flex items-center gap-3 rounded-sm px-2 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span className="font-display italic">{s.num}</span>
                  <span>{s.title}</span>
                  <span className="ml-auto">
                    {st === "loading" && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" />
                    )}
                    {st === "done" && (
                      <Check className="h-3.5 w-3.5 text-foreground/40" />
                    )}
                    {st === "error" && (
                      <TriangleAlert className="h-3.5 w-3.5 text-destructive" />
                    )}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* 内容区 */}
        <div>
          <SectionShell
            num="01"
            title="市场洞察"
            status={groupOf("strategy")}
            onRetry={() => onRetry("strategy")}
          >
            {strategy && (
              <div className="space-y-8">
                <div>
                  <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                    目标人群画像
                  </p>
                  <p className="text-[15px] leading-7 text-foreground">
                    {strategy.audienceProfile}
                  </p>
                  <En text={trS?.audienceProfile} />
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      消费趋势
                    </p>
                    <ul className="space-y-3">
                      {strategy.trends.map((t, i) => (
                        <Bullet key={t.title} {...t} en={trS?.trends?.[i]} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      竞争格局
                    </p>
                    <ul className="space-y-3">
                      {strategy.competition.map((c, i) => (
                        <Bullet key={c.title} {...c} en={trS?.competition?.[i]} />
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="02"
            title="核心策略"
            status={groupOf("strategy")}
            onRetry={() => onRetry("strategy")}
          >
            {strategy && (
              <div className="space-y-7">
                <div className="border-l-2 border-brand pl-5">
                  <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
                    KEY INSIGHT
                  </p>
                  <p className="mt-2 font-display text-lg leading-8 font-semibold text-foreground">
                    {strategy.keyInsight}
                  </p>
                  <En text={trS?.keyInsight} />
                </div>
                <div>
                  <p className="font-display text-[26px] font-bold text-foreground">
                    {strategy.bigIdeaTitle}
                  </p>
                  <En text={trS?.bigIdeaTitle} />
                  <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">
                    {strategy.bigIdeaDescription}
                  </p>
                  <En text={trS?.bigIdeaDescription} />
                </div>
                <p className="bg-secondary px-5 py-4 text-[13.5px] leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">策略推导:</span>
                  {strategy.strategyLogic}
                </p>
                <div className="-mt-4 px-5">
                  <En text={trS?.strategyLogic} />
                </div>
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="03"
            title="传播主题"
            status={groupOf("strategy")}
            onRetry={() => onRetry("strategy")}
          >
            {strategy && (
              <div>
                <p className="font-display text-2xl font-bold text-foreground">
                  「{strategy.campaignTheme}」
                </p>
                <En text={trS?.campaignTheme} />
                <ol className="mt-6 space-y-0">
                  {strategy.slogans.map((s, i) => (
                    <li
                      key={s}
                      className="flex items-baseline gap-4 border-b border-dashed border-border py-3 first:border-t"
                    >
                      <span className="font-display text-sm italic text-brand">
                        0{i + 1}
                      </span>
                      <span>
                        <span className="text-[15px] text-foreground">{s}</span>
                        <En text={trS?.slogans?.[i]} />
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="04"
            title="内容矩阵"
            status={groupOf("content")}
            onRetry={() => onRetry("content")}
          >
            {content && (
              <div className="space-y-9">
                {content.platforms.map((p, pi) => (
                  <div key={p.platform}>
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="text-[16px] font-bold text-foreground">
                        {p.platform}
                      </h3>
                      <span className="text-[12.5px] text-muted-foreground">
                        {p.positioning}
                      </span>
                    </div>
                    {trC?.platforms?.[pi] && (
                      <p className="mt-0.5 text-[12px] text-muted-foreground italic">
                        {p.platform} · {trC.platforms[pi].positioning}
                      </p>
                    )}
                    <div className="mt-3 space-y-3">
                      {p.items.map((it, ii) => (
                        <div
                          key={it.title}
                          className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0"
                        >
                          <p className="text-[14px] font-semibold text-foreground">
                            {it.title}
                          </p>
                          <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
                            {it.body}
                          </p>
                          {trC?.platforms?.[pi]?.items?.[ii] && (
                            <>
                              <En text={trC.platforms[pi].items[ii].title} />
                              <En text={trC.platforms[pi].items[ii].body} />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="05"
            title="执行排期"
            status={groupOf("plan")}
            onRetry={() => onRetry("plan")}
          >
            {plan && (
              <div className="space-y-8">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b-2 border-foreground text-[11px] tracking-[0.15em] text-muted-foreground">
                        <th className="w-32 pb-2.5 pr-4 font-medium">阶段</th>
                        <th className="w-56 pb-2.5 pr-4 font-medium">目标</th>
                        <th className="pb-2.5 font-medium">关键动作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.phases.map((ph, i) => (
                        <tr
                          key={ph.name}
                          className="border-b border-border align-top"
                        >
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-foreground">
                              {ph.name}
                            </p>
                            <En text={trP?.phases?.[i]?.name} />
                            <p className="text-[12px] text-muted-foreground">
                              {ph.weeks}
                            </p>
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">
                            {ph.goal}
                            <En text={trP?.phases?.[i]?.goal} />
                          </td>
                          <td className="py-4">
                            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                              {ph.actions.map((a, ai) => (
                                <li key={a}>
                                  {a}
                                  <En text={trP?.phases?.[i]?.actions?.[ai]} />
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 预算分配 */}
                {plan.budgetAllocation.length > 0 && (
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      预算分配{brief.totalBudget ? ` · 总预算 ${brief.totalBudget}` : ""}
                    </p>
                    <table className="w-full text-left text-[13.5px]">
                      <thead>
                        <tr className="border-b-2 border-foreground text-[11px] tracking-[0.15em] text-muted-foreground">
                          <th className="w-28 pb-2.5 pr-4 font-medium">项目</th>
                          <th className="w-20 pb-2.5 pr-4 font-medium">占比</th>
                          <th className="w-36 pb-2.5 pr-4 font-medium">金额估算</th>
                          <th className="pb-2.5 font-medium">分配理由</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.budgetAllocation.map((b, i) => (
                          <tr
                            key={b.item}
                            className="border-b border-border align-top"
                          >
                            <td className="py-3.5 pr-4 font-semibold text-foreground">
                              {b.item}
                              <En text={trP?.budgetAllocation?.[i]?.item} />
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              {b.percent}
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              {b.amount}
                            </td>
                            <td className="py-3.5 text-muted-foreground">
                              {b.rationale}
                              <En text={trP?.budgetAllocation?.[i]?.rationale} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="06"
            title="KPI 框架"
            status={groupOf("plan")}
            onRetry={() => onRetry("plan")}
          >
            {plan && (
              <table className="w-full text-left text-[13.5px]">
                <thead>
                  <tr className="border-b-2 border-foreground text-[11px] tracking-[0.15em] text-muted-foreground">
                    <th className="w-24 pb-2.5 pr-4 font-medium">层级</th>
                    <th className="pb-2.5 pr-4 font-medium">指标</th>
                    <th className="w-44 pb-2.5 font-medium">参考目标</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.kpis.map((k, i) => (
                    <tr key={k.metric} className="border-b border-border">
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        {k.layer}
                        <En text={trP?.kpis?.[i]?.layer} />
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {k.metric}
                        <En text={trP?.kpis?.[i]?.metric} />
                      </td>
                      <td className="py-3.5 text-muted-foreground">
                        {k.target}
                        <En text={trP?.kpis?.[i]?.target} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionShell>

          <SectionShell
            num="07"
            title="竞品分析"
            status={groupOf("competitors")}
            onRetry={() => onRetry("competitors")}
          >
            {competitors && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {competitors.competitors.map((c, i) => (
                    <div
                      key={c.name}
                      className="border border-border bg-muted/30 p-5"
                    >
                      <p className="font-display text-[15px] font-bold text-foreground">
                        {c.name}
                      </p>
                      <div className="mt-3">
                        <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                          优势
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] text-foreground">
                          {c.strengths.map((s, si) => (
                            <li key={s}>
                              {s}
                              <En text={trK?.competitors?.[i]?.strengths?.[si]} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                          劣势
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] text-muted-foreground">
                          {c.weaknesses.map((w, wi) => (
                            <li key={w}>
                              {w}
                              <En text={trK?.competitors?.[i]?.weaknesses?.[wi]} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                          用户画像
                        </p>
                        <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                          {c.persona}
                        </p>
                        <En text={trK?.competitors?.[i]?.persona} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-l-2 border-brand pl-5">
                  <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
                    差异化定位 · DIFFERENTIATION
                  </p>
                  <p className="mt-2 text-[15px] leading-7 text-foreground">
                    {competitors.differentiation}
                  </p>
                  <En text={trK?.differentiation} />
                </div>
              </div>
            )}
          </SectionShell>

          <div className="pt-8">
            <p className="font-display text-[11px] tracking-[0.25em] text-brand">
              EXPORT · 导出
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                onClick={onExport}
                disabled={!exportReady}
                className="h-11 rounded-none bg-foreground px-8 text-[15px] text-background hover:bg-foreground/85"
              >
                导出提案文档
              </Button>
              <Button
                onClick={onExportPptx}
                disabled={!exportReady || pptxBusy}
                variant="outline"
                className="h-11 gap-2 rounded-none border-foreground px-8 text-[15px]"
              >
                {pptxBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                下载 PPT (.pptx)
              </Button>
              <Button
                onClick={onExportSlides}
                disabled={!exportReady}
                variant="outline"
                className="h-11 rounded-none border-border px-8 text-[15px]"
              >
                网页幻灯片放映
              </Button>
            </div>
            <p className="mt-3 text-[12.5px] leading-6 text-muted-foreground">
              提案文档:新标签页打开排版完整的文档,可直接打印 / 另存为 PDF。
              <br />
              PPT:下载 16:9 幻灯片文件,可在 PowerPoint / Keynote 里继续改。
              <br />
              网页放映:新标签页里按 ← → 翻页,面试现场无需 Office 也能演示。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
