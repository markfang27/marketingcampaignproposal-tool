import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const MODEL_ID = "openai/gpt-6-astra";

const PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

function buildModel() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI 服务未配置,请联系管理员");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });
  return lovable.responses(MODEL_ID);
}

/** 从上传的行业/市场资料中取出纯文本(文本、Markdown、CSV、Word)。 */
export async function extractFileText(
  filename: string,
  mediaType: string,
  bytes: Buffer,
): Promise<string> {
  if (mediaType.startsWith("text/") || /\.(txt|md|csv)$/i.test(filename)) {
    return bytes.toString("utf8");
  }
  if (
    mediaType.includes("wordprocessingml") ||
    /\.docx$/i.test(filename)
  ) {
    const mammoth = await import("mammoth");
    const parsed = await mammoth.extractRawText({ buffer: bytes });
    return parsed.value;
  }
  return "";
}

const SUMMARY_SYSTEM =
  "你是广告代理公司的行业研究员。请把客户提供的行业或市场资料压缩成提案可直接引用的要点,只保留资料中真实存在的信息,不要编造数据。";

/** 把资料压缩成 200 字以内的要点摘要,用于后续提案生成时作为背景资料。 */
export async function summarizeKnowledge(
  filename: string,
  text: string,
  bytes: Buffer,
  mediaType: string,
  base64: string,
): Promise<string> {
  const instruction = `请阅读《${filename}》,用中文输出 6 条以内的要点(每条 40 字以内,可含资料中的具体数据、人群特征、渠道与趋势),用「· 」开头分行输出,不要加标题和结语。`;

  const content = text.trim()
    ? `${instruction}\n\n资料正文:\n${text.slice(0, 30000)}`
    : [
        { type: "text" as const, text: instruction },
        mediaType.startsWith("image/")
          ? {
              type: "image" as const,
              image: `data:${mediaType};base64,${base64}`,
            }
          : {
              type: "file" as const,
              data: bytes,
              mediaType: mediaType || "application/pdf",
              filename,
            },
      ];

  const result = streamText({
    model: buildModel(),
    system: SUMMARY_SYSTEM,
    messages: [{ role: "user", content }],
    providerOptions: PROVIDER_OPTIONS,
  });

  const summary = (await result.text).trim();
  if (!summary) throw new Error("没有读出可用内容,请换一个文件重试");
  return summary.slice(0, 2000);
}
