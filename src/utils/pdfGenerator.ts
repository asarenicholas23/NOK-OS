import { jsPDF } from "jspdf";
import { CreativeBrief, RawAnalyticsRow, Brand } from "../lib/firebase";

export interface UnconfirmedFlag {
  field: string;
  fieldKey: string;
  reason: string;
  excerpt: string;
}

/**
 * Global detection rule for placeholders, unconfirmed claims, and unverified data.
 */
export function detectUnconfirmedData(brief: CreativeBrief): UnconfirmedFlag[] {
  const flags: UnconfirmedFlag[] = [];
  const fieldsToCheck: { key: keyof CreativeBrief; label: string }[] = [
    { key: "proofPoint", label: "Proof Point / Data Source" },
    { key: "keyMessage", label: "Core Message" },
    { key: "objective", label: "Objective" },
    { key: "targetAudience", label: "Target Audience" },
    { key: "deliverables", label: "Deliverables Scope" },
    { key: "formatSpec", label: "Format & Tech Spec" },
    { key: "contentOutline", label: "Content Outline" },
    { key: "cta", label: "Call to Action" },
    { key: "toneVisualRef", label: "Tone & Visual Reference" },
    { key: "successMetric", label: "Success Metric" },
    { key: "title", label: "Brief Title" }
  ];

  const placeholderPatterns = [
    /placeholder/i,
    /needs\s+real\s+data/i,
    /unconfirmed/i,
    /unverified/i,
    /verify\s+(?:claim|with|data)/i,
    /pending\s+(?:confirmation|data|verification)/i,
    /assumption/i,
    /\[tbd\]/i,
    /\btbd\b/i,
    /\btodo\b/i,
    /\[insert/i,
    /\binsert\s+[a-z]+/i,
    /approx(?:\.|\b)/i,
    /estimated\s+(?:team|locations?|turnaround|coverage|revenue|size)/i,
    /check\s+with\s+client/i
  ];

  fieldsToCheck.forEach(({ key, label }) => {
    const value = (brief[key] as string) || "";
    if (!value) return;

    for (const pattern of placeholderPatterns) {
      if (pattern.test(value)) {
        const match = value.match(pattern);
        let excerpt = value;
        if (value.length > 90) {
          const idx = value.toLowerCase().indexOf((match?.[0] || "").toLowerCase());
          const start = Math.max(0, idx - 20);
          const end = Math.min(value.length, idx + 60);
          excerpt = (start > 0 ? "..." : "") + value.substring(start, end).trim() + (end < value.length ? "..." : "");
        }

        let reason = "Contains placeholder or unverified claim";
        if (/placeholder/i.test(value)) reason = "Explicitly marked as PLACEHOLDER";
        else if (/needs\s+real\s+data/i.test(value)) reason = "Requires real client-confirmed data before publishing";
        else if (/unconfirmed|unverified/i.test(value)) reason = "Unconfirmed claim requiring client sign-off";
        else if (/tbd|todo/i.test(value)) reason = "Contains TBD/TODO placeholder tag";
        else if (/assumption/i.test(value)) reason = "Based on unverified working assumption";

        flags.push({
          field: label,
          fieldKey: key,
          reason,
          excerpt
        });
        break;
      }
    }
  });

  return flags;
}

// Helpers for clean plain text extraction for Owner View
export const getPlainAssetPurpose = (brief: CreativeBrief): string => {
  if (!brief.objective) return "Promotional and marketing campaign asset.";
  const clean = brief.objective
    .replace(/^define\s+primary\s+marketing[,\s]+/i, "")
    .replace(/^the\s+objective\s+is\s+to\s+/i, "To ")
    .trim();
  const firstSentence = clean.split(/(?<=[.?!])\s+/)[0];
  return firstSentence || clean;
};

export const getPlainCoreMessage = (brief: CreativeBrief): string => {
  if (!brief.keyMessage) return "Key marketing message";
  return brief.keyMessage.replace(/^["']|["']$/g, "").trim();
};

export const getPlainPlacementFormat = (brief: CreativeBrief): string => {
  return brief.formatSpec || brief.deliverables || "Social Media Campaign Asset";
};

// Color format helper for brand style guide in PDF export
const formatBrandPalette = (colorStr?: string): string => {
  if (!colorStr) return "Emerald (#10B981) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  const c = colorStr.toLowerCase().trim();
  if (c === "emerald") return "Emerald (#10B981) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  if (c === "rose") return "Rose (#F43F5E) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  if (c === "amber") return "Amber (#F59E0B) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  if (c === "indigo") return "Indigo (#6366F1) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  if (c === "violet") return "Violet (#8B5CF6) Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support";
  if (c.startsWith("#")) return `${c} Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support`;
  return `${colorStr.charAt(0).toUpperCase() + colorStr.slice(1)} Primary  ·  Gold (#B08D57) Signature Accent  ·  Slate-900 / Pure White Support`;
};

/**
 * Generates an executive two-view split PDF:
 * - SECTION 1 (Page 1): Executive Owner Summary (10-second approval sheet, plain language, prominent warning box if unconfirmed data)
 * - SECTION 2 (Page 2+): Designer Execution Spec (format, exact approved copy, section outline, brand visual reference, CTA)
 */
export const generateBriefPDF = (
  brief: CreativeBrief, 
  brandNameOrObject?: string | Brand, 
  brandObject?: Brand
): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Extract brand details
  const brand: Brand | undefined = typeof brandNameOrObject === "object" 
    ? brandNameOrObject 
    : brandObject;
  
  const brandName = typeof brandNameOrObject === "string" 
    ? brandNameOrObject 
    : (brand?.name || "N.O.K WORKSPACE");

  // Premium Dark Neumorphic & Gold Color Palette
  const darkHeaderBg = [15, 23, 42]; // Slate-900 #0F172A
  const goldAccent = [176, 141, 87]; // N.O.K Signature Gold #B08D57
  const darkText = [15, 23, 42]; // Slate-900
  const bodyText = [51, 65, 85]; // Slate-700
  const mutedText = [100, 116, 139]; // Slate-500
  const cardBg = [248, 250, 252]; // Slate-50
  const cardBorder = [226, 232, 240]; // Slate-200
  
  // Warning Box Palette (for unconfirmed data / placeholder warnings)
  const warningBoxBg = [254, 243, 199]; // Amber-100 / Warm Gold #FEF3C7
  const warningBorder = [217, 119, 6]; // Amber-600 #D97706
  const warningTextHeader = [146, 64, 14]; // Amber-800
  const warningTextBody = [120, 53, 15]; // Amber-900

  // Single unified state for verification & approval status
  const unconfirmedFlags = detectUnconfirmedData(brief);
  const hasUnconfirmedData = unconfirmedFlags.length > 0;
  const isApproved = brief.status === "Approved";
  const isChangesRequested = (brief.status as string) === "Changes Requested";
  const isPending = !isApproved && !isChangesRequested;

  // =========================================================================
  // SECTION 1 — OWNER SUMMARY (PAGE 1)
  // =========================================================================
  
  // 1. Dark Top Header Bar (Neumorphic accent)
  doc.setFillColor(darkHeaderBg[0], darkHeaderBg[1], darkHeaderBg[2]);
  doc.rect(0, 0, 210, 22, "F");

  // Gold separator stripe below header bar
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 22, 210, 1.2, "F");

  // Top header text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("N.O.K OS BRAND WORKSPACE", 15, 8.5);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("CREATIVE BRIEF · SECTION 1: OWNER APPROVAL SUMMARY", 15, 16.5);

  const bNameStr = (brandName || "BRAND").toUpperCase();
  const bIdStr = (brief.campaignId || brief.id.substring(0, 8)).toUpperCase();
  const bDateStr = brief.date || new Date().toLocaleDateString();

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`BRAND: ${bNameStr}`, 195, 8.5, { align: "right" });
  doc.text(`ID: ${bIdStr}  ·  DATE: ${bDateStr}`, 195, 16.5, { align: "right" });

  let currentY = 29;

  // 2. Campaign Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  
  const splitTitle = doc.splitTextToSize(brief.title || "Untitled Creative Brief", 180);
  doc.text(splitTitle, 15, currentY + 2.5);
  currentY += (splitTitle.length * 5) + 1.5;

  const seqPos = brief.sequencePosition || "Campaign 1 of 1 · Executive Approval View";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(seqPos, 15, currentY);
  currentY += 5;

  // 3. TOP VERIFICATION / APPROVAL STATUS BANNER (Driven by a single unified state)
  if (hasUnconfirmedData) {
    // Visible warning banner: unconfirmed fields exist
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const subNotice = doc.splitTextToSize(
      `CRITICAL: This brief contains ${unconfirmedFlags.length} placeholder or unconfirmed client claim(s). Verify these data points before approving for public distribution:`,
      170
    );

    let bulletsHeight = 0;
    const bulletTexts: { label: string; text: string[]; reason: string }[] = [];
    
    unconfirmedFlags.forEach(flag => {
      const fullText = `• ${flag.field}: "${flag.excerpt}" — [${flag.reason}]`;
      const lines = doc.splitTextToSize(fullText, 168);
      bulletTexts.push({ label: flag.field, text: lines, reason: flag.reason });
      bulletsHeight += (lines.length * 3.5) + 1;
    });

    const warningBoxHeight = 9 + (subNotice.length * 3.5) + bulletsHeight + 2;

    // Warning container background
    doc.setFillColor(warningBoxBg[0], warningBoxBg[1], warningBoxBg[2]);
    doc.roundedRect(15, currentY, 180, warningBoxHeight, 1.5, 1.5, "F");

    // Warning outer border
    doc.setDrawColor(warningBorder[0], warningBorder[1], warningBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(15, currentY, 180, warningBoxHeight, 1.5, 1.5, "D");

    // Solid thick left accent bar (3.5mm wide)
    doc.setFillColor(warningBorder[0], warningBorder[1], warningBorder[2]);
    doc.rect(15, currentY, 3.5, warningBoxHeight, "F");

    // Header label inside warning box
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(warningTextHeader[0], warningTextHeader[1], warningTextHeader[2]);
    doc.text("⚠️  NEEDS CONFIRMATION BEFORE APPROVAL", 22, currentY + 5.2);

    // Subnotice
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(warningTextBody[0], warningTextBody[1], warningTextBody[2]);
    let warnTextY = currentY + 9;
    doc.text(subNotice, 22, warnTextY);
    warnTextY += (subNotice.length * 3.5) + 1.2;

    // Bullet items
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    bulletTexts.forEach(b => {
      doc.text(b.text, 22, warnTextY);
      warnTextY += (b.text.length * 3.5) + 1;
    });

    currentY += warningBoxHeight + 4;
  } else if (isApproved) {
    // Confirmed & Approved Badge (ONLY shown when 0 unconfirmed fields AND status is Approved)
    doc.setFillColor(236, 253, 245); // Emerald-50
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "F");
    doc.setDrawColor(167, 243, 208); // Emerald-200
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "D");
    doc.setFillColor(16, 185, 129); // Emerald-500
    doc.rect(15, currentY, 2.5, 7.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(6, 95, 70); // Emerald-800
    doc.text("✓  ALL CLAIMS & SPECS CONFIRMED — Verified and approved for designer dispatch.", 20, currentY + 4.9);
    currentY += 10.5;
  } else if (isChangesRequested) {
    // Changes Requested Banner
    doc.setFillColor(255, 241, 242); // Rose-50
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "F");
    doc.setDrawColor(254, 205, 211); // Rose-200
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "D");
    doc.setFillColor(225, 29, 72); // Rose-600
    doc.rect(15, currentY, 2.5, 7.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(159, 18, 57); // Rose-900
    doc.text("⚠  CHANGES REQUESTED — Review revision feedback notes before re-submitting for sign-off.", 20, currentY + 4.9);
    currentY += 10.5;
  } else {
    // Pending Review Banner (Zero unconfirmed fields, awaiting executive sign-off)
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "F");
    doc.setDrawColor(253, 230, 138); // Amber-200
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, 180, 7.5, 1.2, 1.2, "D");
    doc.setFillColor(217, 119, 6); // Amber-600
    doc.rect(15, currentY, 2.5, 7.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(146, 64, 14); // Amber-800
    doc.text("⏳  PENDING EXECUTIVE SIGN-OFF — All claims verified. Awaiting executive approval.", 20, currentY + 4.9);
    currentY += 10.5;
  }

  // 4. OWNER SUMMARY CARDS (Clean, high-contrast, structured)

  // Helper to draw clean structured cards on Page 1
  const drawOwnerCard = (label: string, value: string, isQuote: boolean = false) => {
    doc.setFont("helvetica", isQuote ? "italic" : "normal");
    doc.setFontSize(8.8);
    const splitVal = doc.splitTextToSize(value || "N/A", 170);
    const cardH = 8.5 + (splitVal.length * 4);

    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.roundedRect(15, currentY, 180, cardH, 1.5, 1.5, "F");
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, currentY, 180, cardH, 1.5, 1.5, "D");

    // Gold card tag
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.2);
    doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.text(label.toUpperCase(), 19, currentY + 4.5);

    if (isQuote) {
      // Left gold accent line for quote
      doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
      doc.rect(19, currentY + 6, 1.2, (splitVal.length * 4) + 0.5, "F");

      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(8.8);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(splitVal, 23, currentY + 9);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
      doc.text(splitVal, 19, currentY + 8.5);
    }

    currentY += cardH + 3.5;
  };

  // Card 1: What this asset is for
  drawOwnerCard("1. What This Asset Is For", getPlainAssetPurpose(brief));

  // Card 2: Core Message (plain language, no persona/campaign framing)
  drawOwnerCard("2. The Core Message (In Plain Language)", `"${getPlainCoreMessage(brief)}"`, true);

  // Card 3: Where it will be used (format + placement, plain terms)
  const whereUsedText = `${getPlainPlacementFormat(brief)} ${brief.sequencePosition ? `· (${brief.sequencePosition})` : ""}`;
  drawOwnerCard("3. Where It Will Be Used (Format & Placement)", whereUsedText);

  // Card 4: Approval Status & Sign-off Field
  const approverStr = brief.approver || "Design Lead / Business Owner";
  const approvalDateStr = brief.date || new Date().toLocaleDateString();

  const statusCardH = 20;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, statusCardH, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, statusCardH, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("4. EXECUTIVE APPROVAL STATUS & SIGN-OFF", 19, currentY + 4.5);

  // Status Badge box (matches unified status state)
  const badgeColor = hasUnconfirmedData 
    ? [217, 119, 6] 
    : (isApproved ? [16, 185, 129] : (isChangesRequested ? [225, 29, 72] : [217, 119, 6]));
  
  const badgeBg = hasUnconfirmedData 
    ? [254, 243, 199] 
    : (isApproved ? [236, 253, 245] : (isChangesRequested ? [255, 241, 242] : [254, 243, 199]));

  const badgeLabel = hasUnconfirmedData 
    ? "⚠️ NEEDS CONFIRMATION" 
    : (isApproved ? "✓ APPROVED" : (isChangesRequested ? "⚠ CHANGES REQ." : "⏳ PENDING REVIEW"));

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.roundedRect(19, currentY + 7, 52, 9.5, 1, 1, "F");
  doc.setDrawColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(19, currentY + 7, 52, 9.5, 1, 1, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(badgeColor[0], badgeColor[1], badgeColor[2]);
  doc.text(badgeLabel, 22, currentY + 13.2);

  // Approver & Date text details
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Assigned Approver:", 78, currentY + 10.5);
  doc.text("Recorded Sign-off Date:", 138, currentY + 10.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(approverStr, 78, currentY + 14.5);
  doc.text(approvalDateStr, 138, currentY + 14.5);

  // Page 1 Footer (Strict page break containment at fixed coordinates)
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(15, 281, 180, 0.4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("SECTION 1 OF 2 · EXECUTIVE OWNER SUMMARY · N.O.K OS", 15, 286);
  doc.text("Page 1 of 2  ·  Turn to Page 2 for Complete Designer Execution Specs  →", 195, 286, { align: "right" });

  // =========================================================================
  // SECTION 2 — DESIGNER SPEC (PAGE 2 ONWARD)
  // =========================================================================
  doc.addPage();
  currentY = 30;

  // Helper for Section 2 headers on page breaks
  const drawDesignerHeader = () => {
    doc.setFillColor(darkHeaderBg[0], darkHeaderBg[1], darkHeaderBg[2]);
    doc.rect(0, 0, 210, 22, "F");

    doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.rect(0, 22, 210, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.text("N.O.K OS BRAND WORKSPACE", 15, 8.5);

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("CREATIVE BRIEF · SECTION 2: DESIGNER EXECUTION SPEC", 15, 16.5);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`BRAND: ${bNameStr}`, 195, 8.5, { align: "right" });
    // Fix 4: Removed promotional marketing phrasing ("NO THEORIES")
    doc.text("PRODUCTION SPECIFICATION SHEET", 195, 16.5, { align: "right" });
  };

  drawDesignerHeader();

  // Page 2 Title & Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  
  const splitTitle2 = doc.splitTextToSize(brief.title || "Untitled Creative Brief", 180);
  doc.text(splitTitle2, 15, currentY + 2);
  currentY += (splitTitle2.length * 4.6) + 1.5;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.2);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Production instructions: technical dimensions, approved copy, section layout, brand visual guide, and CTA.", 15, currentY);
  currentY += 5.5;

  // Helper for page overflow check in Section 2 (Strict containment to never merge with footers/headers)
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > 265) {
      // Draw bottom footer on current page
      doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
      doc.rect(15, 281, 180, 0.4, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.text("SECTION 2 · DESIGNER EXECUTION SPECIFICATION · N.O.K OS", 15, 286);
      doc.text("Continued on Next Page →", 195, 286, { align: "right" });

      doc.addPage();
      drawDesignerHeader();
      currentY = 30;
    }
  };

  // 1. Format & Technical Dimensions
  const formatText = brief.formatSpec || "1080 x 1350 px, portrait (4:5) | Carousel / Multi-slide Document | PDF / PNG";
  const deliverablesText = brief.deliverables || "1x Social Media Graphic / Document Carousel";
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const splitFormat = doc.splitTextToSize(formatText, 170);
  const splitDeliv = doc.splitTextToSize(`Deliverables Scope: ${deliverablesText}`, 170);
  const formatCardH = 11 + (splitFormat.length * 3.8) + (splitDeliv.length * 3.6);

  checkPageBreak(formatCardH);

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, formatCardH, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, formatCardH, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("1. FORMAT & TECHNICAL DIMENSIONS", 19, currentY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitFormat, 19, currentY + 8.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(splitDeliv, 19, currentY + 8.5 + (splitFormat.length * 3.8));

  currentY += formatCardH + 3.5;

  // 2. Approved Headline & Exact Copy
  const copyHeadline = brief.title || "";
  const copyBody = brief.keyMessage ? `"${brief.keyMessage}"` : "";
  const copyProof = brief.proofPoint ? `Proof / Data Support: ${brief.proofPoint}` : "";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const splitCopyHead = doc.splitTextToSize(copyHeadline, 170);
  const splitCopyBody = doc.splitTextToSize(copyBody, 166);
  const splitCopyProof = copyProof ? doc.splitTextToSize(copyProof, 170) : [];
  
  const copyCardH = 13 + (splitCopyHead.length * 4) + (splitCopyBody.length * 3.8) + (splitCopyProof.length * 3.5) + 3.5;

  checkPageBreak(copyCardH);

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, copyCardH, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, copyCardH, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("2. APPROVED HEADLINE & EXACT COPY", 19, currentY + 4.5);

  // Exact Copy badge
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(140, currentY + 2.5, 50, 4.5, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text("✓ EXACT APPROVED COPY", 143, currentY + 5.5);

  let copyInnerY = currentY + 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitCopyHead, 19, copyInnerY);
  copyInnerY += (splitCopyHead.length * 4) + 1.5;

  // Boxed quote for exact body copy
  const quoteBoxH = (splitCopyBody.length * 3.8) + 3.5;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(19, copyInnerY, 172, quoteBoxH, 1, 1, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(19, copyInnerY, 172, quoteBoxH, 1, 1, "D");

  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(19, copyInnerY, 1.5, quoteBoxH, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  doc.text(splitCopyBody, 23, copyInnerY + 3.5);
  copyInnerY += quoteBoxH + 2.5;

  if (splitCopyProof.length > 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(splitCopyProof, 19, copyInnerY);
  }

  currentY += copyCardH + 3.5;

  // 3. Layout Direction & Section Breakdown (Parsed outline beats)
  const parseBeats = (raw: string): string[] => {
    if (!raw) return [];
    if (raw.includes("|")) return raw.split("|").map(s => s.trim()).filter(Boolean);
    if (raw.includes("\n")) return raw.split("\n").map(s => s.trim()).filter(Boolean);
    return [raw];
  };

  const beats = parseBeats(brief.contentOutline || "1. Hook Introduction | 2. Core Value Breakdown | 3. Call to Action");
  
  let beatsHeight = 8;
  const beatLinesList: { num: number; lines: string[] }[] = [];
  beats.forEach((beat, i) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(beat, 162);
    beatLinesList.push({ num: i + 1, lines });
    beatsHeight += (lines.length * 3.6) + 2.5;
  });

  checkPageBreak(beatsHeight + 3.5);

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, beatsHeight, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, beatsHeight, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("3. LAYOUT DIRECTION & SECTION BREAKDOWN", 19, currentY + 4.5);

  let beatInnerY = currentY + 8.5;
  beatLinesList.forEach(b => {
    // Number badge
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(19, beatInnerY - 2.2, 5.5, 4.2, 0.8, 0.8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
    doc.text(b.num.toString(), 21, beatInnerY + 0.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(b.lines, 26.5, beatInnerY + 0.8);
    beatInnerY += (b.lines.length * 3.6) + 2.5;
  });

  currentY += beatsHeight + 3.5;

  // 4. Visual Style Reference (Fix 2: Wrapped text with ZERO truncation across all fields)
  const fullPaletteText = formatBrandPalette(brand?.primaryColor);
  const fullTypographyText = "Sora (Headings / Display, 700/800)  ·  Inter (Body / Subheadings, 400/500/600)  ·  JetBrains Mono (Data & Specs)";
  const fullToneText = brand?.voiceTone || "Direct, Confident, Modern";
  const fullVisualNoteText = brief.toneVisualRef || "Clean high-contrast display typography, solid brand backgrounds, generous negative space.";
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  const splitPaletteLines = doc.splitTextToSize(fullPaletteText, 140);
  const splitTypoLines = doc.splitTextToSize(fullTypographyText, 140);
  const splitToneLines = doc.splitTextToSize(fullToneText, 140);
  const splitVisualNoteLines = doc.splitTextToSize(fullVisualNoteText, 140);

  const visualCardH = 12 + 
    (splitPaletteLines.length * 3.5) + 
    (splitTypoLines.length * 3.5) + 
    (splitToneLines.length * 3.5) + 
    (splitVisualNoteLines.length * 3.5) + 
    11;

  checkPageBreak(visualCardH);

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, visualCardH, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, visualCardH, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text(`4. BRAND VISUAL STYLE REFERENCE (${bNameStr})`, 19, currentY + 4.5);

  let styleRowY = currentY + 9;

  // Row A: Color Palette
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Color Palette:", 19, styleRowY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitPaletteLines, 48, styleRowY);
  styleRowY += (splitPaletteLines.length * 3.5) + 2.5;

  // Row B: Typography
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Typography:", 19, styleRowY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitTypoLines, 48, styleRowY);
  styleRowY += (splitTypoLines.length * 3.5) + 2.5;

  // Row C: Voice & Tone (Full text, wrapped onto extra lines, no truncation!)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Voice & Tone:", 19, styleRowY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitToneLines, 48, styleRowY);
  styleRowY += (splitToneLines.length * 3.5) + 2.5;

  // Row D: Visual Direction Notes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("Visual Guide:", 19, styleRowY);
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.6);
  doc.setTextColor(bodyText[0], bodyText[1], bodyText[2]);
  doc.text(splitVisualNoteLines, 48, styleRowY);

  currentY += visualCardH + 3.5;

  // 5. CTA / Contact Info
  const ctaText = brief.cta || "Comment below or visit link in bio.";
  const domainText = brand?.domain || "Official Brand Channels";
  const successTarget = brief.successMetric || ">= 2.5% engagement rate";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const splitCta = doc.splitTextToSize(ctaText, 170);
  const ctaCardH = 13 + (splitCta.length * 3.6);

  checkPageBreak(ctaCardH);

  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(15, currentY, 180, ctaCardH, 1.5, 1.5, "F");
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.setLineWidth(0.3);
  doc.roundedRect(15, currentY, 180, ctaCardH, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.text("5. CALL TO ACTION (CTA) & DESTINATION", 19, currentY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.text(splitCta, 19, currentY + 8.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Domain: ${domainText}  ·  Success KPI: ${successTarget}`, 19, currentY + 8.8 + (splitCta.length * 3.6));

  // Final Page 2 Footer (Strict page break containment at fixed coordinates)
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(15, 281, 180, 0.4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text("SECTION 2 OF 2 · DESIGNER EXECUTION SPECIFICATION · N.O.K OS", 15, 286);
  doc.text("Page 2 of 2  ·  Production Spec Sheet Complete", 195, 286, { align: "right" });

  return doc;
};

export const downloadSingleBriefPDF = (brief: CreativeBrief, brand?: Brand | null) => {
  const doc = generateBriefPDF(brief, brand?.name || "Global Standards", brand || undefined);
  const cleanTitle = (brief.title || "brief").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`${cleanTitle}-creative-brief.pdf`);
};

export const generatePerformanceReportPDF = (
  analytics: RawAnalyticsRow[],
  brandName: string,
  tagline: string = ""
): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [15, 23, 42]; // Slate-900
  const accentColor = [124, 58, 237]; // Violet-600
  const textColor = [51, 65, 85]; // Slate-700
  const darkTextColor = [15, 23, 42]; // Slate-900
  const lightBgColor = [248, 250, 252]; // Slate-50

  let currentY = 20;

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`BRAND WORKSPACE PERFORMANCE AUDIT · N.O.K Os`, 20, currentY);
  
  doc.setFontSize(8);
  const dateStr = new Date().toLocaleDateString();
  doc.text(`REPORT GENERATED: ${dateStr}`, 150, currentY);
  
  currentY += 8;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text("EXECUTIVE PERFORMANCE AUDIT", 20, currentY);
  currentY += 8;

  // Subtitle
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Social Media Channel Analytics & Strategic Growth Recommendations for ${brandName}`, 20, currentY);
  currentY += 6;

  if (tagline) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`"${tagline}"`, 20, currentY);
    currentY += 8;
  } else {
    currentY += 2;
  }

  // Accent Line separator
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(20, currentY, 170, 1.5, "F");
  currentY += 12;

  // Metrics aggregation
  const totalImpressions = analytics.reduce((acc, row) => acc + (row.impressions || 0), 0);
  const totalEngagement = analytics.reduce((acc, row) => acc + (row.engagement || 0), 0);
  const avgEngagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;

  // Executive Summary Cards layout in PDF
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(20, currentY, 170, 28, "F");
  
  // Outer border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(20, currentY, 170, 28, "D");

  // Metrics columns
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL REACH / IMPRESSIONS", 25, currentY + 8);
  doc.text("TOTAL ENGAGEMENTS", 85, currentY + 8);
  doc.text("AVERAGE CTR / ENG RATE", 140, currentY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(totalImpressions.toLocaleString(), 25, currentY + 18);
  doc.text(totalEngagement.toLocaleString(), 85, currentY + 18);
  doc.text(`${avgEngagementRate.toFixed(2)}%`, 140, currentY + 18);

  currentY += 38;

  // Section 1: Channel-by-Channel breakdown
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("1. Channel Performance Matrix", 20, currentY);
  currentY += 6;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(20, currentY, 170, 8, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(20, currentY + 8, 190, currentY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("PLATFORM", 23, currentY + 5.5);
  doc.text("POST COUNT", 65, currentY + 5.5);
  doc.text("TOTAL IMPRESSIONS", 95, currentY + 5.5);
  doc.text("TOTAL ENGAGEMENT", 135, currentY + 5.5);
  doc.text("AVG ENG. RATE", 170, currentY + 5.5);

  currentY += 8;

  // Calculate platform breakdown
  const platforms = Array.from(new Set(analytics.map(r => r.platform)));
  const platformStats = platforms.map(p => {
    const rows = analytics.filter(r => r.platform === p);
    const imps = rows.reduce((s, r) => s + (r.impressions || 0), 0);
    const engs = rows.reduce((s, r) => s + (r.engagement || 0), 0);
    const ctr = imps > 0 ? (engs / imps) * 100 : 0;
    return { platform: p, count: rows.length, impressions: imps, engagement: engs, ctr };
  }).sort((a, b) => b.impressions - a.impressions);

  platformStats.forEach((stat) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text(stat.platform, 23, currentY + 5.5);
    doc.text(stat.count.toString(), 65, currentY + 5.5);
    doc.text(stat.impressions.toLocaleString(), 95, currentY + 5.5);
    doc.text(stat.engagement.toLocaleString(), 135, currentY + 5.5);
    doc.text(`${stat.ctr.toFixed(2)}%`, 170, currentY + 5.5);

    // subtle separator row
    doc.setDrawColor(241, 245, 249);
    doc.line(20, currentY + 8, 190, currentY + 8);
    currentY += 8;
  });

  currentY += 6;

  // Best Post Timing and Format
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("2. Strategic Timing & Format Recommendations", 20, currentY);
  currentY += 6;

  // Calculate best times
  const dayCTRMap: Record<string, { imps: number, engs: number }> = {};
  const typeCTRMap: Record<string, { imps: number, engs: number }> = {};

  analytics.forEach(row => {
    if (row.dayOfWeek) {
      if (!dayCTRMap[row.dayOfWeek]) dayCTRMap[row.dayOfWeek] = { imps: 0, engs: 0 };
      dayCTRMap[row.dayOfWeek].imps += row.impressions || 0;
      dayCTRMap[row.dayOfWeek].engs += row.engagement || 0;
    }
    if (row.type) {
      if (!typeCTRMap[row.type]) typeCTRMap[row.type] = { imps: 0, engs: 0 };
      typeCTRMap[row.type].imps += row.impressions || 0;
      typeCTRMap[row.type].engs += row.engagement || 0;
    }
  });

  let bestDay = "N/A";
  let maxDayCTR = -1;
  Object.keys(dayCTRMap).forEach(day => {
    const { imps, engs } = dayCTRMap[day];
    const ctr = imps > 0 ? (engs / imps) * 100 : 0;
    if (ctr > maxDayCTR) {
      maxDayCTR = ctr;
      bestDay = day;
    }
  });

  let bestType = "N/A";
  let maxTypeCTR = -1;
  Object.keys(typeCTRMap).forEach(type => {
    const { imps, engs } = typeCTRMap[type];
    const ctr = imps > 0 ? (engs / imps) * 100 : 0;
    if (ctr > maxTypeCTR) {
      maxTypeCTR = ctr;
      bestType = type;
    }
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("OPTIMAL POSTING SCHEDULE", 25, currentY + 4);
  doc.text("HIGHEST ENGAGING FORMAT", 110, currentY + 4);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`• Peak Day: ${bestDay} (${maxDayCTR.toFixed(1)}% Avg CTR)`, 25, currentY);
  doc.text(`• Peak Format: ${bestType} (${maxTypeCTR.toFixed(1)}% Avg CTR)`, 110, currentY);
  
  currentY += 12;

  // Page break for Top Posts Table and Audit Recommendations
  doc.addPage();
  currentY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("3. Top Performing Content Pieces", 20, currentY);
  currentY += 6;

  // Headers for Content
  doc.setFillColor(241, 245, 249);
  doc.rect(20, currentY, 170, 8, "F");
  doc.setDrawColor(203, 213, 225);
  doc.line(20, currentY + 8, 190, currentY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("POST TITLE / HOOK", 23, currentY + 5.5);
  doc.text("CHANNEL", 100, currentY + 5.5);
  doc.text("IMPRESSIONS", 130, currentY + 5.5);
  doc.text("ENG. RATE", 165, currentY + 5.5);

  currentY += 8;

  const topPosts = [...analytics].sort((a, b) => b.impressions - a.impressions).slice(0, 5);
  topPosts.forEach((post) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    const titleText = post.title.length > 38 ? post.title.substring(0, 35) + "..." : post.title;
    doc.text(titleText, 23, currentY + 5.5);
    doc.text(post.platform, 100, currentY + 5.5);
    doc.text(post.impressions.toLocaleString(), 130, currentY + 5.5);
    doc.text(`${post.engagementRate.toFixed(2)}%`, 165, currentY + 5.5);

    doc.setDrawColor(241, 245, 249);
    doc.line(20, currentY + 8, 190, currentY + 8);
    currentY += 8;
  });

  currentY += 10;

  // Section 4: Audit & Strategic Action Points
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("4. Tactical Executive Recommendations", 20, currentY);
  currentY += 6;

  const recs = [
    `Double-down on ${bestType} content since it drives an impressive average CTR of ${maxTypeCTR.toFixed(1)}%. Allocate 60% of brand production capacity to this format.`,
    `Optimize the queue calendar around ${bestDay}. Schedule critical operational announcements and high-value marketing campaigns to go live on this weekday.`,
    `Refine underperforming channels. Platforms lagging behind the average brand CTR of ${avgEngagementRate.toFixed(1)}% should be audited to adjust creative alignment or voice frequency.`,
    `Export briefs based on these performance metrics. The Content Calendar should sync to target the calculated optimal times to maximize overall workspace ROI.`
  ];

  recs.forEach((rec, idx) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`[0${idx + 1}]`, 20, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    
    const splitRec = doc.splitTextToSize(rec, 155);
    doc.text(splitRec, 32, currentY);
    currentY += (splitRec.length * 4.5) + 5;
  });

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(`N.O.K Os Brand Workspace Automation Suite · Confidential Report`, 20, 285);

  return doc;
};

/**
 * Generates an executive landscape PDF export of the Master Content Calendar & Approval Grid
 */
export const generateCalendarPDF = (
  brand: Brand | null,
  briefs: CreativeBrief[],
  monthName: string,
  year: number,
  shareUrl?: string
): jsPDF => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const brandName = brand?.name || "Brand Workspace";
  const brandTagline = brand?.tagline || "Master Content Operations";
  const primaryColor = [15, 23, 42]; // Slate-900
  const goldAccent = [176, 141, 87]; // N.O.K Gold #B08D57
  const textColor = [51, 65, 85]; // Slate-700
  const darkTextColor = [15, 23, 42]; // Slate-900

  // Page 1: Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 297, 28, "F");

  // Gold accent line
  doc.setFillColor(goldAccent[0], goldAccent[1], goldAccent[2]);
  doc.rect(0, 28, 297, 1.5, "F");

  // Brand Name & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(`${brandName.toUpperCase()} — CONTENT CALENDAR & APPROVAL MATRIX`, 15, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`${monthName} ${year} Editorial Roadmap  ·  ${brandTagline}`, 15, 19);

  // Timestamp on top right
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(176, 141, 87);
  doc.text(`N.O.K OS CLIENT REVIEW EXPORT  ·  GENERATED: ${new Date().toLocaleDateString()}`, 282, 12, { align: "right" });

  let currentY = 36;

  // Stats & Status Bar
  const totalCount = briefs.length;
  const approvedCount = briefs.filter(b => b.status === "Approved").length;
  const proposedCount = briefs.filter(b => b.status === "Proposed").length;
  const changesCount = briefs.filter(b => b.status === "Changes Requested").length;

  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(15, currentY, 267, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`TOTAL CAMPAIGN ASSETS: ${totalCount}`, 20, currentY + 9);

  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`• APPROVED: ${approvedCount}`, 90, currentY + 9);

  doc.setTextColor(59, 130, 246); // Blue
  doc.text(`• PROPOSED / AWAITING: ${proposedCount}`, 145, currentY + 9);

  doc.setTextColor(217, 119, 6); // Amber
  doc.text(`• CHANGES REQUESTED: ${changesCount}`, 215, currentY + 9);

  currentY += 18;

  // If shareUrl provided, render an approval link callout box
  if (shareUrl) {
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(176, 141, 87);
    doc.roundedRect(15, currentY, 267, 13, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(176, 141, 87);
    doc.text("INTERACTIVE CLIENT APPROVAL LINK:", 20, currentY + 5.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(shareUrl, 20, currentY + 10);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("(Open this secure link to approve days or type revision notes with zero login required)", 280, currentY + 8, { align: "right" });

    currentY += 17;
  }

  // Weeks & Content Grid Table
  const weekNumbers = [1, 2, 3, 4];
  
  weekNumbers.forEach((weekNum) => {
    const weekBriefs = briefs.filter(b => (b.weekNumber || 1) === weekNum);
    if (weekBriefs.length === 0) return;

    if (currentY > 170) {
      doc.addPage();
      currentY = 20;
    }

    // Week Section Title
    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, 267, 7, "F");
    doc.setDrawColor(203, 213, 225);
    doc.line(15, currentY + 7, 282, currentY + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`WEEK 0${weekNum} CONTENT DELIVERABLES (${weekBriefs.length} scheduled assets)`, 18, currentY + 5);

    currentY += 10;

    // Table Column Headers
    doc.setFillColor(248, 250, 252);
    doc.rect(15, currentY, 267, 6, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("DAY / DATE", 18, currentY + 4.5);
    doc.text("CHANNEL", 50, currentY + 4.5);
    doc.text("FORMAT", 75, currentY + 4.5);
    doc.text("PILLAR & GOAL", 105, currentY + 4.5);
    doc.text("TOPIC / HOOK / BRIEF TITLE", 145, currentY + 4.5);
    doc.text("STATUS", 250, currentY + 4.5);

    currentY += 8;

    weekBriefs.forEach((brief) => {
      if (currentY > 185) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
      
      const dayLabel = `${brief.dayOfWeek || "Scheduled"} ${brief.date ? `(${brief.date})` : ""}`;
      doc.text(dayLabel, 18, currentY + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);

      const channel = (brief.platform || "Instagram").split(",")[0].trim();
      doc.text(channel, 50, currentY + 4);

      const format = (brief.postType || brief.formatSpec || brief.deliverables || "Post").substring(0, 15);
      doc.text(format, 75, currentY + 4);

      const pillarGoal = `${brief.contentPillar || "Marketing"}${brief.mainFocus ? ` (${brief.mainFocus})` : ""}`;
      doc.text(pillarGoal.substring(0, 22), 105, currentY + 4);

      const title = (brief.topicIdea || brief.title || "Campaign Asset").substring(0, 58);
      doc.text(title, 145, currentY + 4);

      // Status Pill
      doc.setFont("helvetica", "bold");
      if (brief.status === "Approved") {
        doc.setTextColor(16, 185, 129);
        doc.text("APPROVED", 250, currentY + 4);
      } else if (brief.status === "Changes Requested") {
        doc.setTextColor(217, 119, 6);
        doc.text("CHANGES REQ", 250, currentY + 4);
      } else {
        doc.setTextColor(59, 130, 246);
        doc.text("PROPOSED", 250, currentY + 4);
      }

      // Bottom row divider
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 6.5, 282, currentY + 6.5);
      currentY += 7.5;
    });

    currentY += 4;
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`N.O.K OS · Content Calendar Static Backup · Confidential Client Document`, 15, 202);
    doc.text(`Page ${i} of ${pageCount}`, 282, 202, { align: "right" });
  }

  return doc;
};

export const getCalendarPdfBase64 = async (params: {
  brand: Brand | null;
  briefs: CreativeBrief[];
  monthName: string;
  year: number;
  shareUrl?: string;
}): Promise<string> => {
  const doc = generateCalendarPDF(
    params.brand,
    params.briefs,
    params.monthName,
    params.year,
    params.shareUrl
  );
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1] || "";
};

export const downloadCalendarPDF = (
  brand: Brand | null,
  briefs: CreativeBrief[],
  monthName: string,
  year: number,
  shareUrl?: string
) => {
  const doc = generateCalendarPDF(brand, briefs, monthName, year, shareUrl);
  const brandSlug = (brand?.name || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  doc.save(`${brandSlug}_content_calendar_${monthName.toLowerCase()}_${year}.pdf`);
};

