import {
  Check,
  ImagePlus,
  Loader2,
  Pencil,
  RotateCcw,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editable } from "@/components/pitch/Editable";
import { PublishPanel } from "@/components/pitch/PublishPanel";
import {
  SECTIONS,
  type Bilingual,
  type BriefInput,
  type CompetitorResult,
  type CompetitorSource,
  type ContentResult,
  type GroupName,
  type GroupStatus,
  type PlanResult,
  type ProposalBranding,
  type StrategyResult,
} from "@/lib/proposal-schema";

export interface MediaImage {
  id: string;
  filename: string;
  url: string;
  storagePath: string;
}

interface Props {
  brief: BriefInput;
  strategy: StrategyResult | null;
  content: ContentResult | null;
  plan: PlanResult | null;
  competitors: CompetitorResult | null;
  sources: CompetitorSource[];
  translation: Bilingual;
  groupStatus: Record<GroupName, GroupStatus | "idle">;
  onRetry: (group: GroupName) => void;
  onExport: () => void;
  onExportSlides: () => void;
  onExportPptx: () => void;
  pptxBusy?: boolean;

  /** 只读模式:客户端分享页面,不显示编辑/导出/重试 */
  readOnly?: boolean;
  /** 编辑态 */
  editing?: boolean;
  onEditingChange?: (next: boolean) => void;
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onDiscard?: () => void;
  onStrategyChange?: (next: StrategyResult) => void;
  onContentChange?: (next: ContentResult) => void;
  onPlanChange?: (next: PlanResult) => void;
  onCompetitorsChange?: (next: CompetitorResult) => void;
  /** 企业信息 / 配图 */
  branding?: ProposalBranding;
  onBrandingChange?: (next: ProposalBranding) => void;
  mediaImages?: MediaImage[];
  /** 把素材路径解析成可访问的图片地址 */
  imageSrc?: (storagePath: string) => string;
  /** 发布状态 */
  published?: boolean;
  shareSlug?: string | null;
  publishBusy?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
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
  readOnly,
  children,
}: {
  num: string;
  title: string;
  status: GroupStatus;
  onRetry: () => void;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={num} className="scroll-mt-28 border-b border-border py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <span className="font-display text-2xl italic text-brand">{num}</span>
          <h2 className="font-display text-xl font-semibold tracking-wide text-foreground">
            {title}
          </h2>
        </div>
        {status === "error" && !readOnly && (
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
  editing,
  onTitle,
  onDetail,
}: {
  title: string;
  detail: string;
  en: { title: string; detail: string } | undefined;
  editing: boolean;
  onTitle: (v: string) => void;
  onDetail: (v: string) => void;
}) {
  return (
    <li className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0">
      <Editable
        as="p"
        editing={editing}
        value={title}
        onChange={onTitle}
        className="text-[14px] font-semibold text-foreground"
      />
      <Editable
        as="p"
        editing={editing}
        value={detail}
        onChange={onDetail}
        className="mt-1 block text-[13.5px] leading-6 text-muted-foreground"
      />
      {en && <En text={en.title} />}
      {en && <En text={en.detail} />}
    </li>
  );
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function ProposalView({
  brief,
  strategy,
  content,
  plan,
  competitors,
  sources,
  translation,
  groupStatus,
  onRetry,
  onExport,
  onExportSlides,
  onExportPptx,
  pptxBusy,
  readOnly = false,
  editing = false,
  onEditingChange,
  dirty = false,
  saving = false,
  onSave,
  onDiscard,
  onStrategyChange,
  onContentChange,
  onPlanChange,
  onCompetitorsChange,
  branding,
  onBrandingChange,
  mediaImages = [],
  imageSrc,
  published = false,
  shareSlug = null,
  publishBusy = false,
  canPublish = false,
  onPublish,
  onUnpublish,
}: Props) {
  const trS = translation.strategy;
  const trC = translation.content;
  const trP = translation.plan;
  const trK = translation.competitors;

  const edit = editing && !readOnly;

  const editS = (mutate: (draft: StrategyResult) => void) => {
    if (!strategy || !onStrategyChange) return;
    const draft = clone(strategy);
    mutate(draft);
    onStrategyChange(draft);
  };
  const editC = (mutate: (draft: ContentResult) => void) => {
    if (!content || !onContentChange) return;
    const draft = clone(content);
    mutate(draft);
    onContentChange(draft);
  };
  const editP = (mutate: (draft: PlanResult) => void) => {
    if (!plan || !onPlanChange) return;
    const draft = clone(plan);
    mutate(draft);
    onPlanChange(draft);
  };
  const editK = (mutate: (draft: CompetitorResult) => void) => {
    if (!competitors || !onCompetitorsChange) return;
    const draft = clone(competitors);
    mutate(draft);
    onCompetitorsChange(draft);
  };

  const resolveImage = (path: string): string => {
    if (imageSrc) return imageSrc(path);
    return mediaImages.find((m) => m.storagePath === path)?.url ?? "";
  };

  const setPlatformImage = (platform: string, path: string | null) => {
    if (!branding || !onBrandingChange) return;
    const images = { ...branding.images };
    if (path) images[platform] = path;
    else delete images[platform];
    onBrandingChange({ ...branding, images });
  };

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
    ...(brief.language === "en" ? (["translation"] as GroupName[]) : []),
  ];
  const failedGroups = groups.filter((g) => groupOf(g) === "error");
  const anyLoading = groups.some((g) => groupOf(g) === "loading");

  const baseDone = strategy && content && plan && competitors && !anyLoading;
  const translationDone =
    brief.language !== "en" || Boolean(trS && trC && trP && trK);
  const exportReady = Boolean(baseDone && translationDone);

  const percentTotal = (plan?.budgetAllocation ?? []).reduce((sum, row) => {
    const n = Number.parseFloat(row.percent.replace(/[^\d.]/g, ""));
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  const logo = branding?.logoDataUrl ?? "";
  const hasContact = Boolean(
    branding &&
      (branding.companyName ||
        branding.contactName ||
        branding.phone ||
        branding.email ||
        branding.website ||
        branding.closing),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* 编辑 / 保存工具条 */}
      {!readOnly && exportReady && (
        <div className="mb-6 flex flex-wrap items-center gap-3 border border-border bg-muted/40 px-5 py-3">
          <Button
            size="sm"
            variant={edit ? "default" : "outline"}
            className="h-8 gap-1.5 text-[13px]"
            onClick={() => onEditingChange?.(!edit)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {edit ? "退出编辑" : "编辑内容"}
          </Button>
          <span className="text-[12.5px] text-muted-foreground">
            {edit
              ? "点击任意文字即可直接修改，改完记得保存。"
              : "可直接修改提案里的文字、预算和配图，不用重新生成。"}
          </span>
          {dirty && (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-[12.5px] text-destructive">有未保存的修改</span>
              <Button
                size="sm"
                className="h-8 text-[13px]"
                onClick={onSave}
                disabled={saving}
              >
                {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                保存修改
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-[13px] text-muted-foreground"
                onClick={onDiscard}
                disabled={saving}
              >
                放弃修改
              </Button>
            </span>
          )}
        </div>
      )}

      {/* 企业 LOGO(发布页 / 已填写企业信息时显示) */}
      {(logo || (readOnly && branding?.companyName)) && (
        <div className="mb-6 flex items-center gap-4 border-b border-border pb-5">
          {logo && (
            <img
              src={logo}
              alt={branding?.companyName || "企业 LOGO"}
              className="h-12 w-auto max-w-[200px] object-contain"
            />
          )}
          {branding?.companyName && (
            <span className="font-display text-[15px] font-semibold text-foreground">
              {branding.companyName}
            </span>
          )}
        </div>
      )}

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
          {brief.industry} · 预算 {brief.budget || brief.totalBudget} · 周期{" "}
          {brief.duration}
        </p>
      </header>

      {/* 客户信息页 */}
      <section className="border-b border-border py-8">
        <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
          CLIENT INFORMATION · 客户信息
        </p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              总预算
            </p>
            <p className="mt-1.5 font-display text-[16px] font-semibold text-foreground">
              {brief.budget || brief.totalBudget}
            </p>
          </div>
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

      {failedGroups.length > 0 && !anyLoading && !readOnly && (
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
                  {!readOnly && (
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
                  )}
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
            readOnly={readOnly}
          >
            {strategy && (
              <div className="space-y-8">
                <div>
                  <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                    目标人群画像
                  </p>
                  <Editable
                    as="p"
                    editing={edit}
                    value={strategy.audienceProfile}
                    onChange={(v) =>
                      editS((d) => {
                        d.audienceProfile = v;
                      })
                    }
                    className="block text-[15px] leading-7 text-foreground"
                  />
                  <En text={trS?.audienceProfile} />
                </div>
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      消费趋势
                    </p>
                    <ul className="space-y-3">
                      {strategy.trends.map((t, i) => (
                        <Bullet
                          key={`trend-${i}`}
                          title={t.title}
                          detail={t.detail}
                          en={trS?.trends?.[i]}
                          editing={edit}
                          onTitle={(v) =>
                            editS((d) => {
                              d.trends[i]!.title = v;
                            })
                          }
                          onDetail={(v) =>
                            editS((d) => {
                              d.trends[i]!.detail = v;
                            })
                          }
                        />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      竞争格局
                    </p>
                    <ul className="space-y-3">
                      {strategy.competition.map((c, i) => (
                        <Bullet
                          key={`comp-${i}`}
                          title={c.title}
                          detail={c.detail}
                          en={trS?.competition?.[i]}
                          editing={edit}
                          onTitle={(v) =>
                            editS((d) => {
                              d.competition[i]!.title = v;
                            })
                          }
                          onDetail={(v) =>
                            editS((d) => {
                              d.competition[i]!.detail = v;
                            })
                          }
                        />
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
            readOnly={readOnly}
          >
            {strategy && (
              <div className="space-y-7">
                <div className="border-l-2 border-brand pl-5">
                  <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
                    KEY INSIGHT
                  </p>
                  <Editable
                    as="p"
                    editing={edit}
                    value={strategy.keyInsight}
                    onChange={(v) =>
                      editS((d) => {
                        d.keyInsight = v;
                      })
                    }
                    className="mt-2 block font-display text-lg leading-8 font-semibold text-foreground"
                  />
                  <En text={trS?.keyInsight} />
                </div>
                <div>
                  <Editable
                    as="p"
                    editing={edit}
                    value={strategy.bigIdeaTitle}
                    onChange={(v) =>
                      editS((d) => {
                        d.bigIdeaTitle = v;
                      })
                    }
                    className="block font-display text-[26px] font-bold text-foreground"
                  />
                  <En text={trS?.bigIdeaTitle} />
                  <Editable
                    as="p"
                    editing={edit}
                    value={strategy.bigIdeaDescription}
                    onChange={(v) =>
                      editS((d) => {
                        d.bigIdeaDescription = v;
                      })
                    }
                    className="mt-2 block text-[14.5px] leading-7 text-muted-foreground"
                  />
                  <En text={trS?.bigIdeaDescription} />
                </div>
                <p className="bg-secondary px-5 py-4 text-[13.5px] leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">策略推导:</span>
                  <Editable
                    editing={edit}
                    value={strategy.strategyLogic}
                    onChange={(v) =>
                      editS((d) => {
                        d.strategyLogic = v;
                      })
                    }
                  />
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
            readOnly={readOnly}
          >
            {strategy && (
              <div>
                <p className="font-display text-2xl font-bold text-foreground">
                  「
                  <Editable
                    editing={edit}
                    value={strategy.campaignTheme}
                    onChange={(v) =>
                      editS((d) => {
                        d.campaignTheme = v;
                      })
                    }
                  />
                  」
                </p>
                <En text={trS?.campaignTheme} />
                <ol className="mt-6 space-y-0">
                  {strategy.slogans.map((s, i) => (
                    <li
                      key={`slogan-${i}`}
                      className="flex items-baseline gap-4 border-b border-dashed border-border py-3 first:border-t"
                    >
                      <span className="font-display text-sm italic text-brand">
                        0{i + 1}
                      </span>
                      <span>
                        <Editable
                          editing={edit}
                          value={s}
                          onChange={(v) =>
                            editS((d) => {
                              d.slogans[i] = v;
                            })
                          }
                          className="text-[15px] text-foreground"
                        />
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
            readOnly={readOnly}
          >
            {content && (
              <div className="space-y-9">
                {content.platforms.map((p, pi) => {
                  const imagePath = branding?.images?.[p.platform] ?? "";
                  const imageUrl = imagePath ? resolveImage(imagePath) : "";
                  return (
                    <div key={`platform-${pi}`}>
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h3 className="text-[16px] font-bold text-foreground">
                          {p.platform}
                        </h3>
                        <Editable
                          editing={edit}
                          value={p.positioning}
                          onChange={(v) =>
                            editC((d) => {
                              d.platforms[pi]!.positioning = v;
                            })
                          }
                          className="text-[12.5px] text-muted-foreground"
                        />
                      </div>
                      {trC?.platforms?.[pi] && (
                        <p className="mt-0.5 text-[12px] text-muted-foreground italic">
                          {p.platform} · {trC.platforms[pi].positioning}
                        </p>
                      )}

                      {imageUrl && (
                        <div className="mt-3">
                          <img
                            src={imageUrl}
                            alt={`${p.platform} 配图`}
                            className="max-h-64 w-auto border border-border object-contain"
                          />
                          {edit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-1 h-7 gap-1.5 text-[12.5px] text-muted-foreground"
                              onClick={() => setPlatformImage(p.platform, null)}
                            >
                              <X className="h-3.5 w-3.5" />
                              移除配图
                            </Button>
                          )}
                        </div>
                      )}

                      {edit && mediaImages.length > 0 && (
                        <div className="mt-3 border border-dashed border-border p-3">
                          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                            <ImagePlus className="h-3.5 w-3.5" />
                            从素材库为「{p.platform}」挑一张配图
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {mediaImages.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                title={m.filename}
                                onClick={() =>
                                  setPlatformImage(p.platform, m.storagePath)
                                }
                                className={`h-16 w-16 overflow-hidden border ${
                                  imagePath === m.storagePath
                                    ? "border-primary ring-2 ring-primary/30"
                                    : "border-border"
                                }`}
                              >
                                <img
                                  src={m.url}
                                  alt={m.filename}
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 space-y-3">
                        {p.items.map((it, ii) => (
                          <div
                            key={`item-${pi}-${ii}`}
                            className="border-t border-border/70 pt-3 first:border-t-0 first:pt-0"
                          >
                            <Editable
                              as="p"
                              editing={edit}
                              value={it.title}
                              onChange={(v) =>
                                editC((d) => {
                                  d.platforms[pi]!.items[ii]!.title = v;
                                })
                              }
                              className="block text-[14px] font-semibold text-foreground"
                            />
                            <Editable
                              as="p"
                              editing={edit}
                              value={it.body}
                              onChange={(v) =>
                                editC((d) => {
                                  d.platforms[pi]!.items[ii]!.body = v;
                                })
                              }
                              className="mt-1 block text-[13.5px] leading-6 text-muted-foreground"
                            />
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
                  );
                })}
              </div>
            )}
          </SectionShell>

          <SectionShell
            num="05"
            title="执行排期"
            status={groupOf("plan")}
            onRetry={() => onRetry("plan")}
            readOnly={readOnly}
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
                          key={`phase-${i}`}
                          className="border-b border-border align-top"
                        >
                          <td className="py-4 pr-4">
                            <Editable
                              as="p"
                              editing={edit}
                              value={ph.name}
                              onChange={(v) =>
                                editP((d) => {
                                  d.phases[i]!.name = v;
                                })
                              }
                              className="block font-semibold text-foreground"
                            />
                            <En text={trP?.phases?.[i]?.name} />
                            <Editable
                              as="p"
                              editing={edit}
                              value={ph.weeks}
                              onChange={(v) =>
                                editP((d) => {
                                  d.phases[i]!.weeks = v;
                                })
                              }
                              className="block text-[12px] text-muted-foreground"
                            />
                          </td>
                          <td className="py-4 pr-4 text-muted-foreground">
                            <Editable
                              editing={edit}
                              value={ph.goal}
                              onChange={(v) =>
                                editP((d) => {
                                  d.phases[i]!.goal = v;
                                })
                              }
                            />
                            <En text={trP?.phases?.[i]?.goal} />
                          </td>
                          <td className="py-4">
                            <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                              {ph.actions.map((a, ai) => (
                                <li key={`action-${i}-${ai}`}>
                                  <Editable
                                    editing={edit}
                                    value={a}
                                    onChange={(v) =>
                                      editP((d) => {
                                        d.phases[i]!.actions[ai] = v;
                                      })
                                    }
                                  />
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
                {(plan.budgetAllocation.length > 0 || edit) && (
                  <div>
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                        预算分配
                      </p>
                      {edit && (
                        <span className="text-[12px] text-muted-foreground">
                          合计占比 {Math.round(percentTotal * 10) / 10}%
                        </span>
                      )}
                    </div>
                    <table className="w-full text-left text-[13.5px]">
                      <thead>
                        <tr className="border-b-2 border-foreground text-[11px] tracking-[0.15em] text-muted-foreground">
                          <th className="w-28 pb-2.5 pr-4 font-medium">项目</th>
                          <th className="w-20 pb-2.5 pr-4 font-medium">占比</th>
                          <th className="w-36 pb-2.5 pr-4 font-medium">
                            金额估算
                          </th>
                          <th className="pb-2.5 font-medium">分配理由</th>
                          {edit && <th className="w-10 pb-2.5" />}
                        </tr>
                      </thead>
                      <tbody>
                        {plan.budgetAllocation.map((b, i) => (
                          <tr
                            key={`budget-${i}`}
                            className="border-b border-border align-top"
                          >
                            <td className="py-3.5 pr-4 font-semibold text-foreground">
                              <Editable
                                editing={edit}
                                value={b.item}
                                onChange={(v) =>
                                  editP((d) => {
                                    d.budgetAllocation[i]!.item = v;
                                  })
                                }
                              />
                              <En text={trP?.budgetAllocation?.[i]?.item} />
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              <Editable
                                editing={edit}
                                value={b.percent}
                                onChange={(v) =>
                                  editP((d) => {
                                    d.budgetAllocation[i]!.percent = v;
                                  })
                                }
                              />
                            </td>
                            <td className="py-3.5 pr-4 text-muted-foreground">
                              <Editable
                                editing={edit}
                                value={b.amount}
                                onChange={(v) =>
                                  editP((d) => {
                                    d.budgetAllocation[i]!.amount = v;
                                  })
                                }
                              />
                            </td>
                            <td className="py-3.5 text-muted-foreground">
                              <Editable
                                editing={edit}
                                value={b.rationale}
                                onChange={(v) =>
                                  editP((d) => {
                                    d.budgetAllocation[i]!.rationale = v;
                                  })
                                }
                              />
                              <En text={trP?.budgetAllocation?.[i]?.rationale} />
                            </td>
                            {edit && (
                              <td className="py-3.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  aria-label="删除这一行预算"
                                  onClick={() =>
                                    editP((d) => {
                                      d.budgetAllocation.splice(i, 1);
                                    })
                                  }
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {edit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 h-8 text-[13px]"
                        onClick={() =>
                          editP((d) => {
                            d.budgetAllocation.push({
                              item: "新增项目",
                              percent: "0%",
                              amount: "",
                              rationale: "",
                            });
                          })
                        }
                      >
                        新增一行预算
                      </Button>
                    )}
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
            readOnly={readOnly}
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
                    <tr key={`kpi-${i}`} className="border-b border-border">
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        <Editable
                          editing={edit}
                          value={k.layer}
                          onChange={(v) =>
                            editP((d) => {
                              d.kpis[i]!.layer = v;
                            })
                          }
                        />
                        <En text={trP?.kpis?.[i]?.layer} />
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        <Editable
                          editing={edit}
                          value={k.metric}
                          onChange={(v) =>
                            editP((d) => {
                              d.kpis[i]!.metric = v;
                            })
                          }
                        />
                        <En text={trP?.kpis?.[i]?.metric} />
                      </td>
                      <td className="py-3.5 text-muted-foreground">
                        <Editable
                          editing={edit}
                          value={k.target}
                          onChange={(v) =>
                            editP((d) => {
                              d.kpis[i]!.target = v;
                            })
                          }
                        />
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
            readOnly={readOnly}
          >
            {competitors && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {competitors.competitors.map((c, i) => (
                    <div
                      key={`rival-${i}`}
                      className="border border-border bg-muted/30 p-5"
                    >
                      <Editable
                        as="p"
                        editing={edit}
                        value={c.name}
                        onChange={(v) =>
                          editK((d) => {
                            d.competitors[i]!.name = v;
                          })
                        }
                        className="block font-display text-[15px] font-bold text-foreground"
                      />
                      <div className="mt-3">
                        <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                          优势
                        </p>
                        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[13px] text-foreground">
                          {c.strengths.map((s, si) => (
                            <li key={`s-${i}-${si}`}>
                              <Editable
                                editing={edit}
                                value={s}
                                onChange={(v) =>
                                  editK((d) => {
                                    d.competitors[i]!.strengths[si] = v;
                                  })
                                }
                              />
                              <En
                                text={trK?.competitors?.[i]?.strengths?.[si]}
                              />
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
                            <li key={`w-${i}-${wi}`}>
                              <Editable
                                editing={edit}
                                value={w}
                                onChange={(v) =>
                                  editK((d) => {
                                    d.competitors[i]!.weaknesses[wi] = v;
                                  })
                                }
                              />
                              <En
                                text={trK?.competitors?.[i]?.weaknesses?.[wi]}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] tracking-[0.15em] text-muted-foreground">
                          用户画像
                        </p>
                        <Editable
                          as="p"
                          editing={edit}
                          value={c.persona}
                          onChange={(v) =>
                            editK((d) => {
                              d.competitors[i]!.persona = v;
                            })
                          }
                          className="mt-1 block text-[13px] leading-5 text-muted-foreground"
                        />
                        <En text={trK?.competitors?.[i]?.persona} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-l-2 border-brand pl-5">
                  <p className="text-[11px] font-medium tracking-[0.25em] text-brand">
                    差异化定位 · DIFFERENTIATION
                  </p>
                  <Editable
                    as="p"
                    editing={edit}
                    value={competitors.differentiation}
                    onChange={(v) =>
                      editK((d) => {
                        d.differentiation = v;
                      })
                    }
                    className="mt-2 block text-[15px] leading-7 text-foreground"
                  />
                  <En text={trK?.differentiation} />
                </div>

                {sources.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.2em] text-muted-foreground">
                      资料来源 · SOURCES
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {sources.map((s) => (
                        <li key={s.url} className="text-[12.5px] leading-5">
                          <span className="text-muted-foreground">
                            {s.brand} ·{" "}
                          </span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener"
                            className="text-brand underline"
                          >
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </SectionShell>

          {/* 联系方式(发布页页尾) */}
          {hasContact && branding && (
            <div className="mt-10 border border-border bg-muted/30 p-6">
              {branding.closing && (
                <p className="text-[14.5px] leading-7 text-foreground">
                  {branding.closing}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 text-[13px] text-muted-foreground">
                {branding.companyName && (
                  <span className="font-semibold text-foreground">
                    {branding.companyName}
                  </span>
                )}
                {branding.contactName && <span>{branding.contactName}</span>}
                {branding.phone && <span>{branding.phone}</span>}
                {branding.email && <span>{branding.email}</span>}
                {branding.website && <span>{branding.website}</span>}
              </div>
            </div>
          )}

          {readOnly ? (
            <div className="pt-8">
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="h-11 rounded-none border-foreground px-8 text-[15px]"
              >
                打印 / 另存为 PDF
              </Button>
            </div>
          ) : (
            <>
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
                  网页放映:新标签页里按 ← → 翻页。
                </p>
              </div>

              {branding && onBrandingChange && onPublish && onUnpublish && (
                <PublishPanel
                  branding={branding}
                  onChange={onBrandingChange}
                  published={published}
                  slug={shareSlug}
                  busy={publishBusy}
                  canPublish={canPublish}
                  onPublish={onPublish}
                  onUnpublish={onUnpublish}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
