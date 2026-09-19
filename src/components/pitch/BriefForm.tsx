import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { BriefInput } from "@/lib/proposal-schema";

const EMPTY_BRIEF: BriefInput = {
  brand: "",
  industry: "",
  product: "",
  audience: "",
  objective: "",
  budget: "",
  duration: "",
};

export const SAMPLE_BRIEF: BriefInput = {
  brand: "轻汽 Sparkle",
  industry: "饮料 / 新消费",
  product:
    "0 糖 0 卡气泡水,添加膳食纤维与电解质,主打「好喝不负担」,现有白桃、青柠、西柚三个口味,250ml 细长罐装",
  audience:
    "22-32 岁一二线城市年轻白领,注重身材管理与生活品质,习惯在小红书、抖音获取种草信息,高频购买便利店饮品",
  objective:
    "新品上市 3 个月内建立「健康快乐水」心智,提升品牌认知与电商转化",
  budget: "约 200 万元",
  duration: "8 周",
};

const FIELDS: {
  name: keyof BriefInput;
  label: string;
  placeholder: string;
  long?: boolean;
}[] = [
  { name: "brand", label: "品牌名称", placeholder: "例如:轻汽 Sparkle" },
  { name: "industry", label: "所属行业", placeholder: "例如:饮料 / 新消费" },
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
];

export function BriefForm({
  onSubmit,
}: {
  onSubmit: (brief: BriefInput) => void;
}) {
  const [brief, setBrief] = useState<BriefInput>(EMPTY_BRIEF);

  const set = (name: keyof BriefInput, value: string) =>
    setBrief((b) => ({ ...b, [name]: value }));

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
          填写客户 Brief,AI 将按代理公司提案结构,产出市场洞察、核心策略、
          传播主题、多平台内容矩阵、执行排期与 KPI 框架六个章节,
          并支持一键导出为可打印的提案文档。
        </p>
        <div className="mt-8 border-l-2 border-brand/40 pl-4">
          <p className="text-sm leading-6 text-muted-foreground">
            没有现成 Brief?点击右侧
            <span className="text-foreground">「填入示例 Brief」</span>,
            用一个新锐气泡水品牌的真实场景直接体验完整流程。
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
