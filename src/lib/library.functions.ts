import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BrandingSchema, BriefInputSchema, EMPTY_BRANDING } from "./proposal-schema";
import type {
  Bilingual,
  BriefInput,
  CompetitorResult,
  CompetitorSource,
  ContentResult,
  PlanResult,
  ProposalBranding,
  StrategyResult,
} from "./proposal-schema";

export interface ProposalSummary {
  id: string;
  brand: string;
  industry: string;
  createdAt: string;
}

export interface SavedProposal extends ProposalSummary {
  brief: BriefInput;
  strategy: StrategyResult | null;
  content: ContentResult | null;
  plan: PlanResult | null;
  competitors: CompetitorResult | null;
  sources: CompetitorSource[];
  translation: Bilingual;
  branding: ProposalBranding;
  published: boolean;
  shareSlug: string | null;
}

export interface KnowledgeItem {
  id: string;
  filename: string;
  category: string;
  summary: string;
  sizeBytes: number;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  kind: "image" | "video";
  filename: string;
  storagePath: string;
  caption: string;
  sizeBytes: number;
  createdAt: string;
}

const ID_INPUT = z.object({ id: z.string() });

const SAVE_INPUT = z.object({
  id: z.string().optional(),
  brief: BriefInputSchema,
  strategy: z.unknown().nullable(),
  content: z.unknown().nullable(),
  plan: z.unknown().nullable(),
  competitors: z.unknown().nullable(),
  sources: z.unknown(),
  translation: z.unknown(),
});

const FILE_INPUT = z.object({
  filename: z.string(),
  mediaType: z.string(),
  base64: z.string(),
  category: z.string().default("行业资料"),
});

/** 当前用户的提案记录列表(最新在前)。 */
export const listProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProposalSummary[]> => {
    const { data, error } = await context.supabase
      .from("proposals")
      .select("id, brand, industry, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      brand: row.brand,
      industry: row.industry,
      createdAt: row.created_at,
    }));
  });

/** 读取一份已保存的完整提案。 */
export const getProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ID_INPUT.parse(input))
  .handler(async ({ context, data }): Promise<SavedProposal> => {
    const { data: row, error } = await context.supabase
      .from("proposals")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("没有找到这份提案,可能已被删除");
    return {
      id: row.id,
      brand: row.brand,
      industry: row.industry,
      createdAt: row.created_at,
      brief: BriefInputSchema.parse(row.brief),
      strategy: (row.strategy as StrategyResult | null) ?? null,
      content: (row.content as ContentResult | null) ?? null,
      plan: (row.plan as PlanResult | null) ?? null,
      competitors: (row.competitors as CompetitorResult | null) ?? null,
      sources: (row.sources as CompetitorSource[] | null) ?? [],
      translation: (row.translation as Bilingual | null) ?? {},
      branding: parseBranding(row.branding),
      published: Boolean(row.published),
      shareSlug: row.share_slug ?? null,
    };
  });

/** 保存(或更新)一份提案到当前用户的历史记录。 */
export const saveProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SAVE_INPUT.parse(input))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const payload = {
      brand: data.brief.brand,
      industry: data.brief.industry || "未分类",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      brief: data.brief as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      strategy: (data.strategy ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      content: (data.content ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      plan: (data.plan ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      competitors: (data.competitors ?? null) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sources: (data.sources ?? []) as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      translation: (data.translation ?? {}) as any,
      updated_at: new Date().toISOString(),
    };

    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("proposals")
        .update(payload)
        .eq("id", data.id)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { id: row.id };
    }

    const { data: row, error } = await context.supabase
      .from("proposals")
      .insert({ user_id: context.userId, ...payload })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

const PUBLISH_INPUT = z.object({
  id: z.string(),
  branding: BrandingSchema,
});

function parseBranding(value: unknown): ProposalBranding {
  const parsed = BrandingSchema.safeParse(value ?? {});
  return parsed.success ? parsed.data : { ...EMPTY_BRANDING };
}

function makeSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/** 发布(或更新)提案的对外分享页面,返回分享链接的 slug。 */
export const publishProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PUBLISH_INPUT.parse(input))
  .handler(async ({ context, data }): Promise<{ slug: string }> => {
    const { data: existing, error: readError } = await context.supabase
      .from("proposals")
      .select("share_slug")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!existing) throw new Error("没有找到这份提案");

    const slug = existing.share_slug ?? makeSlug();
    const { error } = await context.supabase
      .from("proposals")
      .update({
        share_slug: slug,
        published: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        branding: data.branding as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { slug };
  });

/** 取消发布:分享链接立即失效。 */
export const unpublishProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ID_INPUT.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("proposals")
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** 素材库图片的临时预览地址(编辑提案时挑图用)。 */
export const listMediaImageUrls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ id: string; filename: string; url: string }[]> => {
      const { data, error } = await context.supabase
        .from("media_assets")
        .select("id, filename, storage_path")
        .eq("kind", "image")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw new Error(error.message);
      const rows = data ?? [];
      const out: { id: string; filename: string; url: string }[] = [];
      for (const row of rows) {
        const { data: signed } = await context.supabase.storage
          .from("media-assets")
          .createSignedUrl(row.storage_path, 60 * 60);
        if (signed?.signedUrl) {
          out.push({
            id: row.id,
            filename: row.filename,
            url: signed.signedUrl,
          });
        }
      }
      return out;
    },
  );

/** 删除当前用户的一条提案记录。 */
export const deleteProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ID_INPUT.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("proposals")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** 当前用户知识库中的行业/市场资料。 */
export const listKnowledge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<KnowledgeItem[]> => {
    const { data, error } = await context.supabase
      .from("knowledge_files")
      .select("id, filename, category, summary, size_bytes, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      filename: row.filename,
      category: row.category,
      summary: row.summary,
      sizeBytes: Number(row.size_bytes ?? 0),
      createdAt: row.created_at,
    }));
  });

/** 上传行业/市场资料:提取文本并压缩成要点后入库。 */
export const addKnowledgeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => FILE_INPUT.parse(input))
  .handler(async ({ context, data }): Promise<KnowledgeItem> => {
    const bytes = Buffer.from(data.base64, "base64");
    if (!bytes.length) throw new Error("文件内容为空,请重新上传");
    if (bytes.length > 10 * 1024 * 1024) throw new Error("文件不能超过 10MB");

    const { extractFileText, summarizeKnowledge } = await import(
      "./knowledge.server"
    );
    const text = await extractFileText(data.filename, data.mediaType, bytes);
    const summary = await summarizeKnowledge(
      data.filename,
      text,
      bytes,
      data.mediaType,
      data.base64,
    );

    const { data: row, error } = await context.supabase
      .from("knowledge_files")
      .insert({
        user_id: context.userId,
        filename: data.filename.slice(0, 200),
        category: data.category,
        summary,
        excerpt: text.slice(0, 8000),
        size_bytes: bytes.length,
      })
      .select("id, filename, category, summary, size_bytes, created_at")
      .single();
    if (error) throw new Error(error.message);

    return {
      id: row.id,
      filename: row.filename,
      category: row.category,
      summary: row.summary,
      sizeBytes: Number(row.size_bytes ?? 0),
      createdAt: row.created_at,
    };
  });

const MEDIA_INPUT = z.object({
  kind: z.enum(["image", "video"]),
  filename: z.string(),
  storagePath: z.string(),
  caption: z.string().default(""),
  sizeBytes: z.number(),
});

const CAPTION_INPUT = z.object({ id: z.string(), caption: z.string() });

/** 当前用户素材库中的图片与视频素材。 */
export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MediaAsset[]> => {
    const { data, error } = await context.supabase
      .from("media_assets")
      .select("id, kind, filename, storage_path, caption, size_bytes, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind === "video" ? "video" : "image",
      filename: row.filename,
      storagePath: row.storage_path,
      caption: row.caption,
      sizeBytes: Number(row.size_bytes ?? 0),
      createdAt: row.created_at,
    }));
  });

/** 文件上传到存储后,登记一条素材记录。 */
export const addMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MEDIA_INPUT.parse(input))
  .handler(async ({ context, data }): Promise<MediaAsset> => {
    if (!data.storagePath.startsWith(`${context.userId}/`)) {
      throw new Error("素材路径无效");
    }
    const { data: row, error } = await context.supabase
      .from("media_assets")
      .insert({
        user_id: context.userId,
        kind: data.kind,
        filename: data.filename.slice(0, 200),
        storage_path: data.storagePath,
        caption: data.caption.slice(0, 500),
        size_bytes: data.sizeBytes,
      })
      .select("id, kind, filename, storage_path, caption, size_bytes, created_at")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id,
      kind: row.kind === "video" ? "video" : "image",
      filename: row.filename,
      storagePath: row.storage_path,
      caption: row.caption,
      sizeBytes: Number(row.size_bytes ?? 0),
      createdAt: row.created_at,
    };
  });

/** 修改素材文案。 */
export const updateMediaCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CAPTION_INPUT.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("media_assets")
      .update({ caption: data.caption.slice(0, 500) })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** 删除素材记录与已上传的文件。 */
export const deleteMediaAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ID_INPUT.parse(input))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase
      .from("media_assets")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await context.supabase.storage
        .from("media-assets")
        .remove([row.storage_path]);
    }
    const { error } = await context.supabase
      .from("media_assets")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** 从知识库删除一份资料。 */
export const deleteKnowledgeFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ID_INPUT.parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("knowledge_files")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
