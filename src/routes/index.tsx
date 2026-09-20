import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { BriefForm } from "@/components/pitch/BriefForm";
import { ProposalView } from "@/components/pitch/ProposalView";
import { supabase } from "@/integrations/supabase/client";
import { buildExportHtml, openExport } from "@/lib/export-html";
import { buildSlidesHtml, openSlides } from "@/lib/export-slides-html";
import {
  deleteProposal,
  getProposal,
  listMediaImageUrls,
  listProposals,
  publishProposal,
  saveProposal,
  unpublishProposal,
  type ProposalSummary,
} from "@/lib/library.functions";
import type { MediaImage } from "@/components/pitch/ProposalView";
import {
  generateCompetitors,
  researchCompetitors,
  generateContent,
  generatePlan,
  generateStrategy,
  translateGroup,
} from "@/lib/proposal.functions";
import { EMPTY_BRANDING } from "@/lib/proposal-schema";
import type {
  Bilingual,
  BriefInput,
  ProposalBranding,
  CompetitorResult,
  CompetitorSource,
  ContentResult,
  GroupName,
  GroupStatus,
  PlanResult,
  StrategyResult,
  TranslatableKind,
} from "@/lib/proposal-schema";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pitch Copilot — AI 营销提案工作台" },
      {
        name: "description",
        content:
          "输入客户 Brief,AI 按广告代理提案结构生成市场洞察、核心策略、传播主题、多平台内容矩阵、执行排期、预算分配、KPI 框架与竞品分析,并一键导出可打印的提案文档。",
      },
      { property: "og:title", content: "Pitch Copilot — AI 营销提案工作台" },
      {
        property: "og:description",
        content:
          "把 Brief 交给 AI,十分钟拿到一份可提案的整合传播方案:洞察、策略、内容矩阵、排期、预算、KPI 与竞品分析,一键导出。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workbench,
});

const IDLE = {
  strategy: "idle",
  content: "idle",
  plan: "idle",
  competitors: "idle",
  translation: "idle",
} as Record<GroupName, GroupStatus | "idle">;

const DONE = {
  strategy: "done",
  content: "done",
  plan: "done",
  competitors: "done",
  translation: "done",
} as Record<GroupName, GroupStatus | "idle">;

const TRANSLATE_ORDER: TranslatableKind[] = [
  "strategy",
  "content",
  "plan",
  "competitors",
];

function Workbench() {
  const navigate = useNavigate();
  const runStrategy = useServerFn(generateStrategy);
  const runContent = useServerFn(generateContent);
  const runPlan = useServerFn(generatePlan);
  const runCompetitors = useServerFn(generateCompetitors);
  const runResearch = useServerFn(researchCompetitors);
  const runTranslate = useServerFn(translateGroup);
  const runListProposals = useServerFn(listProposals);
  const runGetProposal = useServerFn(getProposal);
  const runSaveProposal = useServerFn(saveProposal);
  const runDeleteProposal = useServerFn(deleteProposal);
  const runPublish = useServerFn(publishProposal);
  const runUnpublish = useServerFn(unpublishProposal);
  const runListMediaImages = useServerFn(listMediaImageUrls);

  const [signedIn, setSignedIn] = useState(false);
  const [brief, setBrief] = useState<BriefInput | null>(null);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [content, setContent] = useState<ContentResult | null>(null);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorResult | null>(null);
  const [sources, setSources] = useState<CompetitorSource[]>([]);
  const [translation, setTranslation] = useState<Bilingual>({});
  const [pptxBusy, setPptxBusy] = useState(false);
  const [records, setRecords] = useState<ProposalSummary[]>([]);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [draftBrief, setDraftBrief] = useState<BriefInput | null>(null);
  const [groupStatus, setGroupStatus] =
    useState<Record<GroupName, GroupStatus | "idle">>(IDLE);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [branding, setBranding] = useState<ProposalBranding>({
    ...EMPTY_BRANDING,
  });
  const [published, setPublished] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [mediaImages, setMediaImages] = useState<MediaImage[]>([]);

  // 最近一次保存的内容,用于「放弃修改」
  const savedRef = useRef<{
    strategy: StrategyResult | null;
    content: ContentResult | null;
    plan: PlanResult | null;
    competitors: CompetitorResult | null;
    branding: ProposalBranding;
  }>({
    strategy: null,
    content: null,
    plan: null,
    competitors: null,
    branding: { ...EMPTY_BRANDING },
  });

  // 已生成章节的最新值,供翻译步骤读取(避免闭包读到旧 state)
  const resultsRef = useRef<{
    strategy?: StrategyResult;
    content?: ContentResult;
    plan?: PlanResult;
    competitors?: CompetitorResult;
  }>({});

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshRecords = async () => {
    try {
      setRecords((await runListProposals()) ?? []);
    } catch (error) {
      console.error("list proposals failed", error);
    }
  };

  useEffect(() => {
    if (!signedIn) {
      setRecords([]);
      return;
    }
    void refreshRecords();
    void runListMediaImages()
      .then((list) => setMediaImages(list ?? []))
      .catch((error) => console.error("list media images failed", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const callGroup = async (group: GroupName, b: BriefInput) => {
    if (group === "strategy") {
      const r = await runStrategy({ data: b });
      if (!r) throw new Error("AI 返回内容为空");
      resultsRef.current.strategy = r;
      setStrategy(r);
    } else if (group === "content") {
      const r = await runContent({ data: b });
      if (!r) throw new Error("AI 返回内容为空");
      resultsRef.current.content = r;
      setContent(r);
    } else if (group === "plan") {
      const r = await runPlan({ data: b });
      if (!r) throw new Error("AI 返回内容为空");
      resultsRef.current.plan = r;
      setPlan(r);
    } else if (group === "competitors") {
      let r: CompetitorResult | null = null;
      if (b.research === "web") {
        try {
          const web = await runResearch({ data: b });
          r = web?.data ?? null;
          setSources(web?.sources ?? []);
        } catch (error) {
          // 联网检索失败(无结果/额度/超时)时退回纯 AI 推断,保证提案不断档
          console.error("[competitors] web research failed, fallback to AI", error);
          setSources([]);
        }
      }
      if (!r) r = await runCompetitors({ data: b });
      if (!r) throw new Error("AI 返回内容为空");
      resultsRef.current.competitors = r;
      setCompetitors(r);
    } else {
      // translation:把已生成的中文章节逐个翻译成英文
      for (const kind of TRANSLATE_ORDER) {
        const payload = resultsRef.current[kind];
        if (!payload) continue;
        const r = await runTranslate({ data: { kind, payload } });
        if (!r) throw new Error("AI 翻译返回为空");
        const next = { ...translation };
        (next as Record<TranslatableKind, unknown>)[kind] = r;
        setTranslation(next);
      }
    }
  };

  const runGroup = async (group: GroupName, b: BriefInput) => {
    setGroupStatus((s) => ({ ...s, [group]: "loading" }));
    // 失败自动重试一次(AI 偶发空响应/格式异常),仍失败才标记错误交给用户手动重试
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await callGroup(group, b);
        setGroupStatus((s) => ({ ...s, [group]: "done" }));
        return;
      } catch (error) {
        console.error(`[${group}] generation failed (attempt ${attempt + 1})`, error);
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
    setGroupStatus((s) => ({ ...s, [group]: "error" }));
  };

  const snapshot = (b: ProposalBranding) => {
    savedRef.current = {
      strategy: resultsRef.current.strategy ?? null,
      content: resultsRef.current.content ?? null,
      plan: resultsRef.current.plan ?? null,
      competitors: resultsRef.current.competitors ?? null,
      branding: b,
    };
  };

  const persist = async (b: BriefInput, id?: string | null) => {
    if (!signedIn) return null;
    try {
      const payload = {
        brief: b,
        strategy: resultsRef.current.strategy ?? null,
        content: resultsRef.current.content ?? null,
        plan: resultsRef.current.plan ?? null,
        competitors: resultsRef.current.competitors ?? null,
        sources,
        translation,
      };
      const result = await runSaveProposal({
        data: id ? { id, ...payload } : payload,
      });
      setProposalId(result.id);
      snapshot(branding);
      await refreshRecords();
      return result.id;
    } catch (error) {
      console.error("save proposal failed", error);
      return null;
    }
  };

  const onStrategyEdit = (next: StrategyResult) => {
    resultsRef.current.strategy = next;
    setStrategy(next);
    setDirty(true);
  };
  const onContentEdit = (next: ContentResult) => {
    resultsRef.current.content = next;
    setContent(next);
    setDirty(true);
  };
  const onPlanEdit = (next: PlanResult) => {
    resultsRef.current.plan = next;
    setPlan(next);
    setDirty(true);
  };
  const onCompetitorsEdit = (next: CompetitorResult) => {
    resultsRef.current.competitors = next;
    setCompetitors(next);
    setDirty(true);
  };
  const onBrandingEdit = (next: ProposalBranding) => {
    setBranding(next);
    setDirty(true);
  };

  const saveEdits = async () => {
    if (!brief) return;
    setSavingEdit(true);
    try {
      const id = await persist(brief, proposalId);
      // 已发布的提案同步更新对外页面
      if (id && published) {
        await runPublish({ data: { id, branding } });
      }
      setDirty(false);
    } finally {
      setSavingEdit(false);
    }
  };

  const discardEdits = () => {
    const saved = savedRef.current;
    const cached: typeof resultsRef.current = {};
    if (saved.strategy) cached.strategy = saved.strategy;
    if (saved.content) cached.content = saved.content;
    if (saved.plan) cached.plan = saved.plan;
    if (saved.competitors) cached.competitors = saved.competitors;
    resultsRef.current = cached;
    setStrategy(saved.strategy);
    setContent(saved.content);
    setPlan(saved.plan);
    setCompetitors(saved.competitors);
    setBranding(saved.branding);
    setDirty(false);
  };

  const publish = async () => {
    if (!brief) return;
    setPublishBusy(true);
    try {
      const id = proposalId ?? (await persist(brief, null));
      if (!id) return;
      if (dirty) await persist(brief, id);
      const result = await runPublish({ data: { id, branding } });
      setShareSlug(result.slug);
      setPublished(true);
      setDirty(false);
      snapshot(branding);
    } catch (error) {
      console.error("publish failed", error);
    } finally {
      setPublishBusy(false);
    }
  };

  const unpublish = async () => {
    if (!proposalId) return;
    setPublishBusy(true);
    try {
      await runUnpublish({ data: { id: proposalId } });
      setPublished(false);
    } catch (error) {
      console.error("unpublish failed", error);
    } finally {
      setPublishBusy(false);
    }
  };

  const start = async (b: BriefInput) => {
    setBrief(b);
    setStrategy(null);
    setContent(null);
    setPlan(null);
    setCompetitors(null);
    setSources([]);
    setTranslation({});
    resultsRef.current = {};
    setGroupStatus({ ...IDLE });
    setProposalId(null);
    setPublished(false);
    setShareSlug(null);
    setEditing(false);
    setDirty(false);
    await runGroup("strategy", b);
    await runGroup("content", b);
    await runGroup("plan", b);
    await runGroup("competitors", b);
    if (b.language === "en") {
      await runGroup("translation", b);
    }
    await persist(b);
  };

  const retry = async (group: GroupName) => {
    if (brief) await runGroup(group, brief);
  };

  const restart = () => {
    setBrief(null);
    setStrategy(null);
    setContent(null);
    setPlan(null);
    setCompetitors(null);
    setSources([]);
    setTranslation({});
    resultsRef.current = {};
    setGroupStatus({ ...IDLE });
    setDraftBrief(null);
    setProposalId(null);
    setBranding({ ...EMPTY_BRANDING });
    setPublished(false);
    setShareSlug(null);
    setEditing(false);
    setDirty(false);
    window.scrollTo({ top: 0 });
  };

  const openRecord = async (id: string) => {
    setOpeningId(id);
    try {
      const saved = await runGetProposal({ data: { id } });
      const cached: typeof resultsRef.current = {};
      if (saved.strategy) cached.strategy = saved.strategy;
      if (saved.content) cached.content = saved.content;
      if (saved.plan) cached.plan = saved.plan;
      if (saved.competitors) cached.competitors = saved.competitors;
      resultsRef.current = cached;
      setStrategy(saved.strategy);
      setContent(saved.content);
      setPlan(saved.plan);
      setCompetitors(saved.competitors);
      setSources(saved.sources);
      setTranslation(saved.translation);
      setBrief(saved.brief);
      setGroupStatus({ ...DONE });
      setProposalId(saved.id);
      setBranding(saved.branding);
      setPublished(saved.published);
      setShareSlug(saved.shareSlug);
      setEditing(false);
      setDirty(false);
      savedRef.current = {
        strategy: saved.strategy,
        content: saved.content,
        plan: saved.plan,
        competitors: saved.competitors,
        branding: saved.branding,
      };
      setMobileSidebar(false);
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.error("open proposal failed", error);
    } finally {
      setOpeningId(null);
    }
  };

  const removeRecord = async (id: string) => {
    try {
      await runDeleteProposal({ data: { id } });
      setRecords((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("delete proposal failed", error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRecords([]);
    restart();
  };

  const deckInput = () =>
    brief && strategy && content && plan && competitors
      ? { brief, strategy, content, plan, competitors, sources, translation }
      : null;

  const exportProposal = () => {
    const d = deckInput();
    if (d) openExport(buildExportHtml(d));
  };

  const exportSlides = () => {
    const d = deckInput();
    if (d) openSlides(buildSlidesHtml(d));
  };

  const exportPptx = async () => {
    const d = deckInput();
    if (!d) return;
    setPptxBusy(true);
    try {
      const { downloadPptx } = await import("@/lib/export-pptx");
      await downloadPptx(d);
    } catch (error) {
      console.error("pptx export failed", error);
    } finally {
      setPptxBusy(false);
    }
  };

  const busy = (
    ["strategy", "content", "plan", "competitors", "translation"] as GroupName[]
  ).some((g) => groupStatus[g] === "loading");

  const recordList = (
    <div className="mt-2 space-y-1">
      {!signedIn ? (
        <p className="px-2 py-4 text-xs leading-5 text-muted-foreground">
          登录后，生成的方案会自动保存在这里。
        </p>
      ) : records.length === 0 ? (
        <p className="px-2 py-4 text-xs leading-5 text-muted-foreground">
          生成的方案会出现在这里，点开就能再看一次或重新导出。
        </p>
      ) : (
        records.map((record) => (
          <div
            key={record.id}
            className="flex items-center gap-1 rounded-md px-1 hover:bg-sidebar-accent"
          >
            <Button
              type="button"
              variant="ghost"
              className="h-auto min-w-0 flex-1 justify-start px-1 py-2.5 text-left hover:bg-transparent"
              onClick={() => void openRecord(record.id)}
            >
              {openingId === record.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-primary" />
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {record.brand}
                </span>
                <span className="mt-0.5 block truncate text-[10px] font-normal text-muted-foreground">
                  {new Intl.DateTimeFormat("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date(record.createdAt))}{" "}
                  · {record.industry}
                </span>
              </span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label={`删除 ${record.brand} 的提案`}
              onClick={() => void removeRecord(record.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="grid h-16 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-5">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebar(true)} aria-label="打开方案记录">
            <Menu />
          </Button>
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="font-display text-lg font-bold tracking-wide text-foreground">
              Pitch Copilot
            </span>
            <span className="hidden text-[12px] tracking-[0.2em] text-muted-foreground sm:inline">
              AI 营销提案工作台
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
            {signedIn ? (
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => void signOut()}>
                <LogOut className="h-3.5 w-3.5" />
                退出
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-[13px]" onClick={() => void navigate({ to: "/auth" })}>
                <LogIn className="h-3.5 w-3.5" />
                登录
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)] w-full">
        <aside className={`hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:block ${sidebarOpen ? "w-64" : "w-16"}`}>
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-3">
            <div className={`flex items-center ${sidebarOpen ? "justify-between" : "justify-center"}`}>
              {sidebarOpen && <p className="px-2 text-xs font-semibold text-sidebar-foreground">我的方案</p>}
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "收起侧栏" : "展开侧栏"}>
                {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className={`mt-3 border-sidebar-border bg-sidebar hover:bg-sidebar-accent ${sidebarOpen ? "w-full justify-start" : "w-full px-0"}`}
              onClick={restart}
              title="新建提案"
            >
              <Plus />{sidebarOpen && "新建提案"}
            </Button>
            {sidebarOpen && (
              <div className="mt-6">
                <p className="px-2 text-[11px] font-semibold text-muted-foreground">最近生成</p>
                {recordList}
              </div>
            )}
          </div>
        </aside>

        {mobileSidebar && (
          <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setMobileSidebar(false)}>
            <aside className="h-full w-[min(82vw,300px)] overflow-y-auto bg-sidebar p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold">我的方案</p>
                <Button variant="ghost" size="icon" onClick={() => setMobileSidebar(false)} aria-label="关闭方案记录"><X /></Button>
              </div>
              <Button type="button" variant="outline" className="mt-4 w-full justify-start" onClick={() => { restart(); setMobileSidebar(false); }}><Plus />新建提案</Button>
              {recordList}
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          {brief === null ? (
            <BriefForm
              key={draftBrief ? `${draftBrief.brand}-${draftBrief.objective}` : "new"}
              initialBrief={draftBrief}
              onSubmit={start}
              signedIn={signedIn}
              onSignIn={() => void navigate({ to: "/auth" })}
            />
          ) : (
            <ProposalView
              brief={brief}
              strategy={strategy}
              content={content}
              plan={plan}
              competitors={competitors}
              sources={sources}
              translation={translation}
              groupStatus={groupStatus}
              onRetry={retry}
              onExport={exportProposal}
              onExportSlides={exportSlides}
              onExportPptx={exportPptx}
              pptxBusy={pptxBusy}
            />
          )}
        </div>
      </div>
    </div>
  );
}
