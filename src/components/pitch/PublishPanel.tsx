import { useState } from "react";
import { Check, Copy, Globe, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProposalBranding } from "@/lib/proposal-schema";

interface Props {
  branding: ProposalBranding;
  onChange: (next: ProposalBranding) => void;
  published: boolean;
  slug: string | null;
  busy: boolean;
  canPublish: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
}

const FIELDS: { key: keyof ProposalBranding; label: string; ph: string }[] = [
  { key: "companyName", label: "企业名称", ph: "如:星澜整合营销" },
  { key: "contactName", label: "联系人", ph: "如:李明 / 客户总监" },
  { key: "phone", label: "联系电话", ph: "如:138 0000 0000" },
  { key: "email", label: "邮箱", ph: "如:hello@company.com" },
  { key: "website", label: "网址 / 微信", ph: "如:www.company.com" },
  { key: "closing", label: "致谢语", ph: "如:感谢信任,期待与您一同上线这一季。" },
];

export function PublishPanel({
  branding,
  onChange,
  published,
  slug,
  busy,
  canPublish,
  onPublish,
  onUnpublish,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState("");

  const shareUrl =
    slug && typeof window !== "undefined"
      ? `${window.location.origin}/p/${slug}`
      : "";

  const set = (key: keyof ProposalBranding, value: string) =>
    onChange({ ...branding, [key]: value });

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 500 * 1024) {
      setLogoError("LOGO 请控制在 500KB 以内");
      return;
    }
    setLogoError("");
    const reader = new FileReader();
    reader.onload = () => onChange({ ...branding, logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-10 border border-border bg-muted/30 p-6">
      <p className="font-display text-[11px] tracking-[0.25em] text-brand">
        SHARE · 发布给客户
      </p>
      <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
        填好企业信息后发布，会生成一个客户无需登录就能打开的提案页面，页面顶部是你的
        LOGO，页尾是联系方式。
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className={f.key === "closing" ? "sm:col-span-2" : ""}>
            <Label className="text-[12.5px]">{f.label}</Label>
            <Input
              className="mt-1.5"
              value={String(branding[f.key] ?? "")}
              placeholder={f.ph}
              onChange={(e) => set(f.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {branding.logoDataUrl ? (
          <img
            src={branding.logoDataUrl}
            alt="企业 LOGO"
            className="h-12 w-auto max-w-[180px] object-contain"
          />
        ) : null}
        <label className="inline-flex cursor-pointer items-center gap-2 border border-border bg-background px-4 py-2 text-[13px] text-foreground hover:bg-secondary">
          <Upload className="h-3.5 w-3.5" />
          {branding.logoDataUrl ? "更换 LOGO" : "上传企业 LOGO"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => pickLogo(e.target.files?.[0])}
          />
        </label>
        {branding.logoDataUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[13px] text-muted-foreground"
            onClick={() => onChange({ ...branding, logoDataUrl: "" })}
          >
            移除 LOGO
          </Button>
        )}
        {logoError && (
          <span className="text-[12.5px] text-destructive">{logoError}</span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          onClick={onPublish}
          disabled={!canPublish || busy}
          className="h-10 gap-2 rounded-none bg-foreground px-6 text-[14px] text-background hover:bg-foreground/85"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
          {published ? "更新发布内容" : "发布给客户"}
        </Button>
        {published && (
          <Button
            variant="outline"
            onClick={onUnpublish}
            disabled={busy}
            className="h-10 rounded-none px-6 text-[14px]"
          >
            取消发布
          </Button>
        )}
      </div>

      {published && shareUrl && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-border bg-background px-4 py-3">
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener"
            className="text-[13px] break-all text-brand underline"
          >
            {shareUrl}
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[12.5px]"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "已复制" : "复制链接"}
          </Button>
        </div>
      )}
      {!canPublish && (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          等提案全部章节生成完成并保存后即可发布。
        </p>
      )}
    </div>
  );
}
