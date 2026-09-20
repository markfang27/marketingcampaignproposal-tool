import { createFileRoute } from "@tanstack/react-router";
import { ProposalView } from "@/components/pitch/ProposalView";
import { getPublicProposal } from "@/lib/public-proposal.functions";
import type { GroupName, GroupStatus } from "@/lib/proposal-schema";

const DONE = {
  strategy: "done",
  content: "done",
  plan: "done",
  competitors: "done",
  translation: "done",
} as Record<GroupName, GroupStatus | "idle">;

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => getPublicProposal({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "提案链接已失效" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.brief.brand} · 整合传播提案`;
    const description = `${loaderData.brief.industry} 整合传播提案:市场洞察、核心策略、内容矩阵、执行排期、预算分配与竞品分析。`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => (
    <Fallback text="提案加载失败，请稍后重试或联系发送方。" />
  ),
  notFoundComponent: () => <Fallback text="该提案链接已失效。" />,
  component: PublicProposalPage,
});

function Fallback({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <p className="text-[15px] text-muted-foreground">{text}</p>
    </div>
  );
}

function PublicProposalPage() {
  const proposal = Route.useLoaderData();
  const { slug } = Route.useParams();

  if (!proposal) return <Fallback text="该提案链接已失效。" />;

  return (
    <div className="min-h-screen bg-background">
      <ProposalView
        readOnly
        brief={proposal.brief}
        strategy={proposal.strategy}
        content={proposal.content}
        plan={proposal.plan}
        competitors={proposal.competitors}
        sources={proposal.sources}
        translation={proposal.translation}
        branding={proposal.branding}
        imageSrc={(path) =>
          `/api/public/proposal-asset?slug=${encodeURIComponent(slug)}&path=${encodeURIComponent(path)}`
        }
        groupStatus={DONE}
        onRetry={() => undefined}
        onExport={() => undefined}
        onExportSlides={() => undefined}
        onExportPptx={() => undefined}
      />
    </div>
  );
}
