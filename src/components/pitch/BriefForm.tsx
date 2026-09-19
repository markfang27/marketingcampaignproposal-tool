import { useState } from "react";
import { Check, Loader2, Plus, Search, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchBrands } from "@/lib/proposal.functions";
import { CASE_INDUSTRIES, CASE_LIBRARY } from "@/lib/case-library";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BriefInput } from "@/lib/proposal-schema";

const EMPTY_BRIEF: BriefInput = {
  brand: "",
  clientName: "",
  city: "",
  industry: "",
  product: "",
  audience: "",
  objective: "",
  budget: "",
  duration: "",
  competitors: "",
  totalBudget: "",
  language: "zh",
    research: "web",
};

export const SAMPLE_BRIEF: BriefInput = CASE_LIBRARY[0]!.brief;

const FIELDS: {
  name: keyof BriefInput;
  label: string;
  placeholder: string;
  long?: boolean;
}[] = [
  { name: "brand", label: "品牌名称", placeholder: "例如:轻汽 Sparkle" },
  {
    name: "clientName",
    label: "客户名称",
    placeholder: "例如:轻汽(上海)食品有限公司",
  },
  { name: "industry", label: "所属行业", placeholder: "例如:饮料 / 新消费" },
  {
    name: "city",
    label: "目标城市",
    placeholder: "例如:上海、北京、成都",
  },
  {
    name: "product",
    label: "产品 / 服务简介",
    placeholder: "核心卖点、口味/规格、价格带等",
    long: true,
  },
  {
    name: "audience",
    label: "目标人群",
    placeholder: "年龄、城市线级、生活方式、媒介习惯",
    long: true,
  },
  {
    name: "objective",
    label: "营销诉求",
    placeholder: "希望达成什么:认知、种草、转化……",
    long: true,
  },
  { name: "budget", label: "预算量级", placeholder: "例如:约 200 万元" },
  { name: "duration", label: "投放周期", placeholder: "例如:8 周" },
  {
    name: "competitors",
    label: "主要竞品(可选)",
    placeholder: "例如:元气森林、农夫山泉汽茶,留空则由 AI 选取代表竞品",
  },
  {
    name: "totalBudget",
    label: "总预算(可选)",
    placeholder: "例如:200 万元,用于自动拆分预算分配",
  },
];

const LANGUAGES: {
  value: BriefInput["language"];
  label: string;
  desc: string;
}[] = [
  { value: "zh", label: "中文提案", desc: "全中文提案书" },
  {
    value: "en",
    label: "中英双语提案",
    desc: "生成后自动翻译为英文,中英对照,适合跨国客户",
  },
];

const RESEARCH: {
  value: BriefInput["research"];
  label: string;
  desc: string;
}[] = [
  {
    value: "web",
    label: "公开数据检索",
    desc: "先抓取竞品官网与公开报道,AI 基于原文归纳,并列出资料来源",
  },
  {
    value: "ai",
    label: "AI 推断",
    desc: "不联网,直接由 AI 依行业常识推断,速度更快",
  },
];

export function BriefForm({
  onSubmit,
}: {
  onSubmit: (brief: BriefInput) => void;
}) {
  const [brief, setBrief] = useState<BriefInput>(EMPTY_BRIEF);
  const [industry, setIndustry] = useState<string>(CASE_INDUSTRIES[0]!);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [brandQuery, setBrandQuery] = useState("");
  const [hits, setHits] = useState<
    { name: string; note: string; url: string }[] | null
  >(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const runSearchBrands = useServerFn(searchBrands);

  const doSearch = async () => {
    const q = brandQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const r = await runSearchBrands({
        data: { query: q, industry: brief.industry },
      });
      setHits(r);
    } catch (error) {
      console.error("brand search failed", error);
      setSearchError("搜索失败,请稍后重试或直接手动填写竞品名称。");
      setHits(null);
    } finally {
      setSearching(false);
    }
  };

  const addCompetitor = (name: string) => {
    setBrief((b) => {
      const list = b.competitors
        .split(/[,,、]+/)
        .map((v) => v.trim())
        .filter(Boolean);
      if (list.includes(name)) return b;
      return { ...b, competitors: [...list, name].join("、") };
    });
  };

  const set = (name: keyof BriefInput, value: string) => {
    setActiveCaseId(null);
    setBrief((b) => ({ ...b, [name]: value }));
  };

  const ready =
    brief.brand.trim() &&
    brief.product.trim() &&
    brief.audience.trim() &&
    brief.objective.trim();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 px-6 py-14 md:grid-cols-[5fr_7fr] md:gap-16">
      <div>
        <p className="font-display text-sm tracking-[0.2em] text-brand">
          STEP 1 · CLIENT BRIEF
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight font-semibold text-foreground md:text-[2.75rem]">
          把 Brief 交给 AI,
          <br />
          十分钟拿到一份
          <br />
          可提案的传播方案
        </h1>
        <p className="mt-6 text-[15px] leading-7 text-muted-foreground">
          填写客户 Brief, AI 将按代理公司提案结构,产出市场洞察、核心策略、
          传播主题、多平台内容矩阵、执行排期、预算分配、KPI 框架与竞品分析
          七个章节,并支持一键导出为可打印的提案文档。
        </p>
        <div className="mt-8 border-l-2 border-brand/40 pl-4">
          <p className="text-sm leading-6 text-muted-foreground">
            没有现成 Brief?在右侧
            <span className="text-foreground">「客户案例库」</span>
            里选一个行业与品牌,系统会自动填入该品牌常见的真实需求,
            直接体验完整提案流程。
          </p>
        </div>
      </div>

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onSubmit(brief);
        }}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-sm tracking-[0.2em] text-muted-foreground">
            CAMPAIGN BRIEF
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-[13px] text-brand hover:text-brand"
            onClick={() => setBrief(SAMPLE_BRIEF)}
          >
            填入示例 Brief
          </Button>
        </div>

        <div className="border border-dashed border-border bg-muted/30 p-4">
          <p className="text-[13px] font-medium text-foreground">客户案例库</p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            先选行业,再选品牌,自动填入该品牌常见的真实需求。
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {CASE_INDUSTRIES.map((ind) => {
              const selected = industry === ind;
              return (
                <button
                  key={ind}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setIndustry(ind)}
                  className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${
                    selected
                      ? "border-brand bg-brand/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {ind}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CASE_LIBRARY.filter((c) => c.industry === industry).map((c) => {
              const selected = activeCaseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setBrief(c.brief);
                    setActiveCaseId(c.id);
                  }}
                  className={`flex items-start gap-2 border px-3 py-2.5 text-left transition-colors ${
                    selected
                      ? "border-brand bg-brand/5"
                      : "border-border bg-background hover:border-brand/50"
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-foreground">
                      {c.brand}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                      {c.tagline}
                    </span>
                  </span>
                  {selected && <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          {FIELDS.map((f) => (
            <div
              key={f.name}
              className={f.long ? "md:col-span-2" : undefined}
            >
              <Label
                htmlFor={f.name}
                className="text-[13px] font-medium text-foreground"
              >
                {f.label}
              </Label>
              {f.long ? (
                <Textarea
                  id={f.name}
                  rows={2}
                  value={brief[f.name]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="mt-1.5 resize-none border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
                />
              ) : (
                <Input
                  id={f.name}
                  value={brief[f.name]}
                  placeholder={f.placeholder}
                  onChange={(e) => set(f.name, e.target.value)}
                  className="mt-1.5 border-0 border-b border-input bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
                />
              )}
            </div>
          ))}
        </div>


        <div className="border border-dashed border-border bg-muted/30 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <Search className="h-3.5 w-3.5 text-brand" />
            竞品品牌搜索
          </p>
          <p className="mt-1 text-[12px] leading-5 text-muted-foreground">
            搜索品牌名或品类,从公开网页找到候选竞品,点击加入上方「主要竞品」。
          </p>
          <div className="mt-3 flex gap-2">
            <Input
              value={brandQuery}
              placeholder="例如:无糖气泡水 / 元气森林"
              onChange={(e) => setBrandQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void doSearch();
                }
              }}
              className="h-9 border-0 border-b border-input bg-transparent px-0 text-[13px] shadow-none focus-visible:border-brand focus-visible:ring-0"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={searching || !brandQuery.trim()}
              onClick={() => void doSearch()}
              className="h-9 shrink-0 gap-1.5 rounded-none text-[13px]"
            >
              {searching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              搜索
            </Button>
          </div>
          {searchError && (
            <p className="mt-2 text-[12px] text-destructive">{searchError}</p>
          )}
          {hits && hits.length === 0 && !searching && (
            <p className="mt-2 text-[12px] text-muted-foreground">
              没找到结果,换个关键词试试。
            </p>
          )}
          {hits && hits.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {hits.map((h) => (
                <li key={h.url}>
                  <button
                    type="button"
                    onClick={() => addCompetitor(h.name)}
                    className="flex w-full items-start gap-2 border border-border bg-background px-3 py-2 text-left transition-colors hover:border-brand/60"
                  >
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-foreground">
                        {h.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {h.note || h.url}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            <Label className="text-[12.5px] font-medium text-foreground">
              竞品资料来源
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {RESEARCH.map((r) => {
                const selected = brief.research === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setBrief((b) => ({ ...b, research: r.value }))
                    }
                    className={`border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? "border-brand bg-brand/5"
                        : "border-border bg-background hover:border-brand/50"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground">
                      {selected && <Check className="h-3.5 w-3.5 text-brand" />}
                      {r.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground">
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          <Label className="text-[13px] font-medium text-foreground">
            提案语言
          </Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {LANGUAGES.map((l) => {
              const selected = brief.language === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setBrief((b) => ({ ...b, language: l.value }))}
                  className={`border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-brand bg-brand/5"
                      : "border-border bg-background hover:border-brand/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
                    {selected && <Check className="h-3.5 w-3.5 text-brand" />}
                    {l.label}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-4 text-muted-foreground">
                    {l.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            disabled={!ready}
            className="h-11 gap-2 rounded-none bg-foreground px-8 text-[15px] text-background hover:bg-foreground/85"
          >
            <Sparkles className="h-4 w-4" />
            生成提案
          </Button>
          {!ready && (
            <span className="text-[13px] text-muted-foreground">
              至少填写品牌、产品、人群与诉求
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
