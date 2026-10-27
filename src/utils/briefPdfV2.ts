import { jsPDF } from "jspdf";
import { assetTypeLabel, type BriefAsset, type CreativeBriefV2 } from "../lib/briefs";

// PDF for v2 briefs: header, blocking box for unconfirmed items, key message,
// rationale, then each asset with its slide/scene table and captions.
// Plain jsPDF (no table plugin): a small table helper wraps cells and breaks pages.

const PAGE_W = 210;
const PAGE_H = 297;
const M = 15; // margin
const W = PAGE_W - M * 2;
const DARK: [number, number, number] = [15, 23, 42];
const GOLD: [number, number, number] = [176, 141, 87];
const BODY: [number, number, number] = [51, 65, 85];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];
const RED_BG: [number, number, number] = [254, 226, 226];
const RED: [number, number, number] = [185, 28, 28];

// The built-in PDF fonts only cover Latin-1 plus a few typographic marks;
// anything else (emoji etc.) would print as garbage, so it's dropped.
const clean = (t: string) =>
  (t || "").replace(/[^\x09\x0A\x0D\x20-\xFF–—‘’“”•…€]/g, "").replace(/ +([.,!?;:])/g, "$1").trim();

// "client" copies leave out internal planning (rationale, production notes,
// success measures) and show unconfirmed items as "waiting on confirmation".
export function generateBriefPDFv2(brief: CreativeBriefV2, brandName: string, audience: "staff" | "client" = "staff"): jsPDF {
  const staff = audience === "staff";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 0;

  const ensure = (h: number) => {
    if (y + h > PAGE_H - 16) {
      doc.addPage();
      y = 16;
    }
  };
  const text = (t: string, opts: { size?: number; bold?: boolean; italic?: boolean; color?: [number, number, number]; x?: number; width?: number; gap?: number } = {}) => {
    const size = opts.size ?? 9;
    const x = opts.x ?? M;
    const width = opts.width ?? W - (x - M);
    doc.setFont("helvetica", opts.bold ? "bold" : opts.italic ? "italic" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? BODY));
    const lines = doc.splitTextToSize(clean(t), width) as string[];
    const lh = size * 0.42;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, x, y + lh * 0.8);
      y += lh;
    }
    y += opts.gap ?? 1.5;
  };
  const label = (t: string) => text(t.toUpperCase(), { size: 7, bold: true, color: MUTED, gap: 0.8 });

  // Table with wrapped cells; repeats the header row after a page break.
  const table = (headers: string[], widths: number[], rows: string[][]) => {
    const size = 7.5;
    const lh = size * 0.42;
    const pad = 1.6;
    const drawHeader = () => {
      ensure(7);
      doc.setFillColor(241, 245, 249);
      doc.rect(M, y, W, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      let x = M;
      headers.forEach((h, i) => {
        doc.text(h.toUpperCase(), x + pad, y + 4);
        x += widths[i];
      });
      y += 6;
    };
    drawHeader();
    doc.setFontSize(size);
    for (const row of rows) {
      doc.setFont("helvetica", "normal");
      const cells = row.map((c, i) => doc.splitTextToSize(clean(c) || "-", widths[i] - pad * 2) as string[]);
      const h = Math.max(...cells.map((c) => c.length)) * lh + pad * 2;
      if (y + h > PAGE_H - 16) {
        doc.addPage();
        y = 16;
        drawHeader();
      }
      let x = M;
      doc.setTextColor(...BODY);
      doc.setFontSize(size);
      cells.forEach((lines, i) => {
        lines.forEach((line, k) => doc.text(line, x + pad, y + pad + lh * (k + 0.8)));
        x += widths[i];
      });
      doc.setDrawColor(...LINE);
      doc.line(M, y + h, M + W, y + h);
      y += h;
    }
    y += 3;
  };

  // ---- header bar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, PAGE_W, 22, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 22, PAGE_W, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.text("N.O.K OS BRAND WORKSPACE", M, 8.5);
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("CREATIVE BRIEF", M, 16.5);
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`BRAND: ${clean(brandName).toUpperCase()}`, PAGE_W - M, 8.5, { align: "right" });
  doc.text(`STATUS: ${brief.status.toUpperCase()}  ·  DATE: ${brief.date || "unscheduled"}`, PAGE_W - M, 16.5, { align: "right" });
  y = 30;

  text(brief.title, { size: 15, bold: true, color: DARK, gap: 1 });
  text([brief.pillar, brief.platforms.join(", ")].filter(Boolean).join("  ·  "), { size: 8.5, italic: true, color: MUTED, gap: 4 });

  // ---- blocking box
  if (brief.unconfirmed.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const items = brief.unconfirmed.map((u) => doc.splitTextToSize(clean(staff ? `• ${u.note}  [${u.field}]` : `• ${u.note}`), W - 8) as string[]);
    const h = 10 + items.reduce((n, l) => n + l.length * 3.5 + 0.8, 0);
    ensure(h);
    doc.setFillColor(...RED_BG);
    doc.setDrawColor(...RED);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, W, h, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RED);
    doc.text(staff
      ? `NOT APPROVABLE: ${brief.unconfirmed.length} UNCONFIRMED ITEM${brief.unconfirmed.length === 1 ? "" : "S"}`
      : "WAITING ON CONFIRMATION BEFORE APPROVAL", M + 4, y + 6);
    let iy = y + 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    items.forEach((lines) => {
      lines.forEach((line) => {
        doc.text(line, M + 4, iy + 2.5);
        iy += 3.5;
      });
      iy += 0.8;
    });
    y += h + 5;
    doc.setLineWidth(0.2);
  }

  label("Key message");
  text(brief.keyMessage, { size: 11, bold: true, color: DARK, gap: 3 });
  if (staff) {
    label("Rationale: why this, why now");
    text(brief.rationale, { gap: 3 });
  }
  if (brief.personas.length) {
    label("For");
    text(brief.personas.join("  ·  "), { gap: 3 });
  }

  brief.assets.forEach((a, i) => renderAsset(a, i));

  if (staff && brief.productionNotes.length) {
    ensure(12);
    label("Production notes");
    brief.productionNotes.forEach((n) => text(`• ${n}`, { gap: 0.8 }));
    y += 2;
  }
  if (staff && brief.successMeasures.length) {
    ensure(14);
    label("Success measures");
    table(["Metric", "Target", "Where it's read"], [50, 45, W - 95], brief.successMeasures.map((m) => [m.metric, m.target, m.source]));
  }

  // ---- footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(clean(`${brief.title} · ${brandName}`), M, PAGE_H - 8);
    doc.text(`Page ${p} of ${pages}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
  }
  return doc;

  function renderAsset(a: BriefAsset, i: number) {
    ensure(20);
    y += 2;
    doc.setFillColor(...DARK);
    doc.rect(M, y, W, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(clean(`ASSET ${i + 1} · ${assetTypeLabel(a.type).toUpperCase()} · ${a.title}`).slice(0, 110), M + 3, y + 5.4);
    y += 11;
    text(`${a.platforms.join(", ")}  ·  ${a.spec}${a.slot ? `  ·  ${a.slot}` : ""}`, { size: 8, color: MUTED, gap: 2.5 });

    switch (a.type) {
      case "carousel":
        table(["#", "Headline", "Body copy", "Background", "Design note"], [8, 38, 62, 35, W - 143],
          a.slides.map((s) => [String(s.n), s.headline, s.body, s.background, s.visualNote]));
        break;
      case "reel":
      case "video":
        text(`Cover: ${a.coverText || "-"}   ·   Length: ${a.durationSec}s${a.audioNote ? `   ·   Audio: ${a.audioNote}` : ""}`, { size: 8.5, gap: 2 });
        table(["Time", "Visual", "On-screen text", "Voiceover"], [18, 62, 45, W - 125],
          a.scenes.map((s) => [`${s.start}-${s.end}s`, s.visual, s.onScreenText, s.voiceover]));
        break;
      case "blog":
        text(`/${a.slug}`, { size: 8, color: MUTED, gap: 0.8 });
        if (a.metaDescription) text(`Meta description: ${a.metaDescription}`, { size: 8, italic: true, gap: 2 });
        // Markdown printed as readable text: headings bold, list markers kept.
        for (const raw of a.body.split("\n")) {
          const line = raw.trim();
          if (!line) { y += 1.5; continue; }
          const heading = line.match(/^#{1,6}\s+(.*)/);
          if (heading) text(heading[1].replace(/\*\*/g, ""), { size: 10, bold: true, color: DARK, gap: 1 });
          else text(line.replace(/\*\*|__/g, "").replace(/^[-*]\s+/, "• "), { size: 9, gap: 1 });
        }
        y += 2;
        break;
      case "static":
        table(["Headline", "Body copy", "Design note"], [50, 70, W - 120], [[a.headline, a.body, a.visualNote]]);
        break;
      case "text":
        text(a.body, { gap: 3 });
        break;
    }

    for (const c of a.captions) {
      ensure(10);
      label(`${c.platform} caption`);
      text(c.text, { gap: 0.8 });
      if (c.hashtags.length) text(c.hashtags.join(" "), { size: 8, color: GOLD, gap: 0.8 });
      if (c.firstComment) text(`First comment: ${c.firstComment}`, { size: 8, italic: true, gap: 0.8 });
      y += 1.5;
    }
    if (a.cta) text(`CTA: ${a.cta}`, { bold: true, color: DARK, gap: 3 });
  }
}
