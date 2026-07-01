import { jsPDF } from "jspdf";
import { CreativeBrief } from "../lib/firebase";

export const generateBriefPDF = (brief: CreativeBrief, brandName?: string): jsPDF => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Color Palette - Solid & high contrast professional design
  const primaryColor = [15, 23, 42]; // Slate-900
  const accentColor = [124, 58, 237]; // Violet-600
  const textColor = [51, 65, 85]; // Slate-700
  const darkTextColor = [15, 23, 42]; // Slate-900
  const warningColor = [194, 65, 12]; // Orange-700 for placeholders

  let currentY = 20;

  // 1. HEADER (Metadata in a subtle, high-contrast, clean top-bar)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const bName = (brandName || "N.O.K. SOCIAL").toUpperCase();
  const bStatus = (brief.status || "DRAFT — FOR REVIEW").toUpperCase();
  const bId = (brief.campaignId || brief.id.substring(0, 8)).toUpperCase();
  const bDate = brief.date || new Date().toLocaleDateString();
  
  doc.text(`BRAND: ${bName}`, 20, currentY);
  doc.text(`STATUS: ${bStatus}`, 70, currentY);
  doc.text(`ID: ${bId}`, 130, currentY);
  doc.text(`DATE: ${bDate}`, 170, currentY);
  
  currentY += 8;

  // Title line header label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("CREATIVE CAMPAIGN BRIEF", 20, currentY);
  currentY += 6;

  // 2. CAMPAIGN TITLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  
  // Word wrap title if too long
  const splitTitle = doc.splitTextToSize(brief.title || "Untitled Campaign Spec", 170);
  doc.text(splitTitle, 20, currentY);
  currentY += (splitTitle.length * 8);

  // Sequence position sub-title
  const seqPos = brief.sequencePosition || "Campaign 1 of 1 — Active content specification";
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(seqPos, 20, currentY);
  currentY += 8;

  // Horizontal separator line (thick, solid design-forward rule)
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(20, currentY, 170, 1.5, "F");
  currentY += 10;

  // Draw section helper with auto page-break
  const drawSection = (title: string, content: string, isWarning: boolean = false) => {
    // Check if we need to insert page break (estimate split text height first)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitContent = doc.splitTextToSize(content || "N/A", 170);
    const estimatedHeight = 12 + (splitContent.length * 5.2);

    if (currentY + estimatedHeight > 270) {
      doc.addPage();
      currentY = 20;
    }

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(title.toUpperCase(), 20, currentY);
    currentY += 4;

    // Split text content rendering
    doc.setFont("helvetica", isWarning ? "italic" : "normal");
    doc.setFontSize(10);
    doc.setTextColor(
      isWarning ? warningColor[0] : textColor[0], 
      isWarning ? warningColor[1] : textColor[1], 
      isWarning ? warningColor[2] : textColor[2]
    );

    doc.text(splitContent, 20, currentY);
    currentY += (splitContent.length * 5.2) + 8;
  };

  // 3. CAMPAIGN OBJECTIVE
  drawSection("Campaign Objective", brief.objective || "Drive engagement and qualified profile visits by establishing brand authority with metrics.");

  // 4. TARGET AUDIENCE
  drawSection("Target Audience", brief.targetAudience || "Modern business leaders and managers seeking structured scaling frameworks.");

  // 5. CORE POSITIONING COPY / KEY MESSAGE
  drawSection("Core Positioning Copy / Key Message", `"${brief.keyMessage || "Positioning intelligence fuels brand growth."}"`);

  // 6. PROOF POINT / DATA SOURCE
  const proofText = brief.proofPoint || "PLACEHOLDER — needs real data before publishing. Use pilot client metrics or team benchmark case study.";
  const isPlaceholderProof = proofText.toLowerCase().includes("placeholder");
  drawSection("Proof Point / Data Source", proofText, isPlaceholderProof);

  // 7. FORMAT & TECHNICAL SPEC
  const specText = brief.formatSpec || "Platform: LinkedIn | Format: Native document post (carousel) | Dimensions: 1080 x 1350 px, portrait (4:5) | Slide Count: 7 slides";
  drawSection("Format & Technical Spec", specText);

  // 8. CONTENT OUTLINE
  const outlineText = brief.contentOutline || "1. Cover hook intro | 2. State the primary market bottleneck | 3. Present data-driven evidence | 4. Reveal core action framework | 5. Wrap with conversion-oriented Call to Action";
  drawSection("Content Outline", outlineText);

  // 9. CALL TO ACTION
  drawSection("Call to Action", brief.cta || "Comment 'STRATEGY' below and our lead partner will DM you the template worksheet.");

  // 10. TONE & VISUAL REFERENCE
  const toneText = brief.toneVisualRef || "Tone: direct, confident, slightly contrarian. Visual: solid brand color background with high contrast display typography.";
  drawSection("Tone & Visual Reference", toneText);

  // 11. SUCCESS METRIC / KPI TARGET
  drawSection("Success Metric / KPI Target", brief.successMetric || ">= 2.5% engagement rate and >= 15 bookmarks within 7 days of publication.");

  // 12. DELIVERABLES & SCOPE
  drawSection("Deliverables & Scope", brief.deliverables || "1x LinkedIn document post (7-slide carousel)");

  // 13. APPROVER
  drawSection("Approver", `Signed off by: ${brief.approver || "Osei — final sign-off before brief is released to designer."}`);

  // Elegant bottom footer on current page
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(`Generated via Creative Briefs Desk template v2 (execution-ready format) · ${bName}`, 20, 285);

  return doc;
};
