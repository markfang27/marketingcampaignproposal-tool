import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Check,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CASE_INDUSTRIES, CASE_LIBRARY } from "@/lib/case-library";
import { parseBriefFile, searchBrands } from "@/lib/proposal.functions";
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

const INDUSTRIES = [
  ...CASE_INDUSTRIES,
  "食品 / 餐饮",
  "服饰 / 生活方式",
  "互联网 / 软件",
  "金融 / 专业服务",
];
const CITIES = ["全国", "北京", "上海", "广州、深圳", "一二线城市", "新一线城市"];
const BUDGETS = ["50 万元以内", "50-100 万元", "100-300 万元", "300-500 万元", "500 万元以上"];
const DURATIONS = ["4 周", "6 周", "8 周", "10 周", "12 周"];

type Tab = "form" | "knowledge" | "assets";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "form", label: "填写", icon: FileText },
  { id: "knowledge", label: "知识库", icon: FolderOpen },
  { id: "assets", label: "素材库", icon: UploadCloud },
];

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.split(",")[1] ?? "" : result);
    };
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <Label className="mb-2 block text-xs font-semibold text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function BriefForm({
  onSubmit,
  initialBrief,
}: {
  onSubmit: (brief: BriefInput) => void;
  initialBrief?: BriefInput | null;
}) {
  const [brief, setBrief] = useState<BriefInput>(initialBrief ?? EMPTY_BRIEF);
  const [tab, setTab] = useState<Tab>("form");
  const [industry, setIndustry] = useState(CASE_INDUSTRIES[0] ?? "");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [brandQuery, setBrandQuery] = useState("");
  const [hits, setHits] = useState<{ name: string; note: string; url: string }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedFile, setParsedFile] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const runSearchBrands = useServerFn(searchBrands);
  const runParseFile = useServerFn(parseBriefFile);

  const set = <K extends keyof BriefInput>(name: K, value: BriefInput[K]) => {
    setActiveCaseId(null);
    setBrief((current) => ({ ...current, [name]: value }));
  };

  const selectCase = (id: string) => {
    const item = CASE_LIBRARY.find((entry) => entry.id === id);
    if (!item) return;
    setBrief(item.brief);
    setActiveCaseId(id);
    setTab("form");
  };

  const doSearch = async () => {
    const query = brandQuery.trim();
    if (!query) return;
    setSearching(true);
    setSearchError(null);
    try {
      setHits(await runSearchBrands({ data: { query, industry: brief.industry } }));
    } catch (error) {
      console.error("brand search failed", error);
      setSearchError("搜索失败，请稍后重试或直接填写竞品。 ");
    } finally {
      setSearching(false);
    }
  };

  const addCompetitor = (name: string) => {
    const names = brief.competitors.split(/[，,、]+/).map((item) => item.trim()).filter(Boolean);
    if (!names.includes(name)) set("competitors", [...names, name].join("、"));
  };

  const parseFile = async (file: File) => {
    setParsing(true);
    setParseError(null);
    setParsedFile(null);
    try {
      const parsed = await runParseFile({
        data: {
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          base64: await fileToBase64(file),
        },
      });
      setBrief((current) => ({ ...current, ...parsed }));
      setParsedFile(file.name);
      setTab("form");
    } catch (error) {
      console.error("brief parse failed", error);
      setParseError(error instanceof Error ? error.message : "解析失败，请换一个文件重试");
    } finally {
      setParsing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const ready = Boolean(
    brief.brand.trim() && brief.product.trim() && brief.audience.trim() && brief.objective.trim(),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      <section className="mb-6 grid grid-cols-3 overflow-hidden rounded-lg border border-border bg-card">
        {["完善客户信息", "生成策略内容", "导出提案文件"].map((label, index) => (
          <div
            key={label}
            className={`flex min-w-0 items-center justify-center gap-2 border-r border-border px-2 py-3 last:border-r-0 ${index === 0 ? "bg-accent" : "text-muted-foreground"}`}
          >
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {index + 1}
            </span>
            <span className="truncate text-xs font-semibold sm:text-sm">{label}</span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <header className="border-b border-border px-5 py-5 sm:px-7">
          <p className="text-xs font-semibold text-primary">CAMPAIGN WORKSPACE</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">创建营销提案</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            填写关键信息，或上传客户资料自动识别，AI 将生成七个完整提案章节。
          </p>
        </header>

        <nav className="grid grid-cols-3 border-b border-border px-3 sm:px-5" aria-label="工作区内容">
          {TABS.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant="ghost"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`h-12 rounded-none border-b-2 px-2 text-sm ${tab === item.id ? "border-primary text-primary hover:bg-transparent" : "border-transparent text-muted-foreground hover:bg-transparent hover:text-foreground"}`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>

        {tab === "form" && (
          <form
            className="p-5 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              if (ready) onSubmit(brief);
            }}
          >
            {parsedFile && (
              <div className="mb-5 flex items-center gap-2 rounded-md border border-primary/20 bg-accent px-3 py-2 text-xs text-accent-foreground">
                <Check className="h-4 w-4 text-primary" />
                已从《{parsedFile}》回填信息，请检查后生成。
              </div>
            )}

            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-foreground">基础信息</h2>
                <p className="mt-1 text-xs text-muted-foreground">带 * 的四项是生成提案的必要信息</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => selectCase(CASE_LIBRARY[0]!.id)}>
                填入示例
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="品牌名称 *">
                <Input value={brief.brand} onChange={(e) => set("brand", e.target.value)} placeholder="输入品牌名称" />
              </Field>
              <Field label="客户公司">
                <Input value={brief.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="输入客户公司全称" />
              </Field>
              <Field label="所属行业">
                <Select value={brief.industry} onValueChange={(value) => set("industry", value)}>
                  <SelectTrigger><SelectValue placeholder="选择行业" /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="目标城市">
                <Select value={brief.city} onValueChange={(value) => set("city", value)}>
                  <SelectTrigger><SelectValue placeholder="选择主要区域" /></SelectTrigger>
                  <SelectContent>{CITIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="产品 / 服务 *" wide>
                <Textarea rows={3} value={brief.product} onChange={(e) => set("product", e.target.value)} placeholder="产品特点、核心卖点、规格与价格带" />
              </Field>
              <Field label="目标人群 *" wide>
                <Textarea rows={3} value={brief.audience} onChange={(e) => set("audience", e.target.value)} placeholder="年龄、生活方式、核心需求与媒介习惯" />
              </Field>
              <Field label="营销目标 *" wide>
                <Textarea rows={3} value={brief.objective} onChange={(e) => set("objective", e.target.value)} placeholder="希望达成的认知、种草、线索或转化目标" />
              </Field>
              <Field label="预算量级">
                <Select value={brief.budget} onValueChange={(value) => set("budget", value)}>
                  <SelectTrigger><SelectValue placeholder="选择预算" /></SelectTrigger>
                  <SelectContent>{BUDGETS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="投放周期">
                <Select value={brief.duration} onValueChange={(value) => set("duration", value)}>
                  <SelectTrigger><SelectValue placeholder="选择周期" /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="总预算">
                <Input value={brief.totalBudget} onChange={(e) => set("totalBudget", e.target.value)} placeholder="例如：200 万元" />
              </Field>
              <Field label="提案语言">
                <Select value={brief.language} onValueChange={(value: BriefInput["language"]) => set("language", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">中英双语</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="mt-7 border-t border-border pt-6">
              <h2 className="font-display text-base font-semibold text-foreground">竞品分析</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <Input value={brief.competitors} onChange={(e) => set("competitors", e.target.value)} placeholder="已知竞品，用顿号分隔；留空则自动推荐" />
                <Select value={brief.research} onValueChange={(value: BriefInput["research"]) => set("research", value)}>
                  <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">公开数据检索</SelectItem>
                    <SelectItem value="ai">AI 行业推断</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <Input
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void doSearch(); } }}
                  placeholder="搜索品牌或品类，查找真实竞品"
                />
                <Button type="button" variant="outline" onClick={() => void doSearch()} disabled={searching || !brandQuery.trim()}>
                  {searching ? <Loader2 className="animate-spin" /> : <Search />}
                  <span className="hidden sm:inline">搜索</span>
                </Button>
              </div>
              {searchError && <p className="mt-2 text-xs text-destructive">{searchError}</p>}
              {hits && hits.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {hits.map((hit) => (
                    <Button key={`${hit.name}-${hit.url}`} type="button" variant="secondary" size="sm" onClick={() => addCompetitor(hit.name)} title={hit.note}>
                      <Plus />{hit.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col-reverse items-start justify-between gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">AI 会分阶段生成，失败章节可单独重试</p>
              <Button type="submit" size="lg" disabled={!ready} className="w-full sm:w-auto">
                <Sparkles />生成完整提案<ArrowRight />
              </Button>
            </div>
          </form>
        )}

        {tab === "knowledge" && (
          <div className="p-5 sm:p-7">
            <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
              <div>
                <Label className="mb-2 block text-xs font-semibold">行业分类</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CASE_INDUSTRIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
                </Select>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">选择案例后会自动填入常见客户需求，你仍可继续修改。</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {CASE_LIBRARY.filter((item) => item.industry === industry).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectCase(item.id)}
                    className={`group rounded-md border p-4 text-left transition-colors hover:border-primary ${activeCaseId === item.id ? "border-primary bg-accent" : "border-border bg-background"}`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="font-display text-sm font-semibold text-foreground">{item.brand}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-muted-foreground">{item.tagline}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "assets" && (
          <div className="p-5 sm:p-7">
            <div className="rounded-lg border border-dashed border-primary/35 bg-accent/50 px-5 py-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-card text-primary shadow-sm">
                {parsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
              </div>
              <h2 className="mt-4 font-display text-base font-semibold text-foreground">
                {parsing ? "正在读取客户资料" : "上传客户 Brief 或品牌资料"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">
                支持 PDF、Word、TXT、PNG 和 JPG，最大 10MB。解析完成后会自动回填品牌、产品、人群、预算与竞品信息。
              </p>
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void parseFile(file);
                }}
              />
              <Button type="button" className="mt-5" disabled={parsing} onClick={() => fileInput.current?.click()}>
                <UploadCloud />选择文件
              </Button>
              {parseError && <p className="mt-3 text-xs text-destructive">{parseError}</p>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}