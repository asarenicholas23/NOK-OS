import { RawAnalyticsRow } from "../lib/firebase";

/**
 * Robust CSV parser that correctly handles double-quoted fields,
 * commas inside quotes, escaped double quotes, and multi-line fields.
 */
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped double quote inside a quoted field
        currentValue += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue);
      currentValue = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentValue);
      result.push(row);
      row = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  if (currentValue || row.length > 0) {
    row.push(currentValue);
    result.push(row);
  }

  // Filter out completely empty rows
  return result.filter(r => r.length > 0 && r.some(val => val.trim() !== ""));
}

/**
 * Standardize headers equivalent to pandas .str.strip().str.lower().str.replace(" ", "_").str.replace("-", "_")
 */
export function standardizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[\s\-]+/g, "_")
    .replace(/[^a-z0-9_]/g, ""); // remove other weird symbols
}

/**
 * Clean string value, stripping control characters, double quotes, non-breaking spaces,
 * and handling NaN/null representations gracefully.
 */
export function cleanStringValue(val: any): string {
  if (val === undefined || val === null) return "";
  let str = String(val)
    .replace(/[\u00A0\r\n\t]+/g, " ") // replace tabs, linebreaks, and non-breaking spaces
    .trim();
  // Strip outer quotes if the parser didn't fully resolve them
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1).trim();
  }
  const lower = str.toLowerCase();
  if (lower === "nan" || lower === "null" || str === "-") return "";
  return str;
}

/**
 * Safely converts any value to a clean numeric value (equivalent to pd.to_numeric(errors="coerce").fillna(0))
 */
export function toNumeric(val: any): number {
  const str = cleanStringValue(val).replace(/[\$,%]/g, ""); // strip dollar signs, commas, percentages
  if (!str) return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Cleans text columns, filling undefined/NaN with empty strings
 */
export function cleanText(val: any): string {
  return cleanStringValue(val);
}

/**
 * Safely parses dates of mixed formats (supports YYYY/MM/DD, DD/MM/YYYY, MM/DD/YYYY)
 * mirroring Python's pd.to_datetime with dayfirst=True
 */
export function parseMixedDates(val: any): string {
  const str = cleanText(val);
  if (!str) return "";

  // Try standard JS Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  // Fallback splitting for custom formatted strings
  const parts = str.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        const d2 = new Date(p0, p1 - 1, p2);
        if (!isNaN(d2.getTime())) return d2.toISOString().split("T")[0];
      } else {
        const year = p2 < 100 ? (p2 < 50 ? 2000 + p2 : 1900 + p2) : p2;
        // If dayfirst=True, prefer DD/MM/YYYY
        if (p0 > 12 && p0 <= 31 && p1 <= 12) {
          const d2 = new Date(year, p1 - 1, p0);
          if (!isNaN(d2.getTime())) return d2.toISOString().split("T")[0];
        }
        // If MM/DD/YYYY
        if (p1 > 12 && p1 <= 31 && p0 <= 12) {
          const d2 = new Date(year, p0 - 1, p1);
          if (!isNaN(d2.getTime())) return d2.toISOString().split("T")[0];
        }
        // Otherwise try DD/MM/YYYY
        const d2 = new Date(year, p1 - 1, p0);
        if (!isNaN(d2.getTime())) return d2.toISOString().split("T")[0];
      }
    }
  }
  return "";
}

/**
 * Standardize platform name to human-readable format
 */
export function cleanPlatform(val: any): string {
  const raw = cleanText(val).toLowerCase();
  if (raw.includes("linkedin") || raw.includes("linked_in") || raw === "li" || raw === "ln") return "LinkedIn";
  if (raw.includes("instagram") || raw === "ig" || raw === "insta") return "Instagram";
  if (raw.includes("twitter") || raw.includes("x") || raw === "tw") return "Twitter/X";
  if (raw.includes("youtube") || raw === "yt") return "YouTube";
  if (raw.includes("tiktok") || raw === "tt") return "TikTok";
  if (raw.includes("facebook") || raw === "fb") return "Facebook";
  if (raw.includes("newsletter") || raw.includes("email") || raw === "news") return "Newsletter";

  if (raw.length === 0) return "LinkedIn";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Standardize post type name
 */
export function cleanPostType(val: any): string {
  const raw = cleanText(val).toLowerCase();
  if (raw.includes("carousel") || raw.includes("slide") || raw === "car") return "Carousel";
  if (raw.includes("video") || raw.includes("reel") || raw.includes("short") || raw.includes("mp4") || raw === "vid") return "Video";
  if (raw.includes("text") || raw.includes("status") || raw === "txt") return "Text";
  if (raw.includes("article") || raw.includes("blog") || raw.includes("newsletter") || raw === "art") return "Article";
  if (raw.includes("infographic") || raw.includes("chart") || raw === "info") return "Infographic";
  if (raw.includes("image") || raw.includes("photo") || raw.includes("pic") || raw === "img") return "Image";

  if (raw.length === 0) return "Text";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Standardize day of week name
 */
export function cleanDayOfWeek(val: any, parsedDateStr: string): string {
  const raw = cleanText(val).toLowerCase();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const matched = days.find(d => d.toLowerCase() === raw);
  if (matched) return matched;

  if (raw.startsWith("mon")) return "Monday";
  if (raw.startsWith("tue")) return "Tuesday";
  if (raw.startsWith("wed")) return "Wednesday";
  if (raw.startsWith("thu")) return "Thursday";
  if (raw.startsWith("fri")) return "Friday";
  if (raw.startsWith("sat")) return "Saturday";
  if (raw.startsWith("sun")) return "Sunday";

  // Derive from parsed date if available
  if (parsedDateStr) {
    const dObj = new Date(parsedDateStr);
    if (!isNaN(dObj.getTime())) {
      return days[dObj.getDay()];
    }
  }

  return "Wednesday"; // standard default
}

/**
 * Parses and processes raw file content (CSV or JSON), performing
 * python-style cleanup, type enforcement, and metrics calculation.
 */
export function cleanAndNormalizeData(
  content: string,
  filename: string,
  brandId: string
): RawAnalyticsRow[] {
  let rawObjects: any[] = [];
  const lowerName = filename.toLowerCase();

  const defaultPlatform = (() => {
    if (lowerName.includes("instagram") || lowerName.includes("insta") || lowerName.includes("ig")) {
      return "Instagram";
    }
    if (lowerName.includes("facebook") || lowerName.includes("fb")) {
      return "Facebook";
    }
    if (lowerName.includes("twitter") || lowerName.includes("x_com") || lowerName.includes("tweet")) {
      return "Twitter/X";
    }
    if (lowerName.includes("youtube") || lowerName.includes("yt")) {
      return "YouTube";
    }
    if (lowerName.includes("tiktok") || lowerName.includes("tt")) {
      return "TikTok";
    }
    return "LinkedIn"; // default fallback
  })();

  if (lowerName.endsWith(".json")) {
    const parsed = JSON.parse(content);
    rawObjects = Array.isArray(parsed) ? parsed : [parsed];
  } else {
    // Parse CSV safely
    const parsedLines = parseCSV(content);
    if (parsedLines.length < 2) {
      throw new Error("CSV file lacks minimum lines (header + data).");
    }

    const rawHeaders = parsedLines[0];
    const standardizedHeaders = rawHeaders.map(standardizeHeader);

    for (let i = 1; i < parsedLines.length; i++) {
      const line = parsedLines[i];
      const rowObj: any = {};
      standardizedHeaders.forEach((header, idx) => {
        rowObj[header] = line[idx] !== undefined ? line[idx] : "";
      });
      rawObjects.push(rowObj);
    }
  }

  // Now, process rawObjects with Python-equivalent robust cleaning rules
  const timestamp = new Date().toISOString();

  const mapped = rawObjects.map((obj, idx) => {
    // 1. Standardize keys to lowercase snake_case
    const r: any = {};
    Object.keys(obj).forEach(key => {
      r[standardizeHeader(key)] = obj[key];
    });

    // 2. Identify key mappings
    const rawDate = r["date_posted"] || r["date"] || r["posted_at"] || r["publish_time"];
    // If date is "Lifetime", fallback to publish_time which holds the actual date
    const dateStr = parseMixedDates(
      rawDate === "Lifetime" ? r["publish_time"] || "" : rawDate
    );
    
    // Auto-detect Platform based on multiple parameters (columns, permalink, description, default)
    let detectedPlatform = r["platform"] || r["channel"] || r["source"] || "";
    if (!detectedPlatform) {
      const permalink = String(r["permalink"] || r["url"] || r["link"] || "").toLowerCase();
      const lowerCaption = String(r["caption"] || r["post_description"] || r["description"] || r["title"] || "").toLowerCase();
      
      if (
        permalink.includes("instagram.com") || 
        permalink.includes("instagr.am") || 
        permalink.includes("ig.me") || 
        lowerCaption.includes("instagram") || 
        lowerCaption.includes("ig.me") ||
        lowerName.includes("instagram") || 
        lowerName.includes("insta") || 
        lowerName.includes("ig")
      ) {
        detectedPlatform = "Instagram";
      } else if (
        permalink.includes("facebook.com") || 
        permalink.includes("fb.me") || 
        r["page_id"] || 
        r["page_name"]
      ) {
        detectedPlatform = "Facebook";
      } else if (permalink.includes("linkedin.com") || permalink.includes("lnkd.in")) {
        detectedPlatform = "LinkedIn";
      } else if (permalink.includes("twitter.com") || permalink.includes("x.com") || permalink.includes("t.co")) {
        detectedPlatform = "Twitter/X";
      } else if (permalink.includes("youtube.com") || permalink.includes("youtu.be")) {
        detectedPlatform = "YouTube";
      } else if (permalink.includes("tiktok.com")) {
        detectedPlatform = "TikTok";
      } else {
        detectedPlatform = defaultPlatform;
      }
    }
    const platform = cleanPlatform(detectedPlatform);
    
    const postType = cleanPostType(r["post_type"] || r["type"] || r["format"] || r["category"]);
    const dayOfWeek = cleanDayOfWeek(r["day_of_week"] || r["day_of_weel"] || r["day"] || r["weekday"], dateStr);

    // 3. Clean and enforce numeric types (pd.to_numeric(errors="coerce").fillna(0))
    const reach = toNumeric(r["reach"] || r["reach_count"]);
    let impressions = toNumeric(r["impressions"] || r["views"] || r["reach"]);
    
    // Facebook uses 'reactions' instead of 'likes'
    const likes = toNumeric(r["likes"] || r["reactions"]);
    const comments = toNumeric(r["comments"]);
    const shares = toNumeric(r["shares"] || r["retweets"]);
    const saves = toNumeric(r["saves"] || r["bookmarks"]);
    
    // Map total_clicks / clicks to profileVisits
    const profileVisits = toNumeric(r["profile_visits"] || r["profile_visists"] || r["clicks"] || r["total_clicks"]);
    const follows = toNumeric(r["follows"] || r["conversions"]);

    // 4. Compute metrics (likes + comments + shares + saves)
    const totalEngagement = likes + comments + shares + saves;

    // Defective data alignment correction: impressions cannot be less than engagement
    if (impressions < totalEngagement) {
      impressions = totalEngagement;
    }
    if (impressions === 0) {
      impressions = 1; // avoid division by zero
    }

    // Rates matching python safe_divide(df["total_engagement"], df["impressions"])
    // Multiply by 100 to yield percentages for our UI graphs
    const engagementRate = impressions > 0 ? (totalEngagement / impressions) * 100 : 0.0;
    const saveRate = impressions > 0 ? (saves / impressions) * 100 : 0.0;
    const followConversionRate = impressions > 0 ? (follows / impressions) * 100 : 0.0;

    // 5. Select title cleanly
    const postDescription = cleanText(r["post_description"] || r["description"] || r["title"]);
    const caption = cleanText(r["caption"]);
    const postId = cleanText(r["post_id"]);
    
    let title = postDescription || caption || postId || `SaaS Performance Log #${idx + 1}`;
    if (title.length > 120) {
      title = title.substring(0, 117) + "...";
    }

    // 6. Build final schema compatible with our Firestore database
    return {
      id: `raw-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      brandId,
      title,
      platform,
      type: postType,
      impressions: impressions === 1 && totalEngagement === 0 ? 0 : impressions,
      engagement: totalEngagement,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      dayOfWeek,
      createdAt: timestamp,
      
      // Preserve full metadata for deep analysis in FireStore
      postId,
      datePosted: dateStr,
      caption,
      hashtags: cleanText(r["hashtags"]),
      reach,
      likes,
      comments,
      shares,
      saves,
      profileVisits,
      follows,
      saveRate: parseFloat(saveRate.toFixed(2)),
      followConversionRate: parseFloat(followConversionRate.toFixed(2))
    } as RawAnalyticsRow;
  });

  // Filter out completely empty or senseless row files (garbage logs)
  return mapped.filter(row => {
    const isGarbage = (row.impressions <= 1 && row.engagement === 0 && row.title.startsWith("SaaS Performance Log #"));
    return !isGarbage;
  });
}
