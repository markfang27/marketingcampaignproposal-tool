import { buildDeck, deckFileName, type DeckInput, type Slide } from "./slides";

// 提案 PPT 模板配色(与提案页视觉一致)
const INK = "1A1A1A";
const BRAND = "C8452E";
const MUTED = "6B6B6B";
const LIGHT = "F4F1EC";
const FONT = "Microsoft YaHei";

/** 在浏览器端生成 .pptx 并触发下载 */
export async function downloadPptx(input: DeckInput) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const deck = buildDeck(input);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 inch
  pptx.author = "Pitch Copilot";
  pptx.title = deckFileName(input.brief);

  deck.forEach((s, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: s.kind === "content" ? "FFFFFF" : LIGHT };

    if (s.kind === "cover") {
      slide.addShape("rect", {
        x: 0.7, y: 2.1, w: 0.9, h: 0.06, fill: { color: BRAND },
      });
      slide.addText(s.title, {
        x: 0.7, y: 2.35, w: 8.6, h: 1.0,
        fontSize: 34, bold: true, color: INK, fontFace: FONT,
      });
      if (s.titleEn) {
        slide.addText(s.titleEn, {
          x: 0.7, y: 3.3, w: 8.6, h: 0.5,
          fontSize: 16, italic: true, color: MUTED, fontFace: FONT,
        });
      }
      if (s.subtitle) {
        slide.addText(s.subtitle, {
          x: 0.7, y: 3.85, w: 8.6, h: 0.5,
          fontSize: 13, color: MUTED, fontFace: FONT,
        });
      }
      return;
    }

    if (s.kind === "section") {
      slide.addText(s.num ?? "", {
        x: 0.7, y: 1.9, w: 3, h: 0.9,
        fontSize: 52, italic: true, color: BRAND, fontFace: FONT,
      });
      slide.addText(s.title, {
        x: 0.7, y: 2.85, w: 8.6, h: 0.8,
        fontSize: 30, bold: true, color: INK, fontFace: FONT,
      });
      if (s.titleEn) {
        slide.addText(s.titleEn, {
          x: 0.7, y: 3.6, w: 8.6, h: 0.5,
          fontSize: 14, italic: true, color: MUTED, fontFace: FONT,
        });
      }
      return;
    }

    // 内容页:页眉 + 标题 + 正文
    slide.addText(`${s.num ?? ""}`, {
      x: 0.6, y: 0.33, w: 1, h: 0.3,
      fontSize: 12, italic: true, color: BRAND, fontFace: FONT,
    });
    slide.addText(s.title, {
      x: 1.1, y: 0.3, w: 8.3, h: 0.45,
      fontSize: 22, bold: true, color: INK, fontFace: FONT,
    });
    slide.addShape("rect", {
      x: 0.6, y: 0.88, w: 8.8, h: 0.012, fill: { color: "DDD8D0" },
    });

    let y = 1.05;
    if (s.titleEn) {
      slide.addText(s.titleEn, {
        x: 0.6, y, w: 8.8, h: 0.3,
        fontSize: 12, italic: true, color: MUTED, fontFace: FONT,
      });
      y += 0.32;
    }
    if (s.lead) {
      slide.addText(s.lead, {
        x: 0.6, y, w: 8.8, h: 0.8,
        fontSize: 14, color: INK, fontFace: FONT, valign: "top",
      });
      y += 0.85;
      if (s.leadEn) {
        slide.addText(s.leadEn, {
          x: 0.6, y, w: 8.8, h: 0.6,
          fontSize: 11, italic: true, color: MUTED, fontFace: FONT, valign: "top",
        });
        y += 0.6;
      }
    }

    if (s.columns?.length) {
      const w = 8.8 / s.columns.length;
      s.columns.forEach((c, i) => {
        slide.addText(c.label, {
          x: 0.6 + i * w, y, w, h: 0.3,
          fontSize: 10.5, color: MUTED, fontFace: FONT,
        });
        slide.addText(c.value, {
          x: 0.6 + i * w, y: y + 0.3, w: w - 0.2, h: 0.6,
          fontSize: 15, bold: true, color: INK, fontFace: FONT, valign: "top",
        });
      });
      y += 1.0;
    }

    if (s.bullets?.length) {
      const lines = s.bullets.flatMap((b) => {
        const head = [b.title, b.body].filter(Boolean).join(" — ");
        const rows = [
          { text: head, options: { fontSize: 13, color: INK, bold: !b.body, bullet: true, fontFace: FONT, paraSpaceAfter: 3, breakLine: true } },
        ];
        if (b.en) {
          rows.push({
            text: b.en,
            options: { fontSize: 10.5, color: MUTED, bold: false, bullet: false, fontFace: FONT, paraSpaceAfter: 7, breakLine: true },
          });
        }
        return rows;
      });
      slide.addText(lines, {
        x: 0.6, y, w: 8.8, h: 4.3 - y, valign: "top",
      });
    }

    if (s.table) {
      slide.addTable(
        [
          s.table.head.map((h) => ({
            text: h,
            options: { bold: true, color: "FFFFFF", fill: { color: INK }, fontSize: 11, fontFace: FONT },
          })),
          ...s.table.rows.map((r) =>
            r.map((cell) => ({
              text: cell,
              options: { color: INK, fontSize: 11, fontFace: FONT },
            })),
          ),
        ],
        {
          x: 0.6, y, w: 8.8,
          border: { type: "solid", color: "DDD8D0", pt: 0.5 },
          rowH: 0.35,
          valign: "middle",
        },
      );
    }

    // 页脚
    slide.addText(
      `${input.brief.brand} · 整合传播提案    ${index + 1} / ${deck.length}`,
      {
        x: 0.6, y: 5.05, w: 8.8, h: 0.3,
        fontSize: 9, color: MUTED, fontFace: FONT, align: "right",
      },
    );
  });

  await pptx.writeFile({ fileName: `${deckFileName(input.brief)}.pptx` });
}

export type { DeckInput, Slide };
