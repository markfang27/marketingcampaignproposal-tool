import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Check,
  FileText,
  FilePlus2,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
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
import { supabase } from "@/integrations/supabase/client";
import { CASE_LIBRARY } from "@/lib/case-library";
import { CASE_INDUSTRIES } from "@/lib/case-library";
import { parseBriefFile, searchBrands } from "@/lib/proposal.functions";
import {
  addKnowledgeFile,
  addMediaAsset,
  deleteKnowledgeFile,
  deleteMediaAsset,
  listKnowledge,
  listMedia,
  updateMediaCaption,
  type KnowledgeItem,
  type MediaAsset,
} from "@/lib/library.functions";
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
  knowledge: "",
};

export const SAMPLE_BRIEF: BriefInput = CASE_LIBRARY[0]!.brief;

const INDUSTRIES = [
  ...CASE_INDUSTRIES,
  "食品 / 餐饮",
  "服饰 / 生活方式",
  "互联网 / 软件",
  "金融 / 专业服务",
];
const BUDGETS = ["50 万元以内", "50-100 万元", "100-300 万元", "300-500 万元", "500 万元以上"];
const DURATIONS = ["4 周", "6 周", "8 周", "10 周", "12 周"];
const KNOWLEDGE_CATEGORIES = ["行业资料", "市场研究", "品牌资料", "竞品资料"];
const DOC_FORMATS = ["DOC", "DOCX", "PPT", "PPTX", "XLS", "XLSX", "PDF", "TXT", "MD"];

const DOC_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,text/csv";
const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = ".mp4,.mov,.webm,.m4v,.avi,video/mp4,video/quicktime,video/webm";

type Tab = "form" | "knowledge" | "assets";

const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: "form", label: "填写", icon: FileText },
  { id: "knowledge", label: "知识库", icon: FolderOpen },
  { id: "assets", label: "素材库", icon: ImageIcon },
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

function prettySize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
  signedIn,
  onSignIn,
}: {
  onSubmit: (brief: BriefInput) => void;
  initialBrief?: BriefInput | null;
  signedIn: boolean;
  onSignIn: () => void;
}) {
  const [brief, setBrief] = useState<BriefInput>(initialBrief ?? EMPTY_BRIEF);
  const [tab, setTab] = useState<Tab>("form");
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [brandQuery, setBrandQuery] = useState("");
  const [hits, setHits] = useState<{ name: string; note: string; url: string }[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedFile, setParsedFile] = useState<string | null>(null);
  const [docs, setDocs] = useState<KnowledgeItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [category, setCategory] = useState(KNOWLEDGE_CATEGORIES[0]!);
  const [uploading, setUploading] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [mediaBusy, setMediaBusy] = useState<"image" | "video" | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const briefInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const runSearchBrands = useServerFn(searchBrands);
  const runParseFile = useServerFn(parseBriefFile);
  const runListDocs = useServerFn(listKnowledge);
  const runAddDoc = useServerFn(addKnowledgeFile);
  const runDeleteDoc = useServerFn(deleteKnowledgeFile);
  const runListMedia = useServerFn(listMedia);
  const runAddMedia = useServerFn(addMediaAsset);
  const runUpdateCaption = useServerFn(updateMediaCaption);
  const runDeleteMedia = useServerFn(deleteMediaAsset);

  useEffect(() => {
    if (!signedIn) {
      setDocs([]);
      setMedia([]);
      setUserId(null);
      return;
    }
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    void runListDocs()
      .then((list) => setDocs(list ?? []))
      .catch((error) => console.error("knowledge list failed", error));
    void runListMedia()
      .then((list) => {
        setMedia(list ?? []);
        void signPreviews(list ?? []);
      })
      .catch((error) => console.error("media list failed", error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  const signPreviews = async (items: MediaAsset[]) => {
    const entries = await Promise.all(
      items.map(async (item) => {
        const { data } = await supabase.storage
          .from("media-assets")
          .createSignedUrl(item.storagePath, 3600);
        return [item.id, data?.signedUrl ?? ""] as const;
      }),
    );
    setPreviews((current) => ({ ...current, ...Object.fromEntries(entries) }));
  };

  const set = <K extends keyof BriefInput>(name: K, value: BriefInput[K]) => {
    setActiveCaseId(null);
    setBrief((current) => ({ ...current, [name]: value }));
  };

  const applyKnowledge = (ids: string[]) => {
    setPicked(ids);
    const text = docs
      .filter((doc) => ids.includes(doc.id))
      .map((doc) => `《${doc.filename}》(${doc.category})\n${doc.summary}`)
      .join("\n\n");
    setBrief((current) => ({ ...current, knowledge: text }));
  };

  const togglePick = (id: string) =>
    applyKnowledge(picked.includes(id) ? picked.filter((v) => v !== id) : [...picked, id]);

  const selectCase = (id: string) => {
    const item = CASE_LIBRARY.find((entry) => entry.id === id);
    if (!item) return;
    setBrief({ ...item.brief, knowledge: brief.knowledge });
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
      setBrief((current) => ({ ...current, ...parsed, knowledge: current.knowledge }));
      setParsedFile(file.name);
    } catch (error) {
      console.error("brief parse failed", error);
      setParseError(error instanceof Error ? error.message : "解析失败，请换一个文件重试");
    } finally {
      setParsing(false);
      if (briefInput.current) briefInput.current.value = "";
    }
  };

  const uploadDoc = async (file: File) => {
    setUploading(file.name);
    setDocError(null);
    try {
      const item = await runAddDoc({
        data: {
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          base64: await fileToBase64(file),
          category,
        },
      });
      setDocs((current) => [item, ...current]);
    } catch (error) {
      console.error("knowledge upload failed", error);
      setDocError(error instanceof Error ? error.message : "资料读取失败，请换一个文件重试");
    } finally {
      setUploading(null);
      if (docInput.current) docInput.current.value = "";
    }
  };

  const removeDoc = async (id: string) => {
    try {
      await runDeleteDoc({ data: { id } });
      setDocs((current) => current.filter((doc) => doc.id !== id));
      applyKnowledge(picked.filter((v) => v !== id));
    } catch (error) {
      console.error("knowledge delete failed", error);
      setDocError("删除失败，请稍后重试");
    }
  };

  const uploadMedia = async (kind: "image" | "video", file: File) => {
    if (!userId) return;
    const limit = kind === "image" ? 20 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > limit) {
      setMediaError(kind === "image" ? "单张图片不能超过 20MB" : "单个视频不能超过 500MB");
      return;
    }
    setMediaBusy(kind);
    setMediaError(null);
    try {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${userId}/${kind}/${Date.now()}-${safe}`;
      const upload = await supabase.storage
        .from("media-assets")
        .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upload.error) throw upload.error;
      const item = await runAddMedia({
        data: {
          kind,
          filename: file.name,
          storagePath: path,
          caption: "",
          sizeBytes: file.size,
        },
      });
      setMedia((current) => [item, ...current]);
      void signPreviews([item]);
    } catch (error) {
      console.error("media upload failed", error);
      setMediaError("上传失败，请稍后重试");
    } finally {
      setMediaBusy(null);
      if (imageInput.current) imageInput.current.value = "";
      if (videoInput.current) videoInput.current.value = "";
    }
  };

  const saveCaption = (id: string, caption: string) => {
    setMedia((current) => current.map((item) => (item.id === id ? { ...item, caption } : item)));
    void runUpdateCaption({ data: { id, caption } }).catch((error) =>
      console.error("caption save failed", error),
    );
  };

  const removeMedia = async (id: string) => {
    try {
      await runDeleteMedia({ data: { id } });
      setMedia((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      console.error("media delete failed", error);
      setMediaError("删除失败，请稍后重试");
    }
  };

  const ready = Boolean(
    brief.brand.trim() && brief.product.trim() && brief.audience.trim() && brief.objective.trim(),
  );

  const images = media.filter((item) => item.kind === "image");
  const videos = media.filter((item) => item.kind === "video");

  const signInPanel = (title: string, desc?: string) => (
    <div className="rounded-lg border border-dashed border-border px-5 py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
      {desc && <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">{desc}</p>}
      <Button type="button" className="mt-5" onClick={onSignIn}>去登录</Button>
    </div>
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

            {picked.length > 0 && (
              <div className="mb-5 flex items-center gap-2 rounded-md border border-primary/20 bg-accent px-3 py-2 text-xs text-accent-foreground">
                <FolderOpen className="h-4 w-4 text-primary" />
                本次提案将参考知识库中 {picked.length} 份资料。
              </div>
            )}

            <div className="mb-6 grid gap-3 rounded-md border border-border bg-background p-4 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">示例案例</h2>
                <p className="mt-1 text-xs text-muted-foreground">选一个示例快速填满表单，再改成你的客户信息</p>
                <Select value={activeCaseId ?? ""} onValueChange={selectCase}>
                  <SelectTrigger className="mt-3"><SelectValue placeholder="选择示例案例" /></SelectTrigger>
                  <SelectContent>
                    {CASE_LIBRARY.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.brand} · {item.industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">上传客户 Brief</h2>
                <p className="mt-1 text-xs text-muted-foreground">PDF、Word、TXT 或截图，自动识别并回填</p>
                <input
                  ref={briefInput}
                  type="file"
                  className="hidden"
                  accept={`${DOC_ACCEPT},.png,.jpg,.jpeg,image/png,image/jpeg`}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void parseFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  disabled={parsing}
                  onClick={() => briefInput.current?.click()}
                >
                  {parsing ? <Loader2 className="animate-spin" /> : <FilePlus2 />}
                  {parsing ? "正在识别…" : "选择文件自动识别"}
                </Button>
                {parseError && <p className="mt-2 text-xs text-destructive">{parseError}</p>}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-display text-base font-semibold text-foreground">基础信息</h2>
              <p className="mt-1 text-xs text-muted-foreground">带 * 的四项是生成提案的必要信息</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="品牌名称 *">
                <Input value={brief.brand} onChange={(e) => set("brand", e.target.value)} placeholder="输入品牌名称" />
              </Field>
              <Field label="客户公司">
                <Input value={brief.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="输入客户公司全称" />
              </Field>
              <Field label="所属行业">
                <Select
                  value={!brief.industry ? "" : INDUSTRIES.includes(brief.industry) ? brief.industry : "其他"}
                  onValueChange={(value) => set("industry", value === "其他" ? " " : value)}
                >
                  <SelectTrigger><SelectValue placeholder="选择行业" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
                    <SelectItem value="其他">其他（自定义填写）</SelectItem>
                  </SelectContent>
                </Select>
                {!INDUSTRIES.includes(brief.industry) && brief.industry !== "" && (
                  <Input
                    className="mt-2"
                    value={brief.industry.trim()}
                    onChange={(e) => set("industry", e.target.value)}
                    placeholder="填写具体行业，例如：宠物用品、户外装备"
                  />
                )}
              </Field>
              <Field label="目标城市">
                <Input
                  value={brief.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="填写城市，如：成都、杭州，或全国"
                />
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
                <Input value={brief.budget} onChange={(e) => set("budget", e.target.value)} placeholder="例如：100-300 万元，或 80 万元左右" />
              </Field>
              <Field label="投放周期">
                <Input value={brief.duration} onChange={(e) => set("duration", e.target.value)} placeholder="例如：8 周，或 618 大促前 45 天" />
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
            {!signedIn ? (
              signInPanel("登录后即可建立你自己的知识库")
            ) : (
              <div className="rounded-lg border border-border bg-background p-5">
                <div className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4 text-foreground" />
                  <h2 className="font-display text-base font-semibold text-foreground">上传文件</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  仅支持文档类文件，用于丰富企业知识库：行业信息、市场研究、企业与品牌资料
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {KNOWLEDGE_CATEGORIES.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={category === value ? "default" : "secondary"}
                      size="sm"
                      aria-pressed={category === value}
                      onClick={() => setCategory(value)}
                    >
                      {value}
                    </Button>
                  ))}
                </div>

                <input
                  ref={docInput}
                  type="file"
                  className="hidden"
                  accept={DOC_ACCEPT}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadDoc(file);
                  }}
                />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => docInput.current?.click()}
                  onKeyDown={(event) => { if (event.key === "Enter") docInput.current?.click(); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) void uploadDoc(file);
                  }}
                  className="mt-4 cursor-pointer rounded-lg border border-dashed border-border px-5 py-10 text-center transition-colors hover:border-primary"
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FilePlus2 className="h-5 w-5" />}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {uploading ? `正在读取《${uploading}》` : "点击或拖拽文件到此处上传"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">仅支持文档类文件，单个不超过 10MB</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {DOC_FORMATS.map((value) => (
                    <span key={value} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                      {value}
                    </span>
                  ))}
                </div>

                {docError && <p className="mt-3 text-xs text-destructive">{docError}</p>}

                <div className="mt-6 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left">
                    <thead>
                      <tr className="border-b border-border text-xs font-semibold text-foreground">
                        <th className="py-2 pr-3">文件名</th>
                        <th className="py-2 pr-3">大小</th>
                        <th className="py-2 pr-3">状态</th>
                        <th className="py-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-xs text-muted-foreground">
                            暂无上传文件
                          </td>
                        </tr>
                      ) : (
                        docs.map((doc) => (
                          <tr key={doc.id} className="border-b border-border align-top">
                            <td className="py-3 pr-3">
                              <label className="flex cursor-pointer items-start gap-2">
                                <input
                                  type="checkbox"
                                  className="mt-1 h-4 w-4"
                                  checked={picked.includes(doc.id)}
                                  onChange={() => togglePick(doc.id)}
                                />
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-semibold text-foreground">{doc.filename}</span>
                                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{doc.category}</span>
                                  <span className="mt-2 block max-w-md whitespace-pre-line text-[11px] leading-5 text-muted-foreground">
                                    {doc.summary}
                                  </span>
                                </span>
                              </label>
                            </td>
                            <td className="py-3 pr-3 text-xs text-muted-foreground">{prettySize(doc.sizeBytes)}</td>
                            <td className="py-3 pr-3 text-xs">
                              <span className={picked.includes(doc.id) ? "text-primary" : "text-muted-foreground"}>
                                {picked.includes(doc.id) ? "本次提案参考" : "已解析"}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`删除 ${doc.filename}`}
                                onClick={() => void removeDoc(doc.id)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "assets" && (
          <div className="p-5 sm:p-7">
            {!signedIn ? (
              signInPanel("登录后即可上传素材")
            ) : (
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                {mediaError && <p className="px-5 pt-4 text-xs text-destructive">{mediaError}</p>}

                <div className="border-b border-border p-5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-foreground" />
                    <h2 className="font-display text-base font-semibold text-foreground">图片素材</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{images.length} 张</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">上传图片素材，仅用于生成图文；可为每张素材补一句文案</p>

                  <input
                    ref={imageInput}
                    type="file"
                    className="hidden"
                    accept={IMAGE_ACCEPT}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMedia("image", file);
                    }}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => imageInput.current?.click()}
                      className="grid aspect-square place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="grid place-items-center gap-2">
                        {mediaBusy === "image" ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                        上传图片
                      </span>
                    </button>
                    {images.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-2">
                        <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                          {previews[item.id] ? (
                            <img src={previews[item.id]} alt={item.filename} className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[11px] text-muted-foreground">加载中…</span>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            aria-label={`删除 ${item.filename}`}
                            onClick={() => void removeMedia(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input
                          className="mt-2 h-8 text-xs"
                          defaultValue={item.caption}
                          placeholder="素材文案"
                          onBlur={(event) => saveCaption(item.id, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">支持 JPG / PNG / WEBP / GIF，单张不超过 20MB</p>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-foreground" />
                    <h2 className="font-display text-base font-semibold text-foreground">视频素材</h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{videos.length} 个</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">上传视频素材，仅用于生成视频内容</p>

                  <input
                    ref={videoInput}
                    type="file"
                    className="hidden"
                    accept={VIDEO_ACCEPT}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadMedia("video", file);
                    }}
                  />
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => videoInput.current?.click()}
                      className="grid aspect-video place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="grid place-items-center gap-2">
                        {mediaBusy === "video" ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                        上传视频
                      </span>
                    </button>
                    {videos.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-2">
                        <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                          {previews[item.id] ? (
                            <video src={previews[item.id]} controls className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[11px] text-muted-foreground">加载中…</span>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7"
                            aria-label={`删除 ${item.filename}`}
                            onClick={() => void removeMedia(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <Input
                          className="mt-2 h-8 text-xs"
                          defaultValue={item.caption}
                          placeholder="素材文案"
                          onBlur={(event) => saveCaption(item.id, event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">支持 MP4 / MOV / WebM / M4V / AVI，单个不超过 500MB</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
