import React, { useState, useMemo } from "react";
import { useBrand } from "../context/BrandContext";
import { cleanAndNormalizeData } from "../utils/dataCleaner";
import { 
  Brain, 
  Sparkles, 
  Download, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Layers, 
  Database, 
  Calendar, 
  Flame, 
  CheckCircle2, 
  Search, 
  Activity, 
  ArrowUpRight, 
  Clock, 
  FileSpreadsheet, 
  RefreshCw,
  Award,
  Milestone,
  UploadCloud,
  Check,
  Plus,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Globe,
  MousePointerClick,
  UserPlus,
  Target,
  Eye
} from "lucide-react";
import { generatePerformanceReportPDF } from "../utils/pdfGenerator";
import { RawAnalyticsRow } from "../lib/firebase";

// High-fidelity pre-seeded data generator tailored by Brand ID for the workspace Sandbox
const getDemoDataForBrand = (brandId: string): RawAnalyticsRow[] => {
  const now = new Date();
  const timestamp = now.toISOString();

  if (brandId === "acme-corp") {
    return [
      { id: "demo-acme-1", brandId: "acme-corp", title: "Enterprise SaaS V2 Platform Launch Guide", platform: "LinkedIn", type: "Carousel", impressions: 145000, engagement: 8200, engagementRate: 5.65, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 4500, comments: 1650, saves: 1150, shares: 900, reach: 139000, profileVisits: 3600, follows: 580 },
      { id: "demo-acme-2", brandId: "acme-corp", title: "Sub-second database replication micro-benchmarks", platform: "LinkedIn", type: "Text", impressions: 85000, engagement: 4100, engagementRate: 4.82, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 2300, comments: 850, saves: 550, shares: 400, reach: 81000, profileVisits: 2040, follows: 290 },
      { id: "demo-acme-3", brandId: "acme-corp", title: "Why we abandoned Friday afternoon cloud deployments", platform: "LinkedIn", type: "Article", impressions: 120000, engagement: 6800, engagementRate: 5.67, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 3800, comments: 1400, saves: 900, shares: 700, reach: 114000, profileVisits: 2880, follows: 480 },
      { id: "demo-acme-4", brandId: "acme-corp", title: "Serverless scaling auto-recovery cold starts", platform: "Twitter/X", type: "Infographic", impressions: 45000, engagement: 2900, engagementRate: 6.44, createdAt: timestamp, dayOfWeek: "Thursday", likes: 1600, comments: 600, saves: 400, shares: 300, reach: 43000, profileVisits: 1080, follows: 200 },
      { id: "demo-acme-5", brandId: "acme-corp", title: "Unlocking 90% savings in pipeline idle compute spend", platform: "Twitter/X", type: "Text", impressions: 32000, engagement: 1800, engagementRate: 5.62, createdAt: timestamp, dayOfWeek: "Monday", likes: 1000, comments: 350, saves: 250, shares: 200, reach: 30500, profileVisits: 760, follows: 120 },
      { id: "demo-acme-6", brandId: "acme-corp", title: "Acme Cloud CLI multi-region deploy benchmark", platform: "Twitter/X", type: "Text", impressions: 28000, engagement: 1350, engagementRate: 4.82, createdAt: timestamp, dayOfWeek: "Friday", likes: 750, comments: 250, saves: 200, shares: 150, reach: 26800, profileVisits: 670, follows: 90 },
      { id: "demo-acme-7", brandId: "acme-corp", title: "SaaS Database Partitioning: Single vs Multi-Tenant", platform: "Newsletter", type: "Text", impressions: 22000, engagement: 4900, engagementRate: 22.27, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 2700, comments: 1000, saves: 700, shares: 500, reach: 21500, profileVisits: 520, follows: 340 },
      { id: "demo-acme-8", brandId: "acme-corp", title: "Zero-idle database partition configuration guidelines", platform: "Newsletter", type: "Text", impressions: 18000, engagement: 3800, engagementRate: 21.11, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 2100, comments: 800, saves: 500, shares: 400, reach: 17600, profileVisits: 430, follows: 260 },
      { id: "demo-acme-9", brandId: "acme-corp", title: "Modern serverless architecture migration walkthrough", platform: "YouTube", type: "Video", impressions: 110000, engagement: 9100, engagementRate: 8.27, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 5000, comments: 1900, saves: 1200, shares: 1000, reach: 105000, profileVisits: 2640, follows: 630 },
      { id: "demo-acme-10", brandId: "acme-corp", title: "Automating Kubernetes multi-tenant clusters", platform: "Facebook", type: "Video", impressions: 55000, engagement: 3100, engagementRate: 5.64, createdAt: timestamp, dayOfWeek: "Monday", likes: 1700, comments: 650, saves: 450, shares: 300, reach: 52000, profileVisits: 1320, follows: 210 },
      { id: "demo-acme-11", brandId: "acme-corp", title: "Why your Docker images are too bloated (Short)", platform: "TikTok", type: "Video", impressions: 185000, engagement: 16400, engagementRate: 8.86, createdAt: timestamp, dayOfWeek: "Thursday", likes: 9100, comments: 3400, saves: 2100, shares: 1800, reach: 180000, profileVisits: 4440, follows: 1150 },
      { id: "demo-acme-12", brandId: "acme-corp", title: "Introducing Acme Flow: Serverless workflows in 3 lines", platform: "Threads", type: "Text", impressions: 31000, engagement: 2100, engagementRate: 6.77, createdAt: timestamp, dayOfWeek: "Friday", likes: 1150, comments: 450, saves: 300, shares: 200, reach: 29500, profileVisits: 740, follows: 140 }
    ];
  } else if (brandId === "global-ind") {
    return [
      { id: "demo-global-1", brandId: "global-ind", title: "How we optimized oceanic cargo transport routing flows", platform: "YouTube", type: "Video", impressions: 240000, engagement: 19800, engagementRate: 8.25, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 11000, comments: 4100, saves: 2700, shares: 2000, reach: 232000, profileVisits: 5760, follows: 1380 },
      { id: "demo-global-2", brandId: "global-ind", title: "Scope-2 net-neutrality audit disclosure checklist", platform: "LinkedIn", type: "Article", impressions: 54000, engagement: 2100, engagementRate: 3.89, createdAt: timestamp, dayOfWeek: "Monday", likes: 1150, comments: 420, saves: 310, shares: 220, reach: 51000, profileVisits: 1290, follows: 140 },
      { id: "demo-global-3", brandId: "global-ind", title: "Integrating 400MW offshore wind energy into Eastern grids", platform: "LinkedIn", type: "Carousel", impressions: 135000, engagement: 7400, engagementRate: 5.48, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 4100, comments: 1480, saves: 1020, shares: 800, reach: 129000, profileVisits: 3240, follows: 510 },
      { id: "demo-global-4", brandId: "global-ind", title: "Our 10-year ESG commitment report card results", platform: "LinkedIn", type: "Infographic", impressions: 88000, engagement: 4100, engagementRate: 4.66, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 2250, comments: 820, saves: 570, shares: 460, reach: 84000, profileVisits: 2110, follows: 280 },
      { id: "demo-global-5", brandId: "global-ind", title: "Heavy freight carbon offset tracking automation", platform: "Twitter/X", type: "Text", impressions: 34000, engagement: 1900, engagementRate: 5.58, createdAt: timestamp, dayOfWeek: "Thursday", likes: 1050, comments: 380, saves: 260, shares: 210, reach: 32500, profileVisits: 810, follows: 130 },
      { id: "demo-global-6", brandId: "global-ind", title: "NetZero grid integration project update summary", platform: "Newsletter", type: "Text", impressions: 21000, engagement: 4500, engagementRate: 21.43, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 2470, comments: 900, saves: 630, shares: 500, reach: 20500, profileVisits: 500, follows: 310 },
      { id: "demo-global-7", brandId: "global-ind", title: "Streamlining global multi-commodity shipping networks", platform: "Twitter/X", type: "Text", impressions: 29000, engagement: 1400, engagementRate: 4.82, createdAt: timestamp, dayOfWeek: "Monday", likes: 770, comments: 280, saves: 190, shares: 160, reach: 27800, profileVisits: 690, follows: 90 },
      { id: "demo-global-8", brandId: "global-ind", title: "Optimizing trans-pacific fuel efficiency logistics", platform: "Facebook", type: "Article", impressions: 45000, engagement: 2200, engagementRate: 4.89, createdAt: timestamp, dayOfWeek: "Friday", likes: 1210, comments: 440, saves: 310, shares: 240, reach: 43000, profileVisits: 1080, follows: 150 },
      { id: "demo-global-9", brandId: "global-ind", title: "Eco-routing automation algorithm overview (Short)", platform: "TikTok", type: "Video", impressions: 95000, engagement: 8100, engagementRate: 8.53, createdAt: timestamp, dayOfWeek: "Thursday", likes: 4450, comments: 1620, saves: 1130, shares: 900, reach: 92000, profileVisits: 2280, follows: 560 },
      { id: "demo-global-10", brandId: "global-ind", title: "Green logistics roadmap for modern distribution networks", platform: "Threads", type: "Text", impressions: 21000, engagement: 1200, engagementRate: 5.71, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 660, comments: 240, saves: 170, shares: 130, reach: 20000, profileVisits: 500, follows: 80 }
    ];
  } else if (brandId === "horizon-tech") {
    return [
      { id: "demo-horizon-1", brandId: "horizon-tech", title: "Behind the scenes: Magnesium speaker resonance design", platform: "Instagram", type: "Video", impressions: 380000, engagement: 31200, engagementRate: 8.21, createdAt: timestamp, dayOfWeek: "Friday", likes: 17160, comments: 6240, saves: 4368, shares: 3432, reach: 365000, profileVisits: 9120, follows: 2184 },
      { id: "demo-horizon-2", brandId: "horizon-tech", title: "Acoustic room resonance vs minimal furniture footprint", platform: "Instagram", type: "Infographic", impressions: 190000, engagement: 14200, engagementRate: 7.47, createdAt: timestamp, dayOfWeek: "Thursday", likes: 7810, comments: 2840, saves: 1988, shares: 1562, reach: 182000, profileVisits: 4560, follows: 994 },
      { id: "demo-horizon-3", brandId: "horizon-tech", title: "Tactile natural linen soundboard pre-order launch teaser", platform: "Instagram", type: "Video", impressions: 420000, engagement: 36800, engagementRate: 8.76, createdAt: timestamp, dayOfWeek: "Friday", likes: 20240, comments: 7360, saves: 5152, shares: 4048, reach: 403000, profileVisits: 10080, follows: 2576 },
      { id: "demo-horizon-4", brandId: "horizon-tech", title: "Designing consumer electronics to respect daily tranquility", platform: "LinkedIn", type: "Article", impressions: 48000, engagement: 2200, engagementRate: 4.58, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 1210, comments: 440, saves: 308, shares: 242, reach: 46000, profileVisits: 1150, follows: 154 },
      { id: "demo-horizon-5", brandId: "horizon-tech", title: "Why we choose brushed magnesium alloy for acoustics", platform: "Twitter/X", type: "Text", impressions: 36000, engagement: 1950, engagementRate: 5.41, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 1070, comments: 390, saves: 273, shares: 217, reach: 34500, profileVisits: 860, follows: 136 },
      { id: "demo-horizon-6", brandId: "horizon-tech", title: "Horizon Light minimal home audio integration guide", platform: "Newsletter", type: "Text", impressions: 19000, engagement: 4200, engagementRate: 22.11, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 2310, comments: 840, saves: 588, shares: 462, reach: 18200, profileVisits: 450, follows: 294 },
      { id: "demo-horizon-7", brandId: "horizon-tech", title: "Premium spatial acoustics design reveal", platform: "Facebook", type: "Image", impressions: 95000, engagement: 6100, engagementRate: 6.42, createdAt: timestamp, dayOfWeek: "Monday", likes: 3350, comments: 1220, saves: 850, shares: 680, reach: 91000, profileVisits: 2280, follows: 420 },
      { id: "demo-horizon-8", brandId: "horizon-tech", title: "How minimal shapes enrich your daily living room (Short)", platform: "TikTok", type: "Video", impressions: 220000, engagement: 19400, engagementRate: 8.82, createdAt: timestamp, dayOfWeek: "Thursday", likes: 10670, comments: 3880, saves: 2710, shares: 2140, reach: 210000, profileVisits: 5280, follows: 1350 },
      { id: "demo-horizon-9", brandId: "horizon-tech", title: "Pre-orders open this Thursday. Set your notification timer.", platform: "Threads", type: "Text", impressions: 42000, engagement: 3100, engagementRate: 7.38, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 1700, comments: 620, saves: 430, shares: 350, reach: 40000, profileVisits: 1000, follows: 210 }
    ];
  } else {
    return [];
  }
};

// Post-campaign feedback performance simulation data for the comparison suite
const getDemoComparisonDataForBrand = (brandId: string): RawAnalyticsRow[] => {
  const now = new Date();
  const timestamp = now.toISOString();

  if (brandId === "acme-corp") {
    return [
      { id: "comp-acme-1", brandId: "acme-corp", title: "Enterprise SaaS V2 Platform Launch Guide (Post-Campaign)", platform: "LinkedIn", type: "Carousel", impressions: 168000, engagement: 10400, engagementRate: 6.19, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 5720, comments: 2080, saves: 1450, shares: 1150, reach: 161000, profileVisits: 4200, follows: 720 },
      { id: "comp-acme-2", brandId: "acme-corp", title: "Sub-second database replication micro-benchmarks (Post-Campaign)", platform: "LinkedIn", type: "Text", impressions: 98000, engagement: 5800, engagementRate: 5.91, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 3190, comments: 1160, saves: 810, shares: 640, reach: 94000, profileVisits: 2350, follows: 400 },
      { id: "comp-acme-3", brandId: "acme-corp", title: "Why we abandoned Friday afternoon cloud deployments (Post-Campaign)", platform: "LinkedIn", type: "Article", impressions: 142000, engagement: 8900, engagementRate: 6.27, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 4890, comments: 1780, saves: 1240, shares: 990, reach: 136000, profileVisits: 3400, follows: 620 },
      { id: "comp-acme-4", brandId: "acme-corp", title: "Serverless scaling auto-recovery cold starts (Post-Campaign)", platform: "Twitter/X", type: "Infographic", impressions: 56000, engagement: 4200, engagementRate: 7.50, createdAt: timestamp, dayOfWeek: "Thursday", likes: 2310, comments: 840, saves: 580, shares: 470, reach: 53000, profileVisits: 1340, follows: 290 },
      { id: "comp-acme-5", brandId: "acme-corp", title: "Unlocking 90% savings in pipeline idle compute spend (Post-Campaign)", platform: "Twitter/X", type: "Text", impressions: 41000, engagement: 2800, engagementRate: 6.82, createdAt: timestamp, dayOfWeek: "Monday", likes: 1540, comments: 560, saves: 390, shares: 310, reach: 39000, profileVisits: 980, follows: 190 },
      { id: "comp-acme-6", brandId: "acme-corp", title: "Acme Cloud CLI multi-region deploy benchmark (Post-Campaign)", platform: "Twitter/X", type: "Text", impressions: 34000, engagement: 2100, engagementRate: 6.17, createdAt: timestamp, dayOfWeek: "Friday", likes: 1150, comments: 420, saves: 290, shares: 240, reach: 32000, profileVisits: 810, follows: 140 },
      { id: "comp-acme-7", brandId: "acme-corp", title: "SaaS Database Partitioning: Single vs Multi-Tenant (Post-Campaign)", platform: "Newsletter", type: "Text", impressions: 26000, engagement: 6200, engagementRate: 23.84, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 3410, comments: 1240, saves: 860, shares: 690, reach: 25000, profileVisits: 620, follows: 430 },
      { id: "comp-acme-8", brandId: "acme-corp", title: "Zero-idle database partition configuration guidelines (Post-Campaign)", platform: "Newsletter", type: "Text", impressions: 21000, engagement: 4900, engagementRate: 23.33, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 2695, comments: 980, saves: 680, shares: 545, reach: 20000, profileVisits: 500, follows: 340 },
      { id: "comp-acme-9", brandId: "acme-corp", title: "Modern serverless architecture migration walkthrough (Post-Campaign)", platform: "YouTube", type: "Video", impressions: 130000, engagement: 11800, engagementRate: 9.07, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 6490, comments: 2360, saves: 1650, shares: 1300, reach: 124000, profileVisits: 3120, follows: 820 },
      { id: "comp-acme-10", brandId: "acme-corp", title: "Automating Kubernetes multi-tenant clusters (Post-Campaign)", platform: "Facebook", type: "Video", impressions: 68000, engagement: 4200, engagementRate: 6.18, createdAt: timestamp, dayOfWeek: "Monday", likes: 2310, comments: 840, saves: 580, shares: 470, reach: 64000, profileVisits: 1630, follows: 290 },
      { id: "comp-acme-11", brandId: "acme-corp", title: "Why your Docker images are too bloated (Post-Campaign)", platform: "TikTok", type: "Video", impressions: 210000, engagement: 21500, engagementRate: 10.24, createdAt: timestamp, dayOfWeek: "Thursday", likes: 11825, comments: 4300, saves: 3010, shares: 2365, reach: 204000, profileVisits: 5040, follows: 1505 },
      { id: "comp-acme-12", brandId: "acme-corp", title: "Introducing Acme Flow: Serverless workflows (Post-Campaign)", platform: "Threads", type: "Text", impressions: 38000, engagement: 2900, engagementRate: 7.63, createdAt: timestamp, dayOfWeek: "Friday", likes: 1595, comments: 580, saves: 400, shares: 325, reach: 36000, profileVisits: 910, follows: 200 }
    ];
  } else if (brandId === "global-ind") {
    return [
      { id: "comp-global-1", brandId: "global-ind", title: "How we optimized oceanic cargo transport routing flows (Post-Campaign)", platform: "YouTube", type: "Video", impressions: 275000, engagement: 24200, engagementRate: 8.80, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 13310, comments: 4840, saves: 3380, shares: 2670, reach: 264000, profileVisits: 6600, follows: 1690 },
      { id: "comp-global-2", brandId: "global-ind", title: "Scope-2 net-neutrality audit disclosure checklist (Post-Campaign)", platform: "LinkedIn", type: "Article", impressions: 62000, engagement: 2800, engagementRate: 4.51, createdAt: timestamp, dayOfWeek: "Monday", likes: 1540, comments: 560, saves: 390, shares: 310, reach: 59000, profileVisits: 1480, follows: 190 },
      { id: "comp-global-3", brandId: "global-ind", title: "Integrating 400MW offshore wind energy into Eastern grids (Post-Campaign)", platform: "LinkedIn", type: "Carousel", impressions: 154000, engagement: 9100, engagementRate: 5.90, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 5005, comments: 1820, saves: 1270, shares: 1005, reach: 147000, profileVisits: 3690, follows: 630 },
      { id: "comp-global-4", brandId: "global-ind", title: "Our 10-year ESG commitment report card results (Post-Campaign)", platform: "LinkedIn", type: "Infographic", impressions: 98000, engagement: 5100, engagementRate: 5.20, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 2805, comments: 1020, saves: 710, shares: 565, reach: 93000, profileVisits: 2350, follows: 350 },
      { id: "comp-global-5", brandId: "global-ind", title: "Heavy freight carbon offset tracking automation (Post-Campaign)", platform: "Twitter/X", type: "Text", impressions: 42000, engagement: 2700, engagementRate: 6.42, createdAt: timestamp, dayOfWeek: "Thursday", likes: 1485, comments: 540, saves: 375, shares: 300, reach: 39900, profileVisits: 1000, follows: 180 },
      { id: "comp-global-6", brandId: "global-ind", title: "NetZero grid integration project update summary (Post-Campaign)", platform: "Newsletter", type: "Text", impressions: 24000, engagement: 5600, engagementRate: 23.33, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 3080, comments: 1120, saves: 780, shares: 620, reach: 23000, profileVisits: 570, follows: 390 },
      { id: "comp-global-7", brandId: "global-ind", title: "Streamlining global multi-commodity shipping networks (Post-Campaign)", platform: "Twitter/X", type: "Text", impressions: 33000, engagement: 1900, engagementRate: 5.75, createdAt: timestamp, dayOfWeek: "Monday", likes: 1045, comments: 380, saves: 265, shares: 210, reach: 31000, profileVisits: 790, follows: 130 },
      { id: "comp-global-8", brandId: "global-ind", title: "Optimizing trans-pacific fuel efficiency logistics (Post-Campaign)", platform: "Facebook", type: "Article", impressions: 52000, engagement: 2900, engagementRate: 5.58, createdAt: timestamp, dayOfWeek: "Friday", likes: 1595, comments: 580, saves: 400, shares: 325, reach: 49000, profileVisits: 1240, follows: 200 },
      { id: "comp-global-9", brandId: "global-ind", title: "Eco-routing automation algorithm overview (Post-Campaign)", platform: "TikTok", type: "Video", impressions: 110000, engagement: 10500, engagementRate: 9.55, createdAt: timestamp, dayOfWeek: "Thursday", likes: 5775, comments: 2100, saves: 1470, shares: 1155, reach: 105000, profileVisits: 2640, follows: 735 },
      { id: "comp-global-10", brandId: "global-ind", title: "Green logistics roadmap for modern distribution (Post-Campaign)", platform: "Threads", type: "Text", impressions: 26000, engagement: 1800, engagementRate: 6.92, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 990, comments: 360, saves: 250, shares: 200, reach: 24000, profileVisits: 620, follows: 120 }
    ];
  } else if (brandId === "horizon-tech") {
    return [
      { id: "comp-horizon-1", brandId: "horizon-tech", title: "Behind the scenes: Magnesium speaker resonance design (Post-Campaign)", platform: "Instagram", type: "Video", impressions: 430000, engagement: 38200, engagementRate: 8.88, createdAt: timestamp, dayOfWeek: "Friday", likes: 21010, comments: 7640, saves: 5348, shares: 4202, reach: 412000, profileVisits: 10320, follows: 2674 },
      { id: "comp-horizon-2", brandId: "horizon-tech", title: "Acoustic room resonance vs minimal furniture footprint (Post-Campaign)", platform: "Instagram", type: "Infographic", impressions: 215000, engagement: 18200, engagementRate: 8.46, createdAt: timestamp, dayOfWeek: "Thursday", likes: 10010, comments: 3640, saves: 2548, shares: 2002, reach: 204000, profileVisits: 5160, follows: 1274 },
      { id: "comp-horizon-3", brandId: "horizon-tech", title: "Tactile natural linen soundboard pre-order launch teaser (Post-Campaign)", platform: "Instagram", type: "Video", impressions: 480000, engagement: 44200, engagementRate: 9.20, createdAt: timestamp, dayOfWeek: "Friday", likes: 24310, comments: 8840, saves: 6188, shares: 4862, reach: 461000, profileVisits: 11520, follows: 3094 },
      { id: "comp-horizon-4", brandId: "horizon-tech", title: "Designing consumer electronics to respect daily tranquility (Post-Campaign)", platform: "LinkedIn", type: "Article", impressions: 54000, engagement: 2800, engagementRate: 5.18, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 1540, comments: 560, saves: 392, shares: 308, reach: 51000, profileVisits: 1290, follows: 196 },
      { id: "comp-horizon-5", brandId: "horizon-tech", title: "Why we choose brushed magnesium alloy for acoustics (Post-Campaign)", platform: "Twitter/X", type: "Text", impressions: 41000, engagement: 2500, engagementRate: 6.09, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 1375, comments: 500, saves: 350, shares: 275, reach: 39000, profileVisits: 980, follows: 175 },
      { id: "comp-horizon-6", brandId: "horizon-tech", title: "Horizon Light minimal home audio integration guide (Post-Campaign)", platform: "Newsletter", type: "Text", impressions: 22000, engagement: 5100, engagementRate: 23.18, createdAt: timestamp, dayOfWeek: "Tuesday", likes: 2805, comments: 1020, saves: 714, shares: 561, reach: 21000, profileVisits: 520, follows: 357 },
      { id: "comp-horizon-7", brandId: "horizon-tech", title: "Premium spatial acoustics design reveal (Post-Campaign)", platform: "Facebook", type: "Image", impressions: 110000, engagement: 8200, engagementRate: 7.45, createdAt: timestamp, dayOfWeek: "Monday", likes: 4510, comments: 1640, saves: 1148, shares: 902, reach: 104000, profileVisits: 2640, follows: 574 },
      { id: "comp-horizon-8", brandId: "horizon-tech", title: "How minimal shapes enrich your daily living room (Post-Campaign)", platform: "TikTok", type: "Video", impressions: 250000, engagement: 24100, engagementRate: 9.64, createdAt: timestamp, dayOfWeek: "Thursday", likes: 13255, comments: 4820, saves: 3374, shares: 2651, reach: 241000, profileVisits: 6000, follows: 1687 },
      { id: "comp-horizon-9", brandId: "horizon-tech", title: "Pre-orders open this Thursday. Set your notification. (Post)", platform: "Threads", type: "Text", impressions: 51000, engagement: 4200, engagementRate: 8.24, createdAt: timestamp, dayOfWeek: "Wednesday", likes: 2310, comments: 840, saves: 588, shares: 462, reach: 49000, profileVisits: 1220, follows: 294 }
    ];
  } else {
    return [];
  }
};

export const PerformanceIntelligencePage: React.FC = () => {
  const { 
    activeBrand, 
    theme, 
    accentColor, 
    rawAnalytics, 
    saveRawAnalyticsRows, 
    clearRawAnalytics,
    addNotification 
  } = useBrand();

  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [savingSandbox, setSavingSandbox] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Focus Metric Tab (Engagement, Reach, Conversion)
  const [activeMetricTab, setActiveMetricTab] = useState<"engagement" | "reach" | "conversion">("engagement");

  // New comparative and inline uploading states
  const [dashboardMode, setDashboardMode] = useState<"baseline" | "comparison" | "comparative">("baseline");
  const [showUploadWidget, setShowUploadWidget] = useState<boolean>(false);
  const [inlineUploadType, setInlineUploadType] = useState<"baseline" | "comparison">("baseline");
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [inlineUploading, setInlineUploading] = useState<boolean>(false);
  const [inlineFileName, setInlineFileName] = useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isDark = theme === "dark";
  const activeColor = activeBrand?.primaryColor || accentColor || "violet";

  // Determine if we are utilizing sandbox fallback data
  const isSandboxData = useMemo(() => {
    const isPreset = ["acme-corp", "global-ind", "horizon-tech"].includes(activeBrand?.id || "");
    return rawAnalytics.length === 0 && isPreset;
  }, [rawAnalytics, activeBrand]);

  // Separate Baseline vs Comparison custom datasets from DB
  const customBaselineDataset = useMemo(() => {
    return rawAnalytics.filter(r => r.datasetType === "baseline" || !r.datasetType);
  }, [rawAnalytics]);

  const customComparisonDataset = useMemo(() => {
    return rawAnalytics.filter(r => r.datasetType === "comparison");
  }, [rawAnalytics]);

  // Unified Base Dataset Resolver
  const baselineDataset = useMemo(() => {
    if (customBaselineDataset.length > 0) return customBaselineDataset;
    return getDemoDataForBrand(activeBrand?.id || "acme-corp");
  }, [customBaselineDataset, activeBrand]);

  const comparisonDataset = useMemo(() => {
    if (customComparisonDataset.length > 0) return customComparisonDataset;
    return getDemoComparisonDataForBrand(activeBrand?.id || "acme-corp");
  }, [customComparisonDataset, activeBrand]);

  // Unified Base Dataset Resolver (Raw)
  const activeDatasetRaw = useMemo(() => {
    if (dashboardMode === "comparison") {
      return comparisonDataset;
    }
    return baselineDataset;
  }, [dashboardMode, baselineDataset, comparisonDataset]);

  // Processed Active Dataset with filled breakdown metrics
  const activeDataset = useMemo(() => {
    return activeDatasetRaw.map(item => {
      const engagement = item.engagement || 0;
      const likes = item.likes !== undefined ? item.likes : Math.round(engagement * 0.55);
      const comments = item.comments !== undefined ? item.comments : Math.round(engagement * 0.20);
      const shares = item.shares !== undefined ? item.shares : Math.round(engagement * 0.15);
      const saves = item.saves !== undefined ? item.saves : Math.round(engagement * 0.10);
      
      const impressions = item.impressions || 1;
      const reach = item.reach !== undefined ? item.reach : Math.round(impressions * 0.96);
      const profileVisits = item.profileVisits !== undefined ? item.profileVisits : Math.round(impressions * 0.024);
      const follows = item.follows !== undefined ? item.follows : Math.round(engagement * 0.07);
      
      const saveRate = item.saveRate !== undefined ? item.saveRate : parseFloat((saves / impressions * 100).toFixed(2));
      const followConversionRate = item.followConversionRate !== undefined ? item.followConversionRate : parseFloat((follows / impressions * 100).toFixed(2));

      return {
        ...item,
        likes,
        comments,
        shares,
        saves,
        reach,
        profileVisits,
        follows,
        saveRate,
        followConversionRate
      };
    });
  }, [activeDatasetRaw]);

  // Tab channels - expanded to include Facebook, TikTok, and Threads
  const channels = ["All", "Facebook", "Instagram", "LinkedIn", "Twitter/X", "TikTok", "Threads", "Newsletter", "YouTube"];

  // Filter dataset based on tab select and search term query
  const filteredData = useMemo(() => {
    return activeDataset.filter(item => {
      const matchTab = activeTab === "All" || item.platform.toLowerCase() === activeTab.toLowerCase();
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [activeDataset, activeTab, searchTerm]);

  // Aggregate Key Metrics
  const summaryStats = useMemo(() => {
    const totalImpressions = filteredData.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const totalEngagement = filteredData.reduce((acc, curr) => acc + (curr.engagement || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0.0;
    
    // Engagement breakdown aggregates
    const totalLikes = filteredData.reduce((acc, curr) => acc + (curr.likes || 0), 0);
    const totalComments = filteredData.reduce((acc, curr) => acc + (curr.comments || 0), 0);
    const totalSaves = filteredData.reduce((acc, curr) => acc + (curr.saves || 0), 0);
    const totalShares = filteredData.reduce((acc, curr) => acc + (curr.shares || 0), 0);

    // Conversion breakdown aggregates
    const totalClicks = filteredData.reduce((acc, curr) => acc + (curr.profileVisits || 0), 0);
    const totalFollows = filteredData.reduce((acc, curr) => acc + (curr.follows || 0), 0);
    const avgConversionRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0.0;
    const avgFollowRate = totalImpressions > 0 ? (totalFollows / totalImpressions) * 100 : 0.0;

    // Peak and average impressions
    const peakImpressions = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.impressions)) : 0;
    const avgImpressions = filteredData.length > 0 ? Math.round(totalImpressions / filteredData.length) : 0;

    // Calculate best platform in current filter
    const platformCTR: Record<string, { imps: number; eng: number }> = {};
    filteredData.forEach(d => {
      if (!platformCTR[d.platform]) platformCTR[d.platform] = { imps: 0, eng: 0 };
      platformCTR[d.platform].imps += d.impressions;
      platformCTR[d.platform].eng += d.engagement;
    });

    let topPlatform = "N/A";
    let highestPlatformCTR = 0;
    Object.keys(platformCTR).forEach(p => {
      const { imps, eng } = platformCTR[p];
      const ctr = imps > 0 ? (eng / imps) * 100 : 0;
      if (ctr > highestPlatformCTR) {
        highestPlatformCTR = ctr;
        topPlatform = p;
      }
    });

    return {
      totalImpressions,
      totalEngagement,
      avgCTR,
      totalLikes,
      totalComments,
      totalSaves,
      totalShares,
      totalClicks,
      totalFollows,
      avgConversionRate,
      avgFollowRate,
      peakImpressions,
      avgImpressions,
      topPlatform
    };
  }, [filteredData]);

  // Top 10 Performing Posts sorted by absolute engagement volume descending
  const top10Posts = useMemo(() => {
    return [...filteredData]
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }, [filteredData]);

  // Comparative calculations for comparing Baseline vs. Comparison
  const baselineFiltered = useMemo(() => {
    return baselineDataset.filter(item => {
      const matchTab = activeTab === "All" || item.platform.toLowerCase() === activeTab.toLowerCase();
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [baselineDataset, activeTab, searchTerm]);

  const comparisonFiltered = useMemo(() => {
    return comparisonDataset.filter(item => {
      const matchTab = activeTab === "All" || item.platform.toLowerCase() === activeTab.toLowerCase();
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [comparisonDataset, activeTab, searchTerm]);

  const comparativeStats = useMemo(() => {
    const baseImps = baselineFiltered.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const baseEng = baselineFiltered.reduce((acc, curr) => acc + (curr.engagement || 0), 0);
    const baseCTR = baseImps > 0 ? (baseEng / baseImps) * 100 : 0.0;

    const compImps = comparisonFiltered.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const compEng = comparisonFiltered.reduce((acc, curr) => acc + (curr.engagement || 0), 0);
    const compCTR = compImps > 0 ? (compEng / compImps) * 100 : 0.0;

    const impsChange = baseImps > 0 ? ((compImps - baseImps) / baseImps) * 100 : 0.0;
    const engChange = baseEng > 0 ? ((compEng - baseEng) / baseEng) * 100 : 0.0;
    const ctrChange = compCTR - baseCTR;

    return {
      baseImps,
      baseEng,
      baseCTR,
      compImps,
      compEng,
      compCTR,
      impsChange,
      engChange,
      ctrChange
    };
  }, [baselineFiltered, comparisonFiltered]);

  // Aggregate day of week timing heatmaps
  const timingHeatmap = useMemo(() => {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const dayStats = weekdays.map(day => {
      const dayRows = filteredData.filter(d => d.dayOfWeek === day);
      const dayImps = dayRows.reduce((sum, curr) => sum + curr.impressions, 0);
      const dayEng = dayRows.reduce((sum, curr) => sum + curr.engagement, 0);
      const dayCTR = dayImps > 0 ? (dayEng / dayImps) * 100 : 0.0;
      return { day, count: dayRows.length, ctr: dayCTR };
    });

    const maxDayCTR = Math.max(...dayStats.map(d => d.ctr), 1);
    return dayStats.map(stat => ({
      ...stat,
      ratio: stat.ctr / maxDayCTR
    }));
  }, [filteredData]);

  // Format performance breakdowns
  const formatStats = useMemo(() => {
    const formats = ["Carousel", "Text", "Infographic", "Article", "Video"];
    const stats = formats.map(form => {
      const fRows = filteredData.filter(d => d.type === form);
      const fImps = fRows.reduce((sum, curr) => sum + curr.impressions, 0);
      const fEng = fRows.reduce((sum, curr) => sum + curr.engagement, 0);
      const fCTR = fImps > 0 ? (fEng / fImps) * 100 : 0.0;
      return { format: form, count: fRows.length, ctr: fCTR };
    }).filter(s => s.count > 0);

    const maxFormatCTR = Math.max(...stats.map(s => s.ctr), 1);
    return stats.map(s => ({
      ...s,
      percentage: (s.ctr / maxFormatCTR) * 100
    })).sort((a, b) => b.ctr - a.ctr);
  }, [filteredData]);

  // SVG Area / Line Chart Points Calculation
  const svgChartPath = useMemo(() => {
    if (filteredData.length < 2) return { line: "", area: "", points: [] };
    const width = 600;
    const height = 150;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 20;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const maxCTR = Math.max(...filteredData.map(d => d.engagementRate), 1.0);
    const minCTR = 0; // standard floor

    const points = filteredData.map((d, i) => {
      const x = paddingLeft + (i / (filteredData.length - 1)) * chartW;
      const y = paddingTop + chartH - ((d.engagementRate - minCTR) / (maxCTR - minCTR)) * chartH;
      return { x, y, label: d.title, value: d.engagementRate, platform: d.platform };
    });

    const lineD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
    const areaD = `${lineD} L ${points[points.length - 1].x} ${paddingTop + chartH} L ${points[0].x} ${paddingTop + chartH} Z`;

    return { line: lineD, area: areaD, points };
  }, [filteredData]);

  // Aggregate stats per platform for stacked platform chart
  const platformStats = useMemo(() => {
    const targetPlatforms = ["Facebook", "Instagram", "LinkedIn", "Twitter/X", "TikTok", "Threads", "Newsletter", "YouTube"];
    return targetPlatforms.map(p => {
      const rows = filteredData.filter(d => d.platform === p);
      const impressions = rows.reduce((s, r) => s + r.impressions, 0);
      const engagement = rows.reduce((s, r) => s + r.engagement, 0);
      const ctr = impressions > 0 ? (engagement / impressions) * 100 : 0;
      return { platform: p, impressions, engagement, ctr, count: rows.length };
    }).filter(p => p.count > 0);
  }, [filteredData]);

  // Colors & Brand classes configuration
  const getBrandTextColor = () => {
    if (activeColor === "emerald") return "text-emerald-500 dark:text-emerald-400";
    if (activeColor === "rose") return "text-rose-500 dark:text-rose-400";
    if (activeColor === "amber") return "text-amber-500 dark:text-amber-400";
    return "text-violet-500 dark:text-violet-400";
  };

  const getBrandBgStyle = () => {
    if (activeColor === "emerald") return "bg-emerald-600 hover:bg-emerald-500 text-white";
    if (activeColor === "rose") return "bg-rose-600 hover:bg-rose-500 text-white";
    if (activeColor === "amber") return "bg-amber-600 hover:bg-amber-500 text-slate-900";
    return "bg-violet-600 hover:bg-violet-500 text-white";
  };

  const getBrandBgLightStyle = () => {
    if (activeColor === "emerald") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (activeColor === "rose") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    if (activeColor === "amber") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return "bg-violet-500/10 text-violet-500 border-violet-500/20";
  };

  const getBrandBorderStyle = () => {
    if (activeColor === "emerald") return "border-emerald-500/30";
    if (activeColor === "rose") return "border-rose-500/30";
    if (activeColor === "amber") return "border-amber-500/30";
    return "border-violet-500/30";
  };

  // Synchronize simulation data into active Firestore partitions
  const handleCommitSandboxData = async () => {
    if (!activeBrand) return;
    setSavingSandbox(true);
    try {
      const demoRows = getDemoDataForBrand(activeBrand.id);
      await saveRawAnalyticsRows(demoRows);
      addNotification(
        "Simulation Integrated",
        `Successfully committed ${demoRows.length} high-fidelity analytics logs permanently to the ${activeBrand.name} dataset.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      addNotification("Synchronization Interrupted", "Failed to compile Firestore batch write transaction.", "warning");
    } finally {
      setSavingSandbox(false);
    }
  };

  // Executive PDF Report Downloader
  const handleDownloadReport = () => {
    if (filteredData.length === 0) {
      addNotification("Report Empty", "Cannot export report from empty dataset query. Reset search filter.", "warning");
      return;
    }
    try {
      const bName = activeBrand?.name || "N.O.K Corporate Workspace";
      const bTagline = activeBrand?.tagline || "";
      const doc = generatePerformanceReportPDF(filteredData, bName, bTagline);
      
      const filename = `${bName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_executive_performance_report.pdf`;
      doc.save(filename);
      addNotification(
        "Executive Report Exported",
        `Downloaded multi-page compiled social analytics audit PDF report for ${bName} successfully.`,
        "success"
      );
    } catch (err: any) {
      console.error("Failed to compile pdf report:", err);
      addNotification("Report Compilation Failed", "Could not export PDF report file.", "warning");
    }
  };

  const triggerInlineSelect = () => {
    fileInputRef.current?.click();
  };

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processInlineFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processInlineFile(droppedFile);
    }
  };

  const processInlineFile = (fileObj: File) => {
    setInlineFileName(fileObj.name);
    setInlineUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        // Clean and normalize using robust, Python-equivalent parsing engine
        const normalized = cleanAndNormalizeData(content, fileObj.name, activeBrand?.id || "acme-corp");

        await saveRawAnalyticsRows(normalized, inlineUploadType);
        
        addNotification(
          "Spreadsheet Ingested Inline",
          `Successfully processed and synced ${normalized.length} raw rows to the ${inlineUploadType} partition directly from your cockpit dashboard.`,
          "success"
        );
        setShowUploadWidget(false);
        setInlineFileName("");
      } catch (err: any) {
        console.error(err);
        addNotification("Ingestion Blocked", err.message || "Failed to process analytics payload.", "warning");
      } finally {
        setInlineUploading(false);
      }
    };
    reader.readAsText(fileObj);
  };

  return (
    <div 
      id="performance-ai-stage" 
      className={`space-y-6 pb-12 animate-in fade-in duration-200 ${isDark ? "text-slate-100" : "text-slate-800"}`}
    >
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Performance AI Cockpit
          </h2>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Real-time multi-channel analytics aggregation, audience engagement loops, and predictive schedule insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSandboxData && (
            <button
              id="btn-sync-sandbox-performance"
              onClick={handleCommitSandboxData}
              disabled={savingSandbox}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                isDark 
                  ? "bg-amber-950/20 border-amber-500/20 text-amber-400 hover:bg-amber-950/40" 
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${savingSandbox ? "animate-spin" : ""}`} />
              <span>{savingSandbox ? "Syncing Firestore..." : "Sync Sample to DB"}</span>
            </button>
          )}

          <button
            id="btn-download-performance-report"
            onClick={handleDownloadReport}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wide shadow-md transition-all cursor-pointer ${getBrandBgStyle()}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Executive Report</span>
          </button>
        </div>
      </div>

      {/* Sandbox Alert Notice */}
      {isSandboxData && (
        <div className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-amber-500/5 ${isDark ? "border-amber-500/10" : "border-amber-500/20"}`}>
          <div className="flex items-start space-x-3 text-xs leading-relaxed">
            <Database className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-500 block font-mono text-[10px] uppercase tracking-wider">Workspace Simulation Environment</span>
              <p className={isDark ? "text-slate-300 text-[11px]" : "text-slate-600 text-[11px]"}>
                You are currently viewing simulated high-fidelity brand metrics. To analyze your actual metrics, upload standard spreadsheets or JSON datasets in the <strong className="text-amber-500">Analytics Import</strong> console or use the live updater below.
              </p>
            </div>
          </div>
          <button
            onClick={handleCommitSandboxData}
            className={`shrink-0 text-[10px] font-mono font-bold uppercase tracking-wider py-1.5 px-3 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 transition-all`}
          >
            Sync Simulation
          </button>
        </div>
      )}

      {/* Cockpit Mode Selector and Inline Upload Trigger */}
      <div className={`border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mr-2">Analysis Scope:</span>
          <div className="flex bg-slate-950/40 p-1 rounded-lg border border-slate-900 gap-1">
            <button
              onClick={() => setDashboardMode("baseline")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                dashboardMode === "baseline"
                  ? getBrandBgLightStyle() + " font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Baseline Analytics
            </button>
            <button
              onClick={() => setDashboardMode("comparison")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                dashboardMode === "comparison"
                  ? getBrandBgLightStyle() + " font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Post-Campaign / Feedback
            </button>
            <button
              onClick={() => setDashboardMode("comparative")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all flex items-center gap-1 ${
                dashboardMode === "comparative"
                  ? getBrandBgLightStyle() + " font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Comparative Suite</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowUploadWidget(!showUploadWidget)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
            showUploadWidget
              ? "bg-slate-800 border-slate-700 text-slate-200"
              : getBrandBgLightStyle()
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{showUploadWidget ? "Close Live Updater" : "⚡ Direct Spreadsheet Updater"}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleInlineFileChange} 
        accept=".csv,.json" 
        className="hidden" 
      />

      {/* Collapsible Inline Spreadsheet Upload Widget */}
      {showUploadWidget && (
        <div className={`border rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-200 ${isDark ? "bg-slate-950/60 border-border" : "bg-slate-50 border-slate-200"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/40 pb-3">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">⚡ Live Performance Data Updater</h4>
              <p className="text-[10px] text-slate-500 font-mono">Inject new analytical campaigns directly into the selected dataset partition.</p>
            </div>
            
            {/* Partition Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-slate-400">Target Database Partition:</span>
              <div className="flex bg-slate-900 rounded-md border border-border p-0.5">
                <button
                  onClick={() => setInlineUploadType("baseline")}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                    inlineUploadType === "baseline"
                      ? "bg-slate-800 text-slate-200 font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Baseline
                </button>
                <button
                  onClick={() => setInlineUploadType("comparison")}
                  className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
                    inlineUploadType === "comparison"
                      ? "bg-slate-800 text-slate-200 font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Comparison
                </button>
              </div>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerInlineSelect}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-violet-500 bg-violet-500/5"
                : "border-border hover:border-slate-700 bg-slate-900/20"
            }`}
          >
            {inlineUploading ? (
              <div className="space-y-2 py-2">
                <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-300">Ingesting {inlineFileName || "dataset"}...</p>
                <p className="text-[10px] text-slate-500 font-mono">Parsing records and optimizing telemetry structures</p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs font-mono text-slate-300">
                  Drag and drop campaign <span className="text-violet-400 font-bold">.CSV</span> or <span className="text-violet-400 font-bold">.JSON</span>, or browse files
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Rows will be stored under the <span className="text-emerald-400 font-bold uppercase">{inlineUploadType}</span> database partition for {activeBrand?.name || "active brand"}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeDataset.length === 0 ? (
        <div className={`border rounded-xl p-12 text-center space-y-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="max-w-md mx-auto space-y-4">
            <div className={`p-4 rounded-full inline-block ${isDark ? "bg-slate-900" : "bg-slate-50"}`}>
              <Database className="w-8 h-8 text-slate-500" />
            </div>
            <div className="space-y-1.5">
              <h3 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Cockpit Awaiting Performance Data
              </h3>
              <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                The performance metrics dataset for <strong className="text-slate-200">{activeBrand?.name || "this brand"}</strong> is currently empty and fresh.
              </p>
            </div>
            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
              Use the <strong>Live Performance Data Updater</strong> above to drag and drop or browse files, or navigate to the <strong>Analytics Import</strong> tab to clean and load defective raw marketing files.
            </p>
            {!showUploadWidget && (
              <button
                onClick={() => setShowUploadWidget(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide shadow-md transition-all cursor-pointer ${getBrandBgStyle()}`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Activate Data Updater</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className={`border p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-wrap gap-1.5">
          {channels.map(chan => (
            <button
              id={`tab-channel-${chan}`}
              key={chan}
              onClick={() => setActiveTab(chan)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                activeTab === chan
                  ? getBrandBgLightStyle()
                  : isDark
                    ? "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {chan}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-analytics-search"
            type="text"
            placeholder="Search performance logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 rounded-lg text-xs transition-all outline-none border ${
              isDark 
                ? "bg-slate-950 border-border text-slate-100 focus:border-border focus:bg-black" 
                : "bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300 focus:bg-white"
            }`}
          />
        </div>
      </div>

      {dashboardMode === "comparative" ? (
        <div className="space-y-6">
          {/* Comparative Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Impressions Comparison Card */}
            <div className={`border rounded-xl p-5 space-y-4 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Impressions Delta</span>
                <div className={`p-1.5 rounded-md ${getBrandBgLightStyle()}`}>
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Baseline: {comparativeStats.baseImps.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-300 font-mono block">Post-Campaign: {comparativeStats.compImps.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold flex items-center justify-end ${comparativeStats.impsChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {comparativeStats.impsChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {comparativeStats.impsChange >= 0 ? "+" : ""}{comparativeStats.impsChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Engagement Comparison Card */}
            <div className={`border rounded-xl p-5 space-y-4 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Engagement Delta</span>
                <div className={`p-1.5 rounded-md ${getBrandBgLightStyle()}`}>
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Baseline: {comparativeStats.baseEng.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-300 font-mono block">Post-Campaign: {comparativeStats.compEng.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold flex items-center justify-end ${comparativeStats.engChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {comparativeStats.engChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {comparativeStats.engChange >= 0 ? "+" : ""}{comparativeStats.engChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* CTR Comparison Card */}
            <div className={`border rounded-xl p-5 space-y-4 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Avg. Engagement Rate Delta</span>
                <div className={`p-1.5 rounded-md ${getBrandBgLightStyle()}`}>
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block">Baseline: {comparativeStats.baseCTR.toFixed(2)}%</span>
                  <span className="text-[10px] text-slate-300 font-mono block">Post-Campaign: {comparativeStats.compCTR.toFixed(2)}%</span>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-extrabold flex items-center justify-end ${comparativeStats.ctrChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {comparativeStats.ctrChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                    {comparativeStats.ctrChange >= 0 ? "+" : ""}{comparativeStats.ctrChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Comparison Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className={`border rounded-xl p-6 lg:col-span-8 space-y-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Comparative Funnel Uplift</h4>
                <p className="text-[10px] text-slate-500 font-mono">Performance lift comparison per channel (Baseline vs Post-Campaign Engagement Rate)</p>
              </div>

              {/* Side-by-Side Channel Comparison Bars */}
              <div className="space-y-4 pt-2">
                {["LinkedIn", "Twitter/X", "Instagram", "Newsletter", "YouTube"].map(platform => {
                  const baseRows = baselineFiltered.filter(d => d.platform === platform);
                  const baseImps = baseRows.reduce((sum, curr) => sum + curr.impressions, 0);
                  const baseEng = baseRows.reduce((sum, curr) => sum + curr.engagement, 0);
                  const baseCTR = baseImps > 0 ? (baseEng / baseImps) * 100 : 0.0;

                  const compRows = comparisonFiltered.filter(d => d.platform === platform);
                  const compImps = compRows.reduce((sum, curr) => sum + curr.impressions, 0);
                  const compEng = compRows.reduce((sum, curr) => sum + curr.engagement, 0);
                  const compCTR = compImps > 0 ? (compEng / compImps) * 100 : 0.0;

                  const maxVal = Math.max(baseCTR, compCTR, 1.0);
                  const platformLift = compCTR - baseCTR;

                  if (baseRows.length === 0 && compRows.length === 0) return null;

                  return (
                    <div key={platform} className="space-y-1.5 border-b border-slate-900/30 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-300 font-bold">{platform}</span>
                        <span className={`text-[10px] font-extrabold ${platformLift >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {platformLift >= 0 ? `+${platformLift.toFixed(2)}% lift` : `${platformLift.toFixed(2)}% drop`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Baseline Bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>Baseline</span>
                            <span>{baseCTR.toFixed(2)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-600 rounded-full" style={{ width: `${(baseCTR / maxVal) * 100}%` }} />
                          </div>
                        </div>

                        {/* Post-Campaign Bar */}
                        <div className="space-y-0.5">
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                            <span>Post-Campaign</span>
                            <span className="text-emerald-400 font-bold">{compCTR.toFixed(2)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(compCTR / maxVal) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Comparative Strategy Card */}
            <div className={`border rounded-xl p-6 lg:col-span-4 flex flex-col justify-between ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">Strategic Insight Summary</h4>
                </div>
                <p className="text-[10px] text-slate-400 font-mono leading-relaxed mb-4">
                  Autonomous AI analysis contrasting baseline positioning with live performance optimizations:
                </p>

                <div className="space-y-3 font-mono text-[10px] text-slate-400">
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900/60 leading-normal">
                    <span className="text-emerald-400 font-bold block mb-1">🚀 High Performing Channel Shift</span>
                    The comparison data displays strong positive lift across channels, particularly with a <strong className="text-slate-200">+{comparativeStats.ctrChange.toFixed(1)}% absolute CTR jump</strong> overall. Maintain V2 copy strategies.
                  </div>

                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900/60 leading-normal">
                    <span className="text-amber-400 font-bold block mb-1">📈 Format Effectiveness</span>
                    Direct copy refinement and interactive carousels achieved maximum traction. Continue prioritising multi-page carousels over static articles.
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-900/40 text-[9px] font-mono text-slate-500 leading-normal">
                Comparison model generated dynamically based on active partitions.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Focus Metric Selection Tabs */}
          <div className="flex border-b border-slate-205 dark:border-border mb-6 gap-2">
            <button
              onClick={() => setActiveMetricTab("engagement")}
              className={`pb-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetricTab === "engagement"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Engagement Focus</span>
            </button>
            <button
              onClick={() => setActiveMetricTab("reach")}
              className={`pb-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetricTab === "reach"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Reach Focus</span>
            </button>
            <button
              onClick={() => setActiveMetricTab("conversion")}
              className={`pb-3 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMetricTab === "conversion"
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Conversion Focus</span>
            </button>
          </div>

          {activeMetricTab === "engagement" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Total Likes */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Likes</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Heart className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalLikes.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Total appreciative likes logged across posts.
                </p>
              </div>

              {/* Total Comments */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Comments</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalComments.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Total conversational comments or replies.
                </p>
              </div>

              {/* Total Saves */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Saves</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalSaves.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  High-intent content bookmarks or saves.
                </p>
              </div>

              {/* Total Shares */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Shares</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalShares.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Inbound amplification and social shares.
                </p>
              </div>

              {/* Engagement Rate */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Engagement Rate</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${getBrandTextColor()}`}>
                    {summaryStats.avgCTR.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Average ratio of engagements divided by reach.
                </p>
              </div>
            </div>
          )}

          {activeMetricTab === "reach" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Impressions */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Impressions</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalImpressions.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Cumulative times posts were viewed on feed.
                </p>
              </div>

              {/* Avg Impressions per post */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Avg Post Reach</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.avgImpressions.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Average impression volume captured per post.
                </p>
              </div>

              {/* Peak Reach Post */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Peak Post Reach</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.peakImpressions.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Highest reach scored by a single publication.
                </p>
              </div>

              {/* Top Channel Reach */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Top Reach Channel</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${getBrandTextColor()}`}>
                    {summaryStats.topPlatform}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  The primary platform maximizing reach efficiency.
                </p>
              </div>
            </div>
          )}

          {activeMetricTab === "conversion" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Profile Clicks */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Profile Visits</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <MousePointerClick className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalClicks.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Total link clicks and direct profile visits.
                </p>
              </div>

              {/* Follower Conversions */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Followers Gained</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.totalFollows.toLocaleString()}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Total net follower acquisitions generated.
                </p>
              </div>

              {/* Profile CTR */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Click-Through Rate</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <BarChart3 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {summaryStats.avgConversionRate.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Link clicks divided by impressions.
                </p>
              </div>

              {/* Follow Conversion Rate */}
              <div className={`border rounded-xl p-5 space-y-2 relative overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Follow Conversion</span>
                  <div className={`p-1 rounded-md ${getBrandBgLightStyle()}`}>
                    <Target className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold tracking-tight ${getBrandTextColor()}`}>
                    {summaryStats.avgFollowRate.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  Followers gained divided by impressions.
                </p>
              </div>
            </div>
          )}

      {/* Main Graphics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Glow Line/Area Engagement Trend Chart */}
        <div className={`border rounded-xl p-5 lg:col-span-8 flex flex-col justify-between ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Engagement Rate Trend</h4>
              <p className="text-[10px] text-slate-500 font-mono">Dynamic interactive benchmarks (CTR % across sequentially uploaded campaigns)</p>
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-mono text-slate-400 bg-slate-900/40 p-1 px-2 rounded border border-border/40">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              <span>CTR Trend</span>
            </div>
          </div>

          <div className="relative flex-1 min-h-[160px] flex items-center justify-center">
            {filteredData.length < 2 ? (
              <div className="text-center py-12 font-mono text-[10px] text-slate-500">
                Lacks sufficient data points to draw chronological timeline.
              </div>
            ) : (
              <div className="w-full h-full relative">
                <svg viewBox="0 0 600 150" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeColor === "emerald" ? "#10b981" : activeColor === "rose" ? "#f43f5e" : activeColor === "amber" ? "#f59e0b" : "#8b5cf6"} stopOpacity="0.25"/>
                      <stop offset="100%" stopColor={activeColor === "emerald" ? "#10b981" : activeColor === "rose" ? "#f43f5e" : activeColor === "amber" ? "#f59e0b" : "#8b5cf6"} stopOpacity="0"/>
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8b5cf6"/>
                      <stop offset="50%" stopColor="#f43f5e"/>
                      <stop offset="100%" stopColor="#10b981"/>
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line x1="35" y1="15" x2="585" y2="15" stroke={isDark ? "#222" : "#eee"} strokeWidth="1" strokeDasharray="3 3"/>
                  <line x1="35" y1="72.5" x2="585" y2="72.5" stroke={isDark ? "#222" : "#eee"} strokeWidth="1" strokeDasharray="3 3"/>
                  <line x1="35" y1="130" x2="585" y2="130" stroke={isDark ? "#222" : "#eee"} strokeWidth="1"/>

                  {/* Glowing line paths */}
                  <path d={svgChartPath.area} fill="url(#areaGrad)" />
                  <path d={svgChartPath.line} fill="none" stroke={activeColor === "emerald" ? "#10b981" : activeColor === "rose" ? "#f43f5e" : activeColor === "amber" ? "#f59e0b" : "url(#lineGrad)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Coordinate Data Dots */}
                  {svgChartPath.points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredIndex === idx ? "6" : "3.5"}
                        fill={isDark ? "#111" : "#fff"}
                        stroke={activeColor === "emerald" ? "#10b981" : activeColor === "rose" ? "#f43f5e" : activeColor === "amber" ? "#f59e0b" : "#8b5cf6"}
                        strokeWidth={hoveredIndex === idx ? "3" : "2"}
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredIndex !== null && svgChartPath.points[hoveredIndex] && (
                  <div 
                    className="absolute bg-slate-950 border border-border p-2.5 rounded-lg shadow-xl pointer-events-none animate-in fade-in duration-100 z-10 font-mono text-[9px] text-slate-300 max-w-[240px]"
                    style={{
                      left: `${(svgChartPath.points[hoveredIndex].x / 600) * 100}%`,
                      top: `${(svgChartPath.points[hoveredIndex].y / 150) * 100 - 32}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="font-bold text-slate-100 truncate">{svgChartPath.points[hoveredIndex].label}</div>
                    <div className="flex justify-between items-center mt-1 text-slate-400">
                      <span>Platform: {svgChartPath.points[hoveredIndex].platform}</span>
                      <span className="text-emerald-400 font-bold">{svgChartPath.points[hoveredIndex].value.toFixed(2)}% CTR</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Platform Share / Bar Chart */}
        <div className={`border rounded-xl p-5 lg:col-span-4 flex flex-col justify-between ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1">Channel Audience Share</h4>
            <p className="text-[10px] text-slate-500 font-mono mb-4">Total reach impressions filtered by publishing network.</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {platformStats.length === 0 ? (
              <div className="text-center py-10 font-mono text-[10px] text-slate-500">
                No channel metrics available.
              </div>
            ) : (
              platformStats.map(stat => (
                <div key={stat.platform} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-300 font-bold">{stat.platform}</span>
                    <span className="text-slate-400">{stat.impressions.toLocaleString()} views</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-border/20">
                    <div 
                      className={`h-full rounded-full ${
                        stat.platform === "LinkedIn" ? "bg-blue-500" :
                        stat.platform === "Twitter/X" ? "bg-sky-400" :
                        stat.platform === "Instagram" ? "bg-pink-500" :
                        stat.platform === "Newsletter" ? "bg-emerald-500" :
                        "bg-red-600"
                      }`}
                      style={{ 
                        width: `${Math.min((stat.impressions / Math.max(...platformStats.map(p => p.impressions), 1)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Strategic Insights Heatmap & Content Specific Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Engagement Heatmap Grid */}
        <div className={`border rounded-xl p-5 lg:col-span-7 space-y-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Optimal Weekly Posting Heatmap</h4>
            <p className="text-[10px] text-slate-500 font-mono">Calculated average conversion rate (CTR) aggregated by weekday.</p>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {timingHeatmap.map(stat => {
              const isPeak = stat.ratio === 1.0 && stat.count > 0;
              return (
                <div 
                  key={stat.day}
                  className={`border rounded-lg p-3 text-center transition-all flex flex-col justify-between min-h-[90px] relative ${
                    isPeak
                      ? `bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/30`
                      : isDark
                        ? `bg-slate-950 border-slate-900`
                        : `bg-slate-50 border-slate-200 shadow-sm`
                  }`}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">{stat.day.substring(0, 3)}</span>
                  <div>
                    <span className={`text-[13px] font-bold block font-mono ${isPeak ? "text-violet-400" : "text-slate-200"}`}>
                      {stat.ctr.toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-slate-500 block font-mono">{stat.count} posts</span>
                  </div>
                  {isPeak && (
                    <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white font-mono text-[7px] px-1 rounded uppercase font-extrabold animate-pulse">
                      Peak
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950/40 border border-slate-900/60 rounded-lg flex items-start space-x-2.5 text-[10px] text-slate-400 leading-normal font-mono">
            <Clock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Recommended Operational Adjustment:</strong> Combine these weekly CTR peaks with your Content Calendar schedule. Shifting announcements to peak brackets optimizes reach by up to 2.4x.
            </div>
          </div>
        </div>

        {/* Content Format Matrix */}
        <div className={`border rounded-xl p-5 lg:col-span-5 space-y-4 ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Content Format Performance</h4>
            <p className="text-[10px] text-slate-500 font-mono">Average engagement metrics analyzed by creative content format type.</p>
          </div>

          <div className="space-y-3">
            {formatStats.length === 0 ? (
              <div className="text-center py-8 font-mono text-[10px] text-slate-500">
                No format rows processed.
              </div>
            ) : (
              formatStats.map(stat => (
                <div key={stat.format} className="flex items-center justify-between text-xs font-mono">
                  <div className="w-20 shrink-0">
                    <span className="font-semibold text-slate-300">{stat.format}</span>
                    <span className="text-[9px] text-slate-500 block">{stat.count} posts</span>
                  </div>
                  <div className="flex-1 mx-3 h-2 bg-slate-950 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full ${
                        activeColor === "emerald" ? "bg-emerald-500" :
                        activeColor === "rose" ? "bg-rose-500" :
                        activeColor === "amber" ? "bg-amber-500" :
                        "bg-violet-500"
                      }`}
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-200">{stat.ctr.toFixed(1)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Performing Posts Table */}
      <div className={`border rounded-xl overflow-hidden ${isDark ? "bg-card border-border" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="p-5 border-b border-border flex items-center justify-between flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Top 10 Performing Posts</h4>
            <p className="text-[10px] text-slate-500 font-mono">Ranked by absolute engagement volume, including raw metrics and engagement rates.</p>
          </div>
          <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-border">
            Top {top10Posts.length} of {filteredData.length} posts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className={`border-b border-border font-mono text-[10px] uppercase tracking-wider text-slate-400 ${isDark ? "bg-slate-950/40" : "bg-slate-50"}`}>
                <th className="p-4 pl-5">Post Title</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Format</th>
                <th className="p-4 text-right">Impressions / Reach</th>
                <th className="p-4 text-right"><span className="flex items-center justify-end gap-1"><Heart className="w-3 h-3 text-rose-500" /> Likes</span></th>
                <th className="p-4 text-right"><span className="flex items-center justify-end gap-1"><MessageSquare className="w-3 h-3 text-blue-400" /> Comments</span></th>
                <th className="p-4 text-right"><span className="flex items-center justify-end gap-1"><Bookmark className="w-3 h-3 text-amber-500" /> Saves</span></th>
                <th className="p-4 text-right"><span className="flex items-center justify-end gap-1"><Share2 className="w-3 h-3 text-emerald-400" /> Shares</span></th>
                <th className="p-4 text-right pr-5">Engagement Rate</th>
              </tr>
            </thead>
            <tbody>
              {top10Posts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 font-mono text-[10px] text-slate-500">
                    No posts matching filter conditions.
                  </td>
                </tr>
              ) : (
                top10Posts.map((row, index) => (
                  <tr 
                    key={row.id}
                    className={`border-b border-border/60 hover:bg-slate-900/10 transition-colors ${
                      isDark ? "hover:bg-slate-900/30" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-4 pl-5 font-medium max-w-[280px] truncate text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-950/40 w-5 h-5 flex items-center justify-center rounded">
                          #{index + 1}
                        </span>
                        <span>{row.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${
                        row.platform === "LinkedIn" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        row.platform === "Twitter/X" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                        row.platform === "Instagram" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
                        row.platform === "Facebook" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        row.platform === "TikTok" ? "bg-slate-500/10 text-slate-300 border-slate-500/20" :
                        row.platform === "Threads" ? "bg-zinc-500/10 text-zinc-300 border-zinc-500/20" :
                        row.platform === "Newsletter" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {row.platform}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">
                      {row.type}
                    </td>
                    <td className="p-4 text-right font-mono font-medium text-slate-300">
                      {row.impressions.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-rose-400">
                      {row.likes.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-blue-400">
                      {row.comments.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-amber-400">
                      {row.saves.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400">
                      {row.shares.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-violet-400 pr-5">
                      {row.engagementRate.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
        </>
      )}
    </div>
  );
};
