const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export interface WebResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

async function call(path: string, body: unknown) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const fcKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !fcKey) throw new Error("联网检索服务未配置");

  const response = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": fcKey,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`[firecrawl] ${path} failed [${response.status}]: ${text}`);
    throw new Error(`联网检索失败 [${response.status}]: ${text}`);
  }
  return (await response.json()) as {
    success?: boolean;
    data?: unknown;
    web?: unknown;
  };
}

/** Firecrawl 网页搜索;scrape=true 时同时抓取正文,供 AI 引用真实内容 */
export async function webSearch(
  query: string,
  limit: number,
  scrape: boolean,
): Promise<WebResult[]> {
  const json = await call("/search", {
    query,
    limit,
    lang: "zh",
    country: "cn",
    ...(scrape ? { scrapeOptions: { formats: ["markdown"], onlyMainContent: true } } : {}),
  });

  const raw = json.data ?? json.web ?? [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { web?: unknown[] }).web)
      ? ((raw as { web: unknown[] }).web as unknown[])
      : [];

  return list
    .map((item) => {
      const r = item as {
        url?: string;
        title?: string;
        description?: string;
        markdown?: string;
      };
      return {
        url: r.url ?? "",
        title: r.title ?? r.url ?? "",
        description: r.description ?? "",
        markdown: (r.markdown ?? "").slice(0, 4000),
      };
    })
    .filter((r) => r.url);
}
