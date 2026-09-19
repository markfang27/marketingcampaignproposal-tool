import { buildDeck, deckFileName, type DeckInput, type Slide } from "./slides";

const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function renderSlide(s: Slide, i: number, total: number, brand: string) {
  const en = (t: string | undefined, cls: string) =>
    t?.trim() ? `<p class="${cls}">${esc(t)}</p>` : "";

  if (s.kind === "cover") {
    return `<section class="slide cover">
      <span class="rule"></span>
      <h1>${esc(s.title)}</h1>
      ${en(s.titleEn, "en big")}
      ${s.subtitle ? `<p class="sub">${esc(s.subtitle)}</p>` : ""}
    </section>`;
  }

  if (s.kind === "section") {
    return `<section class="slide chapter">
      <span class="num">${esc(s.num ?? "")}</span>
      <h1>${esc(s.title)}</h1>
      ${en(s.titleEn, "en big")}
    </section>`;
  }

  const cols = s.columns?.length
    ? `<div class="cols" style="grid-template-columns:repeat(${s.columns.length},1fr)">${s.columns
        .map(
          (c) =>
            `<div><p class="label">${esc(c.label)}</p><p class="value">${esc(c.value)}</p></div>`,
        )
        .join("")}</div>`
    : "";

  const bullets = s.bullets?.length
    ? `<ul>${s.bullets
        .map(
          (b) =>
            `<li>${b.title ? `<span class="bt">${esc(b.title)}</span>` : ""}${
              b.body ? `<span class="bb">${esc(b.body)}</span>` : ""
            }${en(b.en, "en")}</li>`,
        )
        .join("")}</ul>`
    : "";

  const table = s.table
    ? `<table><thead><tr>${s.table.head
        .map((h) => `<th>${esc(h)}</th>`)
        .join("")}</tr></thead><tbody>${s.table.rows
        .map(
          (r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table>`
    : "";

  return `<section class="slide">
    <header><span class="num">${esc(s.num ?? "")}</span><h2>${esc(s.title)}</h2></header>
    ${en(s.titleEn, "en")}
    ${s.lead ? `<p class="lead">${esc(s.lead)}</p>` : ""}
    ${en(s.leadEn, "en")}
    ${cols}${bullets}${table}
    <footer>${esc(brand)} · 整合传播提案 &nbsp;&nbsp; ${i + 1} / ${total}</footer>
  </section>`;
}

/** 生成可在浏览器里翻页放映、也可直接打印成 PDF 的 16:9 幻灯片 HTML */
export function buildSlidesHtml(input: DeckInput) {
  const deck = buildDeck(input);
  const name = deckFileName(input.brief);
  const body = deck
    .map((s, i) => renderSlide(s, i, deck.length, input.brief.brand))
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(name)} · 幻灯片</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--ink:#1a1a1a;--brand:#c8452e;--muted:#6b6b6b;--line:#ddd8d0;--paper:#fff}
body{background:#2a2725;font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:var(--ink)}
.stage{display:flex;flex-direction:column;align-items:center;gap:24px;padding:72px 24px 96px}
.slide{position:relative;width:min(1120px,94vw);aspect-ratio:16/9;background:var(--paper);
  padding:5% 6%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35)}
.slide.cover,.slide.chapter{background:#f4f1ec;justify-content:center}
.rule{display:block;width:64px;height:4px;background:var(--brand);margin-bottom:24px}
.cover h1{font-size:clamp(24px,3.4vw,44px);font-weight:700}
.chapter .num{font-size:clamp(40px,6vw,76px);color:var(--brand);font-style:italic;line-height:1}
.chapter h1{margin-top:8px;font-size:clamp(22px,3vw,38px)}
.cover .sub{margin-top:14px;color:var(--muted);font-size:clamp(12px,1.2vw,16px)}
.slide header{display:flex;align-items:baseline;gap:14px;border-bottom:1px solid var(--line);padding-bottom:12px}
.slide header .num{color:var(--brand);font-style:italic;font-size:clamp(13px,1.3vw,18px)}
.slide header h2{font-size:clamp(17px,2.1vw,27px);font-weight:650}
.en{color:var(--muted);font-style:italic;font-size:clamp(10px,1vw,13px);margin-top:6px;line-height:1.55}
.en.big{font-size:clamp(13px,1.4vw,19px);margin-top:10px}
.lead{margin-top:16px;font-size:clamp(12px,1.35vw,18px);line-height:1.75}
.cols{display:grid;gap:18px;margin-top:22px}
.cols .label{color:var(--muted);font-size:clamp(9px,.9vw,12px);letter-spacing:.12em}
.cols .value{margin-top:6px;font-weight:650;font-size:clamp(12px,1.3vw,18px)}
ul{margin-top:18px;list-style:none;display:flex;flex-direction:column;gap:12px}
li{border-top:1px solid var(--line);padding-top:10px;font-size:clamp(11px,1.15vw,15px);line-height:1.65}
li:first-child{border-top:0;padding-top:0}
.bt{font-weight:650}
.bb{color:#3a3a3a}
.bt + .bb::before{content:" — "}
table{margin-top:18px;width:100%;border-collapse:collapse;font-size:clamp(10px,1.05vw,14px)}
th{background:var(--ink);color:#fff;text-align:left;padding:8px 10px;font-weight:600}
td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}
footer{position:absolute;right:6%;bottom:3.5%;color:var(--muted);font-size:clamp(8px,.8vw,11px)}
.bar{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:center;gap:10px;
  padding:12px;background:rgba(20,18,17,.92);color:#fff;font-size:13px;align-items:center;z-index:9}
.bar button{background:#fff;color:#1a1a1a;border:0;padding:6px 14px;font-size:13px;cursor:pointer}
.bar span{color:#cfc9c2}
body.show{background:#141211}
body.show .stage{padding:0;gap:0;min-height:100vh;justify-content:center}
body.show .slide{display:none}
body.show .slide.on{display:flex;width:min(100vw,177.7vh);height:min(56.25vw,100vh);aspect-ratio:auto;box-shadow:none}
@media print{
  body{background:#fff}
  .bar{display:none}
  .stage{padding:0;gap:0}
  .slide{width:100%;box-shadow:none;break-after:page;page-break-after:always}
  @page{size:A4 landscape;margin:0}
}
</style></head>
<body>
<div class="stage">${body}</div>
<div class="bar">
  <button onclick="toggle()" id="t">进入放映</button>
  <button onclick="window.print()">打印 / 存为 PDF</button>
  <span id="hint">共 ${deck.length} 页 · 放映时用 ← → 翻页,Esc 退出</span>
</div>
<script>
var slides=[].slice.call(document.querySelectorAll('.slide')),i=0,on=false;
function paint(){slides.forEach(function(s,n){s.classList.toggle('on',n===i)});
  document.getElementById('hint').textContent=(i+1)+' / '+slides.length+' · ← → 翻页,Esc 退出';}
function toggle(){on=!on;document.body.classList.toggle('show',on);
  document.getElementById('t').textContent=on?'退出放映':'进入放映';
  if(on){paint()}else{document.getElementById('hint').textContent='共 '+slides.length+' 页 · 放映时用 ← → 翻页,Esc 退出';}}
function toggleFn(){toggle()}
window.toggle=toggle;
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&on){toggle();return}
  if(!on)return;
  if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){i=Math.min(i+1,slides.length-1);paint();e.preventDefault()}
  if(e.key==='ArrowLeft'||e.key==='PageUp'){i=Math.max(i-1,0);paint()}
});
document.querySelector('.stage').addEventListener('click',function(){if(on){i=Math.min(i+1,slides.length-1);paint()}});
</script>
</body></html>`;
}

/** 在新标签页打开幻灯片 */
export function openSlides(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
