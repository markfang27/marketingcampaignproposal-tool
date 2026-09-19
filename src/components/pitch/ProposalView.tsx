import { Check, Loader2, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SECTIONS,
  type BriefInput,
  type ContentResult,
  type GroupName,
  type GroupStatus,
  type PlanResult,
  type StrategyResult,
} from "@/lib/proposal-schema";

interface Props {
  brief: BriefInput;
  strategy: StrategyResult | null;
  content: ContentResult | null;
  plan: PlanResult | null;
  groupStatus: Record<GroupName, GroupStatus | "idle">;
  onRetry: (group: GroupName) => void;
  onExport: () => void;
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

function Bullet({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[13.5px] leading-6 text-muted-foreground">
        {detail}
      </p>
    </li>
  );
}

export function ProposalView({
  brief,
  strategy,
  content,
  plan,
  groupStatus,
  onRetry,
  onExport,
}: Props) {
  const groupOf = (g: GroupName): GroupStatus => {
    const s = groupStatus[g];
    return s === "done" || s === "error" ? s : "loading";
  };

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
        <p className="mt-3 text-[13px] text-muted-foreground">
          {brief.industry} · 预算 {brief.budget} · 周期 {brief.duration}
        </p>
      </header>

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
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      消费趋势
                    </p>
                    <ul className="space-y-3">
                      {strategy.trends.map((t) => (
                        <Bullet key={t.title} {...t} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      竞争格局
                    </p>
                    <ul className="space-y-3">
                      {strategy.competition.map((c) => (
                        <Bullet key={c.title} {...c} />
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
                </div>
                <div>
                  <p className="font-display text-[26px] font-bold text-foreground">
                    {strategy.bigIdeaTitle}
                  </p>
                  <p className="mt-2 text-[14.5px] leading-7 text-muted-foreground">
                    {strategy.bigIdeaDescription}
                  </p>
                </div>
                <p className="bg-secondary px-5 py-4 text-[13.5px] leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">策略推导:</span>
                  {strategy.strategyLogic}
                </p>
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
                <ol className="mt-6 space-y-0">
                  {strategy.slogans.map((s, i) => (
                    <li
                      key={s}
                      className="flex items-baseline gap-4 border-b border-dashed border-border py-3 first:border-t"
                    >
                      <span className="font-display text-sm italic text-brand">
                        0{i + 1}
                      </span>
                      <span className="text-[15px] text-foreground">{s}</span>
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
                {content.platforms.map((p) => (
                  <div key={p.platform}>
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="text-[16px] font-bold text-foreground">
                        {p.platform}
                      </h3>
                      <span className="text-[12.5px] text-muted-foreground">
                        {p.positioning}
                      </span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {p.items.map((it) => (
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
                    {plan.phases.map((ph) => (
                      <tr
                        key={ph.name}
                        className="border-b border-border align-top"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-foreground">
                            {ph.name}
                          </p>
                          <p className="text-[12px] text-muted-foreground">
                            {ph.weeks}
                          </p>
                        </td>
                        <td className="py-4 pr-4 text-muted-foreground">
                          {ph.goal}
                        </td>
                        <td className="py-4">
                          <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                            {ph.actions.map((a) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {plan.kpis.map((k) => (
                    <tr key={k.metric} className="border-b border-border">
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        {k.layer}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {k.metric}
                      </td>
                      <td className="py-3.5 text-muted-foreground">
                        {k.target}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionShell>

          <div className="pt-8">
            <Button
              onClick={onExport}
              disabled={
                groupStatus.strategy !== "done" ||
                groupStatus.content !== "done" ||
                groupStatus.plan !== "done"
              }
              className="h-11 rounded-none bg-foreground px-8 text-[15px] text-background hover:bg-foreground/85"
            >
              导出提案文档
            </Button>
            <p className="mt-3 text-[12.5px] text-muted-foreground">
              会在新标签页打开排版完整的提案文档,浏览器中可直接打印 / 另存为 PDF。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
