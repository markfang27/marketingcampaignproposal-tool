import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BriefForm } from "@/components/pitch/BriefForm";
import { ProposalView } from "@/components/pitch/ProposalView";
import { buildExportHtml, openExport } from "@/lib/export-html";
import {
  generateContent,
  generatePlan,
  generateStrategy,
} from "@/lib/proposal.functions";
import type {
  BriefInput,
  ContentResult,
  GroupName,
  GroupStatus,
  PlanResult,
  StrategyResult,
} from "@/lib/proposal-schema";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pitch Copilot — AI 营销提案工作台" },
      {
        name: "description",
        content:
          "输入客户 Brief,AI 按广告代理提案结构生成市场洞察、核心策略、传播主题、多平台内容矩阵、执行排期与 KPI 框架,并一键导出可打印的提案文档。",
      },
      { property: "og:title", content: "Pitch Copilot — AI 营销提案工作台" },
      {
        property: "og:description",
        content:
          "把 Brief 交给 AI,十分钟拿到一份可提案的整合传播方案:洞察、策略、内容矩阵、排期与 KPI,一键导出。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workbench,
});

const IDLE = { strategy: "idle", content: "idle", plan: "idle" } as Record<
  GroupName,
  GroupStatus | "idle"
>;

function Workbench() {
  const runStrategy = useServerFn(generateStrategy);
  const runContent = useServerFn(generateContent);
  const runPlan = useServerFn(generatePlan);

  const [brief, setBrief] = useState<BriefInput | null>(null);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [content, setContent] = useState<ContentResult | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [groupStatus, setGroupStatus] =
    useState<Record<GroupName, GroupStatus | "idle">>(IDLE);

  const runGroup = async (group: GroupName, b: BriefInput) => {
    setGroupStatus((s) => ({ ...s, [group]: "loading" }));
    try {
      if (group === "strategy") {
        setStrategy(await runStrategy({ data: b }));
      } else if (group === "content") {
        setContent(await runContent({ data: b }));
      } else {
        setPlan(await runPlan({ data: b }));
      }
      setGroupStatus((s) => ({ ...s, [group]: "done" }));
    } catch (error) {
      console.error(`[${group}] generation failed`, error);
      setGroupStatus((s) => ({ ...s, [group]: "error" }));
    }
  };

  const start = async (b: BriefInput) => {
    setBrief(b);
    setStrategy(null);
    setContent(null);
    setPlan(null);
    setGroupStatus({ ...IDLE });
    await runGroup("strategy", b);
    await runGroup("content", b);
    await runGroup("plan", b);
  };

  const retry = async (group: GroupName) => {
    if (brief) await runGroup(group, brief);
  };

  const restart = () => {
    setBrief(null);
    setStrategy(null);
    setContent(null);
    setPlan(null);
    setGroupStatus({ ...IDLE });
    window.scrollTo({ top: 0 });
  };

  const exportProposal = () => {
    if (brief && strategy && content && plan) {
      openExport(buildExportHtml({ brief, strategy, content, plan }));
    }
  };

  const busy =
    groupStatus.strategy === "loading" ||
    groupStatus.content === "loading" ||
    groupStatus.plan === "loading";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-lg font-bold tracking-wide text-foreground">
              Pitch Copilot
            </span>
            <span className="hidden text-[12px] tracking-[0.2em] text-muted-foreground sm:inline">
              AI 营销提案工作台
            </span>
          </div>
          <div className="flex items-center gap-2">
            {busy && (
              <span className="mr-1 flex items-center gap-2 text-[12.5px] text-brand">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                AI 生成中…
              </span>
            )}
            {brief && (
              <Button
                variant="ghost"
                size="sm"
                onClick={restart}
                className="h-8 gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
              >
                <PenLine className="h-3.5 w-3.5" />
                重新开始
              </Button>
            )}
          </div>
        </div>
      </header>

      {brief === null ? (
        <BriefForm onSubmit={start} />
      ) : (
        <ProposalView
          brief={brief}
          strategy={strategy}
          content={content}
          plan={plan}
          groupStatus={groupStatus}
          onRetry={retry}
          onExport={exportProposal}
        />
      )}

      <footer className="border-t border-border py-6">
        <p className="text-center text-[12px] text-muted-foreground">
          Pitch Copilot · 求职作品 · 由 AI 驱动的营销提案工作台
        </p>
      </footer>
    </div>
  );
}
