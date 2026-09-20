import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * 已发布提案页里的配图代理:
 * 只放行该提案 branding.images 中引用的素材路径,其他请求一律 404。
 */
export const Route = createFileRoute("/api/public/proposal-asset")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug") ?? "";
        const path = url.searchParams.get("path") ?? "";
        if (!slug || !path) return new Response("Not found", { status: 404 });

        const publicClient = createClient<Database>(
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
        const { data: row } = await publicClient
          .from("proposals")
          .select("branding")
          .eq("share_slug", slug)
          .eq("published", true)
          .maybeSingle();

        const images =
          ((row?.branding as { images?: Record<string, string> } | null)
            ?.images ?? {}) as Record<string, string>;
        const allowed = Object.values(images).includes(path);
        const isLogo = (row?.branding as { logoPath?: string } | null)?.logoPath === path;
        if (!row || (!allowed && !isLogo)) {
          return new Response("Not found", { status: 404 });
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: file, error } = await supabaseAdmin.storage
          .from("media-assets")
          .download(path);
        if (error || !file) return new Response("Not found", { status: 404 });

        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        return new Response(await file.arrayBuffer(), {
          headers: {
            "content-type": TYPES[ext] ?? "application/octet-stream",
            "cache-control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
