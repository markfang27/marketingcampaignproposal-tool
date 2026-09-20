import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  BrandingSchema,
  BriefInputSchema,
  EMPTY_BRANDING,
} from "./proposal-schema";
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

export interface PublicProposal {
  brief: BriefInput;
  strategy: StrategyResult | null;
  content: ContentResult | null;
  plan: PlanResult | null;
  competitors: CompetitorResult | null;
  sources: CompetitorSource[];
  translation: Bilingual;
  branding: ProposalBranding;
  slug: string;
  updatedAt: string;
}

const SLUG_INPUT = z.object({ slug: z.string() });

/** 按分享链接读取一份已发布的提案(无需登录)。 */
export const getPublicProposal = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => SLUG_INPUT.parse(input))
  .handler(async ({ data }): Promise<PublicProposal | null> => {
    const supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { data: row, error } = await supabase
      .from("proposals")
      .select(
        "brief, strategy, content, plan, competitors, sources, translation, branding, share_slug, updated_at",
      )
      .eq("share_slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;

    const branding = BrandingSchema.safeParse(row.branding ?? {});
    return {
      brief: BriefInputSchema.parse(row.brief),
      strategy: (row.strategy as StrategyResult | null) ?? null,
      content: (row.content as ContentResult | null) ?? null,
      plan: (row.plan as PlanResult | null) ?? null,
      competitors: (row.competitors as CompetitorResult | null) ?? null,
      sources: (row.sources as CompetitorSource[] | null) ?? [],
      translation: (row.translation as Bilingual | null) ?? {},
      branding: branding.success ? branding.data : { ...EMPTY_BRANDING },
      slug: data.slug,
      updatedAt: row.updated_at,
    };
  });
