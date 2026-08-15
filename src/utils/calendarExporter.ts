import ExcelJS from "exceljs";
import { Brand, CreativeBrief, CalendarEvent, CampaignQueue } from "../lib/firebase";
import { GoogleCalendarEvent } from "./googleCalendar";

export interface CalendarExportOptions {
  brand: Brand | null;
  briefs: CreativeBrief[];
  calendarEvents: CalendarEvent[];
  queues: CampaignQueue[];
  googleEvents?: GoogleCalendarEvent[];
  selectedDate?: string | null;
  monthName?: string;
  year?: number;
}

/**
 * Maps a hex color string to ARGB hex format required by ExcelJS (e.g. #4F46E5 -> FF4F46E5)
 */
const toArgb = (hex: string, fallback = "FF4F46E5"): string => {
  if (!hex) return fallback;
  const clean = hex.replace("#", "").toUpperCase();
  if (clean.length === 6) return `FF${clean}`;
  if (clean.length === 8) return clean;
  return fallback;
};

/**
 * Builds a styled, multi-tab Microsoft Excel / Google Sheets compatible workbook.
 */
export const buildStyledCalendarWorkbook = async (options: CalendarExportOptions): Promise<ExcelJS.Workbook> => {
  const { brand, briefs, calendarEvents, queues, googleEvents = [], selectedDate, monthName, year } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "N.O.K Social OS";
  workbook.lastModifiedBy = "N.O.K Marketing Planner";
  workbook.created = new Date();
  workbook.modified = new Date();

  const brandName = brand?.name || "Active Brand";
  const brandTagline = brand?.tagline || "Strategic Social & Campaign Operations";
  const brandPrimaryHex = brand?.primaryColor === "emerald" 
    ? "FF059669" 
    : brand?.primaryColor === "rose" 
    ? "FFE11D48" 
    : brand?.primaryColor === "amber" 
    ? "FFD97706" 
    : "FF4F46E5"; // Default Indigo/Violet

  const dateHeading = monthName && year 
    ? `${monthName} ${year}` 
    : selectedDate 
    ? `Schedule for ${selectedDate}` 
    : `Master Content Roadmap (${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })})`;

  // =========================================================================
  // TAB 1: APPROVED CREATIVE BRIEFS & MASTER CONTENT CALENDAR
  // =========================================================================
  const sheet1 = workbook.addWorksheet("Approved Briefs & Calendar", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 5 }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 }
  });

  // Set column configurations
  sheet1.columns = [
    { key: "campaignId", width: 16 },
    { key: "date", width: 14 },
    { key: "dayOfWeek", width: 13 },
    { key: "title", width: 34 },
    { key: "formatSpec", width: 26 },
    { key: "channel", width: 16 },
    { key: "status", width: 15 },
    { key: "objective", width: 42 },
    { key: "targetAudience", width: 36 },
    { key: "keyMessage", width: 44 },
    { key: "cta", width: 30 },
    { key: "approver", width: 16 },
    { key: "deliverables", width: 32 },
    { key: "successMetric", width: 24 },
    { key: "proofPoint", width: 30 },
    { key: "contentOutline", width: 50 },
  ];

  // 1. Title Banner Row (Merged A1:P1)
  sheet1.mergeCells("A1:P1");
  const titleCell = sheet1.getCell("A1");
  titleCell.value = `${brandName.toUpperCase()} — CONTENT CALENDAR & APPROVED BRIEFS`;
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: brandPrimaryHex } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet1.getRow(1).height = 36;

  // 2. Subtitle / Metadata Row (Merged A2:P2)
  sheet1.mergeCells("A2:P2");
  const subCell = sheet1.getCell("A2");
  const approvedCount = briefs.filter(b => b.status === "Approved").length;
  subCell.value = `Target Period: ${dateHeading}  |  Tagline: "${brandTagline}"  |  Total Approved Briefs: ${approvedCount} of ${briefs.length}  |  Generated: ${new Date().toLocaleString()}`;
  subCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FFE2E8F0" } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } }; // Dark Slate
  subCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet1.getRow(2).height = 22;

  // 3. Quick Stats Ribbon (Row 3)
  sheet1.mergeCells("A3:D3");
  sheet1.getCell("A3").value = `📊 Total Calendar Milestones: ${calendarEvents.length}`;
  sheet1.getCell("A3").font = { bold: true, size: 9, color: { argb: "FF334155" } };
  sheet1.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  sheet1.getCell("A3").alignment = { vertical: "middle", horizontal: "center" };

  sheet1.mergeCells("E3:H3");
  sheet1.getCell("E3").value = `✅ Approved Execution Briefs: ${approvedCount}`;
  sheet1.getCell("E3").font = { bold: true, size: 9, color: { argb: "FF15803D" } };
  sheet1.getCell("E3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
  sheet1.getCell("E3").alignment = { vertical: "middle", horizontal: "center" };

  sheet1.mergeCells("I3:L3");
  sheet1.getCell("I3").value = `🚀 Scheduled Queue Posts: ${queues.length}`;
  sheet1.getCell("I3").font = { bold: true, size: 9, color: { argb: "FF0369A1" } };
  sheet1.getCell("I3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0F2FE" } };
  sheet1.getCell("I3").alignment = { vertical: "middle", horizontal: "center" };

  sheet1.mergeCells("M3:P3");
  sheet1.getCell("M3").value = `📅 Google Sync Events: ${googleEvents.length}`;
  sheet1.getCell("M3").font = { bold: true, size: 9, color: { argb: "FF4338CA" } };
  sheet1.getCell("M3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
  sheet1.getCell("M3").alignment = { vertical: "middle", horizontal: "center" };
  sheet1.getRow(3).height = 20;

  // 4. Blank spacer row
  sheet1.getRow(4).height = 10;

  // 5. Table Header Row (Row 5)
  const headers = [
    "Campaign ID",
    "Release Date",
    "Day of Week",
    "Campaign / Asset Title",
    "Format & Dimensions Spec",
    "Channel / Platform",
    "Approval Status",
    "Campaign Objective",
    "Target Audience Persona",
    "Core Message / Hook",
    "Call To Action (CTA)",
    "Approver Sign-Off",
    "Deliverables & Scope",
    "Target Success Metric",
    "Proof Point / Data Source",
    "Content Outline (Slide/Beat breakdown)"
  ];

  const headerRow = sheet1.getRow(5);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } }; // Dark Navy Header
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF334155" } },
      right: { style: "thin", color: { argb: "FF334155" } }
    };
  });
  headerRow.height = 28;

  // Sort briefs: Approved first, then by date
  const sortedBriefs = [...briefs].sort((a, b) => {
    if (a.status === "Approved" && b.status !== "Approved") return -1;
    if (b.status === "Approved" && a.status !== "Approved") return 1;
    return (a.date || "").localeCompare(b.date || "");
  });

  // Populate Briefs Rows
  let currentRowIndex = 6;
  sortedBriefs.forEach((brief) => {
    const dateVal = brief.date || "2026-07-01";
    let dayOfWeekStr = "—";
    try {
      const parsedDate = new Date(dateVal);
      if (!isNaN(parsedDate.getTime())) {
        dayOfWeekStr = parsedDate.toLocaleDateString("en-US", { weekday: "short" });
      }
    } catch {
      // ignore
    }

    const row = sheet1.getRow(currentRowIndex);
    const isApproved = brief.status === "Approved";
    const isEven = currentRowIndex % 2 === 0;

    const rowBg = isApproved 
      ? (isEven ? "FFF0FDF4" : "FFFFFFFF") // Light green tint for approved
      : (isEven ? "FFF8FAFC" : "FFFFFFFF");

    row.values = [
      brief.campaignId || `NOK-${brief.id.slice(0, 5).toUpperCase()}`,
      dateVal,
      dayOfWeekStr,
      brief.title,
      brief.formatSpec || "Standard Document Carousel (1080x1350)",
      brief.formatSpec?.includes("LinkedIn") ? "LinkedIn" : brief.formatSpec?.includes("Instagram") ? "Instagram" : "Multi-Channel",
      brief.status || "Draft",
      brief.objective || "—",
      brief.targetAudience || "—",
      brief.keyMessage || "—",
      brief.cta || "—",
      brief.approver || "Business Owner",
      brief.deliverables || "1x Carousel Asset",
      brief.successMetric || ">= 2.5% Engagement",
      brief.proofPoint || "—",
      brief.contentOutline || "—"
    ];

    // Apply styling to every cell in the data row
    for (let c = 1; c <= 16; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: rowBg } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      if (c === 2 || c === 3 || c === 6 || c === 12) {
        cell.alignment = { vertical: "top", horizontal: "center" };
      } else if (c === 7) {
        // Status Column special badge styling
        cell.alignment = { vertical: "top", horizontal: "center" };
        if (brief.status === "Approved") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } }; // Green
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF15803D" } };
        } else if (brief.status === "In Progress") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } }; // Amber
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFB45309" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }; // Gray
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF475569" } };
        }
      } else if (c === 4) {
        cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      } else {
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      }
    }

    row.height = 42;
    currentRowIndex++;
  });

  // If no briefs exist, add a helpful placeholder row
  if (sortedBriefs.length === 0) {
    const emptyRow = sheet1.getRow(currentRowIndex);
    sheet1.mergeCells(`A${currentRowIndex}:P${currentRowIndex}`);
    emptyRow.getCell(1).value = "No creative briefs created yet. Add creative briefs in the Briefs tab to schedule them here.";
    emptyRow.getCell(1).font = { italic: true, color: { argb: "FF64748B" } };
    emptyRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    emptyRow.height = 30;
    currentRowIndex++;
  }

  // =========================================================================
  // TAB 2: SOCIAL QUEUE & SCHEDULED POSTS
  // =========================================================================
  const sheet2 = workbook.addWorksheet("Social Queue & Posts", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
  });

  sheet2.columns = [
    { key: "date", width: 18 },
    { key: "channel", width: 16 },
    { key: "title", width: 34 },
    { key: "content", width: 55 },
    { key: "status", width: 18 },
    { key: "estReach", width: 18 },
    { key: "engRate", width: 18 },
  ];

  // Title Banner
  sheet2.mergeCells("A1:G1");
  const qTitle = sheet2.getCell("A1");
  qTitle.value = `${brandName.toUpperCase()} — SOCIAL POSTS & MULTI-CHANNEL QUEUE`;
  qTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  qTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0284C7" } }; // Sky Blue
  qTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet2.getRow(1).height = 32;

  sheet2.mergeCells("A2:G2");
  sheet2.getCell("A2").value = `Total Queue Items: ${queues.length} | Auto-synced with N.O.K Publishing Engine`;
  sheet2.getCell("A2").font = { italic: true, size: 9, color: { argb: "FFE0F2FE" } };
  sheet2.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0C4A6E" } };
  sheet2.getCell("A2").alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet2.getRow(2).height = 20;

  sheet2.getRow(3).height = 8;

  // Queue Header Row
  const qHeaders = ["Scheduled Time", "Platform Channel", "Post Title / Hook", "Copy & Caption Body", "Delivery Status", "Est. Reach", "Target Engagement"];
  const qHeaderRow = sheet2.getRow(4);
  qHeaders.forEach((h, idx) => {
    const cell = qHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } }
    };
  });
  qHeaderRow.height = 26;

  queues.forEach((q, idx) => {
    const row = sheet2.getRow(5 + idx);
    const isPosted = q.status === "posted" || q.status === "completed";
    const isFailed = q.status === "wasn't posted";

    row.values = [
      q.scheduledTime || "Scheduled",
      q.channel,
      q.title,
      q.content,
      q.status.toUpperCase(),
      q.metrics?.estimatedReach ? `${q.metrics.estimatedReach.toLocaleString()} est.` : "—",
      q.metrics?.engagementRate ? `${q.metrics.engagementRate}%` : "—"
    ];

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      if (c === 1 || c === 2 || c === 6 || c === 7) {
        cell.alignment = { vertical: "top", horizontal: "center" };
      } else if (c === 5) {
        cell.alignment = { vertical: "top", horizontal: "center" };
        if (isPosted) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF15803D" } };
        } else if (isFailed) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFB91C1C" } };
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
          cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFB45309" } };
        }
      } else {
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      }
    }
    row.height = 36;
  });

  // =========================================================================
  // TAB 3: OPERATIONAL ROADMAP & MILESTONES
  // =========================================================================
  const sheet3 = workbook.addWorksheet("Roadmap Milestones", {
    views: [{ showGridLines: true, state: "frozen", ySplit: 4 }]
  });

  sheet3.columns = [
    { key: "date", width: 16 },
    { key: "title", width: 38 },
    { key: "type", width: 18 },
    { key: "status", width: 18 },
    { key: "notes", width: 55 },
  ];

  sheet3.mergeCells("A1:E1");
  const mTitle = sheet3.getCell("A1");
  mTitle.value = `${brandName.toUpperCase()} — OPERATIONAL MILESTONE MATRIX`;
  mTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  mTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }; // Emerald Green
  mTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet3.getRow(1).height = 32;

  sheet3.mergeCells("A2:E2");
  sheet3.getCell("A2").value = `Synchronized Milestones, Campaign Launches, and Google Calendar Alignments`;
  sheet3.getCell("A2").font = { italic: true, size: 9, color: { argb: "FFD1FAE5" } };
  sheet3.getCell("A2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
  sheet3.getCell("A2").alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet3.getRow(2).height = 20;

  sheet3.getRow(3).height = 8;

  const mHeaders = ["Target Date", "Milestone Title", "Category / Type", "Validation State", "Operational Brief Notes"];
  const mHeaderRow = sheet3.getRow(4);
  mHeaders.forEach((h, idx) => {
    const cell = mHeaderRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "medium", color: { argb: "FF000000" } },
      bottom: { style: "medium", color: { argb: "FF000000" } }
    };
  });
  mHeaderRow.height = 26;

  calendarEvents.forEach((evt, idx) => {
    const row = sheet3.getRow(5 + idx);
    row.values = [
      evt.date,
      evt.title,
      evt.type,
      evt.status,
      evt.notes || "—"
    ];

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF0F172A" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };

      if (c === 1 || c === 3 || c === 4) {
        cell.alignment = { vertical: "top", horizontal: "center" };
      } else {
        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };
      }
    }
    row.height = 30;
  });

  return workbook;
};

/**
 * Downloads the styled Content Calendar as a Microsoft Excel / Google Sheets workbook (.xlsx)
 */
export const downloadCalendarExcel = async (options: CalendarExportOptions): Promise<void> => {
  const workbook = await buildStyledCalendarWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();
  
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
  });
  
  const safeBrand = (options.brand?.name || "brand").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Content_Calendar_${safeBrand}_${dateStr}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads the calendar as a standard CSV format (compatible with Google Sheets direct import)
 */
export const downloadCalendarCSV = (options: CalendarExportOptions): void => {
  const { briefs, brand } = options;
  
  const headers = [
    "Campaign ID",
    "Release Date",
    "Campaign Title",
    "Format Spec",
    "Approval Status",
    "Campaign Objective",
    "Target Audience",
    "Key Message",
    "Call to Action",
    "Approver",
    "Deliverables",
    "Success Metric",
    "Content Outline"
  ];

  const rows = briefs.map(b => [
    `"${(b.campaignId || "").replace(/"/g, '""')}"`,
    `"${(b.date || "").replace(/"/g, '""')}"`,
    `"${(b.title || "").replace(/"/g, '""')}"`,
    `"${(b.formatSpec || "").replace(/"/g, '""')}"`,
    `"${(b.status || "Draft").replace(/"/g, '""')}"`,
    `"${(b.objective || "").replace(/"/g, '""')}"`,
    `"${(b.targetAudience || "").replace(/"/g, '""')}"`,
    `"${(b.keyMessage || "").replace(/"/g, '""')}"`,
    `"${(b.cta || "").replace(/"/g, '""')}"`,
    `"${(b.approver || "").replace(/"/g, '""')}"`,
    `"${(b.deliverables || "").replace(/"/g, '""')}"`,
    `"${(b.successMetric || "").replace(/"/g, '""')}"`,
    `"${(b.contentOutline || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  
  const safeBrand = (brand?.name || "brand").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Content_Calendar_${safeBrand}_${dateStr}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Returns Base64 and metadata of the styled Excel workbook to attach to Gmail API requests
 */
export const getCalendarExcelBase64 = async (
  options: CalendarExportOptions
): Promise<{ base64: string; fileName: string; mimeType: string }> => {
  const workbook = await buildStyledCalendarWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();
  
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  const safeBrand = (options.brand?.name || "brand").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `Content_Calendar_${safeBrand}_${dateStr}.xlsx`;

  return {
    base64,
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
};
