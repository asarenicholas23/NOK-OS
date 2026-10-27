import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  onSnapshot, 
  query, 
  where,
  addDoc,
  serverTimestamp,
  orderBy,
  connectFirestoreEmulator
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup, User, connectAuthEmulator } from "firebase/auth";
import {
  BlogPost,
  ClientBrand,
  DiscoveryRequest,
  CallAvailability,
  INITIAL_CALL_AVAILABILITY,
  INITIAL_BLOG_POSTS,
  INITIAL_CLIENT_BRANDS
} from "../data/cmsData";
import { withCurrentServiceNames } from "../content/services";
import { whenIdle } from "./loadFirebase";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyDBiyLPMt7n0MZsEkLbbqIYbSxURQgdiL0",
  authDomain: "nok-os-prod.firebaseapp.com",
  projectId: "nok-os-prod",
  storageBucket: "nok-os-prod.firebasestorage.app",
  messagingSenderId: "288873586116",
  appId: "1:288873586116:web:cc3186e62ecaf45e185891",
  measurementId: "G-ZRVPPR8X6Z"
};

// Local test mode (npm run dev:local): talk to the Firebase emulators with a
// throwaway "demo-" project instead of production. Off unless explicitly set;
// import.meta.env is undefined when Node scripts import this file.
export const USE_EMULATORS = (import.meta as any).env?.VITE_USE_EMULATORS === "1";
export const EMULATOR_PROJECT_ID = "demo-nok-os";

// Initialize Firebase
const app = initializeApp(USE_EMULATORS ? { ...firebaseConfig, projectId: EMULATOR_PROJECT_ID } : firebaseConfig);

// Analytics starts once the page has loaded and the browser is idle, and its
// code (plus Google's gtag script) is only downloaded then, so it never
// competes with the page itself. It only runs in a real browser, which also
// keeps this module safe to import from the Node build/prerender scripts.
let analyticsInstance: import("firebase/analytics").Analytics | null = null;
let analyticsLogEvent: typeof import("firebase/analytics").logEvent | null = null;
whenIdle(async () => {
  if (USE_EMULATORS) return;
  const { getAnalytics, isSupported, logEvent } = await import("firebase/analytics");
  if (await isSupported()) {
    analyticsInstance = getAnalytics(app);
    analyticsLogEvent = logEvent;
  }
});

export const logAnalyticsEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (analyticsInstance && analyticsLogEvent) {
    analyticsLogEvent(analyticsInstance, eventName, params);
  }
};

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider configured for Gmail Send
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/gmail.send");

export const signInWithGoogleGmail = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth Access Token.");
    }
    return { user: result.user, accessToken: credential.accessToken };
  } catch (err) {
    console.error("Google Gmail Sign-In Error:", err);
    throw err;
  }
};

// Google Auth Provider configured for Google Calendar
const googleCalendarProvider = new GoogleAuthProvider();
googleCalendarProvider.addScope("https://www.googleapis.com/auth/calendar");

export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    const result = await signInWithPopup(auth, googleCalendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth Access Token.");
    }
    return { user: result.user, accessToken: credential.accessToken };
  } catch (err) {
    console.error("Google Calendar Sign-In Error:", err);
    throw err;
  }
};

// Initialize Firestore (default database on the nok-os-prod project).
export const db = getFirestore(app);

if (USE_EMULATORS) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}


// Interfaces
export interface Brand {
  id: string;
  name: string;
  domain: string;
  industry: string;
  primaryColor: string;
  logoText: string;
  voiceTone: string;
  tagline: string;
  createdAt?: any;
  contentPillars?: string;
  audiencePersonas?: string;
  competitorContext?: string;
  platformNotes?: string;
  brandDescription?: string;
  campaignObjective?: string;
}

// A lead captured from the public /resources page (not brand-scoped — the
// resources hub is agency-wide marketing, not tied to a specific client brand).
export interface Lead {
  id: string;
  name: string;
  email: string;
  businessName: string;
  resourceId: string;
  resourceTitle: string;
  source: string;
  timestamp?: any;
}

export interface CampaignQueue {
  id: string;
  brandId: string;
  title: string;
  channel: "Twitter/X" | "LinkedIn" | "Instagram" | "Newsletter" | "YouTube";
  status: "active" | "processing" | "scheduled" | "completed" | "posted" | "waiting posting" | "wasn't posted";
  scheduledTime: string;
  content: string;
  metrics?: {
    estimatedReach: number;
    engagementRate: number;
  };
  createdAt?: any;
}

export interface CalendarEvent {
  id: string;
  brandId: string;
  title: string;
  date: string;
  type: "Campaign" | "Launch" | "Newsletter" | "Event" | "Social";
  status: "Draft" | "Planned" | "Published" | "Under Review";
  notes?: string;
}

// Creative brief types live in ./briefs (shared with the API server and the
// Claude connector). Re-exported here so existing imports keep working.
export type { CreativeBrief, CreativeBriefV1, CreativeBriefV2, NewCreativeBrief } from "./briefs";
import type { Reviewable } from "./review";
import type { Confidence } from "./insights";
import type { CreativeBrief } from "./briefs";

export interface AnalyticsMetric {
  id: string;
  brandId: string;
  label: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  trend: number[];
}


export interface StrategicInsight extends Reviewable {
  id: string;
  brandId: string;
  title: string;
  desc: string;
  standpoint: "analytics" | "observation" | "opportunity" | "pattern" | "lesson";
  // "Draft" = written by Claude, not yet reviewed. "Pending" = awaiting review.
  status: "Draft" | "Pending" | "Approved" | "Rejected" | "Changes Requested";
  metric: string;
  change: string;
  type: "positive" | "warning" | "neutral";
  // What supports the insight (figures, posts, period) and how sure it is.
  evidence?: string;
  confidence?: Confidence;
  confidenceReason?: string;
  createdAt?: string;
  // Set to "claude" on drafts written through the Claude connector (mcp/).
  createdBy?: "claude";
  // Client-supplied id that makes connector writes safe to retry.
  requestId?: string;
}

export interface BrandDirection extends Reviewable {
  id: string;
  brandId: string;
  pillar: string;
  strategy: string;
  focus: string;
  checklist: string[];
  status?: "Draft" | "Pending" | "Approved" | "Rejected" | "Changes Requested";
  createdAt?: string;
  // Set to "claude" on drafts written through the Claude connector (mcp/).
  createdBy?: "claude";
  // Client-supplied id that makes connector writes safe to retry.
  requestId?: string;
}

export interface RawAnalyticsRow {
  id: string;
  brandId: string;
  title: string;
  platform: string;
  type: string;
  impressions: number;
  engagement: number;
  engagementRate: number;
  dayOfWeek: string;
  createdAt?: string;
  datasetType?: "baseline" | "comparison";
  
  // Extra engagement breakdown & reach/conversion fields
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  profileVisits?: number;
  follows?: number;
  saveRate?: number;
  followConversionRate?: number;
}

export interface CreativeIdea {
  id: string;
  brandId: string;
  title: string;
  category: "caption" | "hashtag" | "concept" | "inspiration" | "general";
  content: string;
  tags: string[];
  createdAt: string;
  aiGenerated?: boolean;
}

export interface CalendarShareLink {
  id: string;
  token: string;
  brandId: string;
  brandName?: string;
  periodType: "month" | "week";
  month: number;
  year: number;
  weekNumber?: number;
  periodLabel: string;
  createdAt: string;
  revoked: boolean;
  revokedAt?: string;
  lastAccessedAt?: string;
  lastActionAt?: string;
  lastActionSummary?: string;
  lastEmailSentAt?: string;
  emailRecipient?: string;
  emailSentCount?: number;
}

// Firestore read errors are reported (the app shows a notification) instead
// of being covered up with sample data. BrandContext installs the reporter.
let reportReadError = (what: string, err: unknown) => console.warn(`Firestore read failed (${what}):`, err);
export const setFirestoreErrorReporter = (fn: (what: string, err: unknown) => void) => {
  reportReadError = fn;
};

// Firestore helper: Listen to Brands (live streaming)
export const subscribeToBrands = (onUpdate: (brands: Brand[]) => void) => {
  return onSnapshot(collection(db, "brands"), (snapshot) => {
    const list: Brand[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Brand);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("brands", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to Campaign Queues filtered by active brandId (live streaming)
export const subscribeToCampaignQueues = (brandId: string, onUpdate: (queues: CampaignQueue[]) => void) => {
  const q = query(
    collection(db, "campaignQueues"), 
    where("brandId", "==", brandId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const list: CampaignQueue[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as CampaignQueue);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("posting queue", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to leads captured from the public /resources page.
// Not brand-scoped, so unlike the other subscribe* helpers this takes no brandId.
export const subscribeToLeads = (onUpdate: (leads: Lead[]) => void) => {
  const q = query(collection(db, "leads"), orderBy("timestamp", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list: Lead[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as Lead);
    });
    onUpdate(list);
  }, (err) => {
    console.warn("Firestore subscription error loading leads:", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to Calendar Events
export const subscribeToCalendarEvents = (brandId: string, onUpdate: (events: CalendarEvent[]) => void) => {
  const q = query(
    collection(db, "calendarEvents"), 
    where("brandId", "==", brandId)
  );
  
  return onSnapshot(q, (snapshot) => {
    const list: CalendarEvent[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as CalendarEvent);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("calendar events", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to Creative Briefs
export const subscribeToBriefs = (brandId: string, onUpdate: (briefs: CreativeBrief[]) => void) => {
  const q = query(collection(db, "briefs"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: CreativeBrief[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as CreativeBrief);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("briefs", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to Metrics
export const subscribeToMetrics = (brandId: string, onUpdate: (metrics: AnalyticsMetric[]) => void) => {
  const q = query(collection(db, "metrics"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: AnalyticsMetric[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as AnalyticsMetric);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("metrics", err);
    onUpdate([]);
  });
};

// Listen to Strategic Insights
export const subscribeToInsights = (brandId: string, onUpdate: (insights: StrategicInsight[]) => void) => {
  const q = query(collection(db, "strategicInsights"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: StrategicInsight[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as StrategicInsight);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("insights", err);
    onUpdate([]);
  });
};

// Listen to Brand Positioning Directions
export const subscribeToDirections = (brandId: string, onUpdate: (directions: BrandDirection[]) => void) => {
  const q = query(collection(db, "brandDirections"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: BrandDirection[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as BrandDirection);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("directions", err);
    onUpdate([]);
  });
};

// Listen to Raw Analytics Rows
export const subscribeToRawAnalytics = (brandId: string, onUpdate: (rows: RawAnalyticsRow[]) => void) => {
  const q = query(collection(db, "rawAnalytics"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: RawAnalyticsRow[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as RawAnalyticsRow);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("analytics", err);
    onUpdate([]);
  });
};

// Listen to Creative Ideas (sandbox)
export const subscribeToIdeas = (brandId: string, onUpdate: (ideas: CreativeIdea[]) => void) => {
  const q = query(collection(db, "creativeIdeas"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: CreativeIdea[] = [];
    snapshot.forEach((doc) => {
      list.push({ ...doc.data(), id: doc.id } as CreativeIdea);
    });
    onUpdate(list);
  }, (err) => {
    reportReadError("creative ideas", err);
    onUpdate([]);
  });
};

// Firestore helper: Listen to public blog posts (live streaming).
export const subscribeToBlogPosts = (onUpdate: (posts: BlogPost[]) => void, onSettled?: () => void) => {
  const q = query(collection(db, "blogPosts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const list: BlogPost[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as BlogPost));
      onUpdate(list);
    }
    onSettled?.();
  }, (err) => {
    console.warn("Firestore subscription error on blogPosts:", err);
    onSettled?.();
  });
};

// Firestore helper: Listen to public client brand showcase entries (live streaming).
export const subscribeToClientBrands = (onUpdate: (brands: ClientBrand[]) => void) => {
  return onSnapshot(collection(db, "clientBrands"), (snapshot) => {
    if (!snapshot.empty) {
      const list: ClientBrand[] = [];
      snapshot.forEach((d) => list.push({ ...d.data(), id: d.id } as ClientBrand));
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error on clientBrands:", err);
  });
};

// Firestore helper: Listen to Discovery Call bookings submitted from the public
// homepage modal (live streaming), so staff see them in the CMS inbox regardless
// of which device the visitor booked from.
export const subscribeToDiscoveryRequests = (onUpdate: (requests: DiscoveryRequest[]) => void) => {
  const q = query(collection(db, "discoveryRequests"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const list: DiscoveryRequest[] = [];
    snapshot.forEach((d) => list.push(withCurrentServiceNames({ ...d.data(), id: d.id } as DiscoveryRequest)));
    onUpdate(list);
  }, (err) => {
    console.warn("Firestore subscription error on discoveryRequests:", err);
  });
};

// Firestore helper: Discovery call availability (public read, staff write).
// Falls back to the defaults until staff save their own settings.
export const subscribeToCallAvailability = (onUpdate: (availability: CallAvailability) => void) => {
  return onSnapshot(doc(db, "cms", "callAvailability"), (snap) => {
    onUpdate(snap.exists() ? { ...INITIAL_CALL_AVAILABILITY, ...(snap.data() as CallAvailability) } : INITIAL_CALL_AVAILABILITY);
  }, (err) => {
    console.warn("Firestore subscription error on callAvailability:", err);
  });
};

// Firestore helper: Upcoming taken discovery call slots. Each doc only holds the
// slot time and the request id that claimed it — no visitor details — so the
// public booking modal can grey out taken times.
export const subscribeToTakenSlots = (onUpdate: (slotIds: Set<string>) => void) => {
  const fromId = new Date().toISOString().slice(0, 16);
  const q = query(collection(db, "discoverySlots"), where("start", ">=", fromId));
  return onSnapshot(q, (snapshot) => {
    onUpdate(new Set(snapshot.docs.map((d) => d.id)));
  }, (err) => {
    console.warn("Firestore subscription error on discoverySlots:", err);
  });
};

// One-time migration: if the "services"/"cms"/"blogPosts"/"clientBrands"
// Firestore data has never been created, seed it from whatever the caller currently has
// (e.g. this browser's pre-existing localStorage edits) so those edits aren't lost when
// switching over to Firestore sync.
//
// discoveryRequests are deliberately NOT seeded here: they're real inbound leads
// from the live site, so "collection is empty" legitimately means "no bookings yet"
// (or "staff cleared them") — never "needs placeholder data". Seeding them here made
// deleted calls reappear on the next staff sign-in.
export const migrateCmsToFirestoreIfEmpty = async (
  currentBlogPosts?: BlogPost[],
  currentClientBrands?: ClientBrand[]
) => {
  try {
    // Agency info and services are set in code now (src/content), so they're
    // deliberately not seeded: re-creating them would undo deleting them.
    const [blogSnap, brandsSnap] = await Promise.all([
      getDocs(collection(db, "blogPosts")),
      getDocs(collection(db, "clientBrands"))
    ]);
    if (blogSnap.empty) {
      const posts = currentBlogPosts && currentBlogPosts.length > 0 ? currentBlogPosts : INITIAL_BLOG_POSTS;
      for (let i = 0; i < posts.length; i++) {
        // Descending index gives the first (most recent) post the latest createdAt,
        // preserving the array's newest-first order under an orderBy("createdAt", "desc") query.
        const createdAt = new Date(Date.now() - i * 1000).toISOString();
        await setDoc(doc(db, "blogPosts", posts[i].id), cleanFirestoreData({ ...posts[i], createdAt }));
      }
    }
    if (brandsSnap.empty) {
      const brands = currentClientBrands && currentClientBrands.length > 0 ? currentClientBrands : INITIAL_CLIENT_BRANDS;
      for (const b of brands) {
        await setDoc(doc(db, "clientBrands", b.id), cleanFirestoreData(b));
      }
    }
  } catch (error) {
    console.warn("CMS Firestore migration skipped:", error);
  }
};

// ==========================================
// CALENDAR TOKENIZED SHARE LINKS & REVIEW
// ==========================================

export const generateSecureCalendarToken = (): string => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "csl_";
  for (let i = 0; i < 28; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const getOrCreateCalendarShareLink = async (
  brandId: string,
  month: number,
  year: number,
  periodType: "month" | "week" = "month",
  weekNumber?: number,
  periodLabel?: string,
  brandName?: string
): Promise<CalendarShareLink> => {
  const shareLinksRef = collection(db, "calendarShareLinks");

  // Check if there is an active (non-revoked) link for this exact brand and period
  let q;
  if (periodType === "week" && weekNumber !== undefined) {
    q = query(
      shareLinksRef,
      where("brandId", "==", brandId),
      where("year", "==", year),
      where("month", "==", month),
      where("periodType", "==", "week"),
      where("weekNumber", "==", weekNumber),
      where("revoked", "==", false)
    );
  } else {
    q = query(
      shareLinksRef,
      where("brandId", "==", brandId),
      where("year", "==", year),
      where("month", "==", month),
      where("periodType", "==", "month"),
      where("revoked", "==", false)
    );
  }

  // Let errors here (permission-denied, network, wrong project, etc.) propagate
  // to the caller instead of silently returning an unsaved token — a link that
  // looks valid but was never persisted is worse than a visible failure.
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as Omit<CalendarShareLink, "id">) };
  }

  // Otherwise create a new unguessable token link
  const token = generateSecureCalendarToken();
  const newLinkData: Omit<CalendarShareLink, "id"> = {
    token,
    brandId,
    brandName: brandName || brandId,
    periodType,
    month,
    year,
    ...(weekNumber !== undefined ? { weekNumber } : {}),
    periodLabel: periodLabel || `${month + 1}/${year}`,
    createdAt: new Date().toISOString(),
    revoked: false,
    emailSentCount: 0
  };

  const docRef = await addDoc(shareLinksRef, newLinkData);
  return { id: docRef.id, ...newLinkData };
};

// NOTE: token -> share link resolution now happens server-side via
// POST /api/calendar-review/exchange (see server.ts + ClientCalendarApprovalView),
// which validates the token with trusted Admin SDK access and mints a scoped
// custom auth token, instead of querying calendarShareLinks directly as an
// unauthenticated client (Firestore rules no longer allow that).

export const revokeCalendarShareLink = async (linkId: string): Promise<void> => {
  try {
    const linkRef = doc(db, "calendarShareLinks", linkId);
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(linkRef, {
      revoked: true,
      revokedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error revoking calendar share link:", error);
  }
};

export const regenerateCalendarShareLink = async (
  currentLinkId: string,
  brandId: string,
  month: number,
  year: number,
  periodType: "month" | "week" = "month",
  weekNumber?: number,
  periodLabel?: string,
  brandName?: string
): Promise<CalendarShareLink> => {
  if (currentLinkId) {
    await revokeCalendarShareLink(currentLinkId);
  }
  
  // Create a brand new fresh token
  const shareLinksRef = collection(db, "calendarShareLinks");
  const token = generateSecureCalendarToken();
  const newLinkData: Omit<CalendarShareLink, "id"> = {
    token,
    brandId,
    brandName: brandName || brandId,
    periodType,
    month,
    year,
    ...(weekNumber !== undefined ? { weekNumber } : {}),
    periodLabel: periodLabel || `${month + 1}/${year}`,
    createdAt: new Date().toISOString(),
    revoked: false,
    emailSentCount: 0
  };

  const docRef = await addDoc(shareLinksRef, newLinkData);
  return { id: docRef.id, ...newLinkData };
};

export const recordShareLinkAccess = async (linkId: string): Promise<void> => {
  if (!linkId) return;
  try {
    const linkRef = doc(db, "calendarShareLinks", linkId);
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(linkRef, {
      lastAccessedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Could not record share link access timestamp:", err);
  }
};

export const recordShareLinkAction = async (
  linkId: string,
  actionSummary: string
): Promise<void> => {
  if (!linkId) return;
  try {
    const linkRef = doc(db, "calendarShareLinks", linkId);
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(linkRef, {
      lastActionAt: new Date().toISOString(),
      lastActionSummary: actionSummary
    });
  } catch (err) {
    console.warn("Could not record share link action timestamp:", err);
  }
};

export const recordShareLinkEmailSent = async (
  linkId: string,
  recipient: string
): Promise<void> => {
  if (!linkId) return;
  try {
    const linkRef = doc(db, "calendarShareLinks", linkId);
    const { updateDoc, increment } = await import("firebase/firestore");
    await updateDoc(linkRef, {
      lastEmailSentAt: new Date().toISOString(),
      emailRecipient: recipient,
      emailSentCount: increment(1)
    });
  } catch (err) {
    console.warn("Could not record email sent metadata:", err);
  }
};

/**
 * Strips all undefined fields recursively from an object so Firestore operations (setDoc, updateDoc, addDoc) never fail.
 */
export function cleanFirestoreData<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as any;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        result[key] = cleanFirestoreData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result as T;
}


