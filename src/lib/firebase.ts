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
  orderBy
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// Config parsed from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyAw1xfMuRvf9z8QBC1idtIoUeH-eBeNyKE",
  authDomain: "perceptive-enterprise-hhh41.firebaseapp.com",
  projectId: "perceptive-enterprise-hhh41",
  storageBucket: "perceptive-enterprise-hhh41.firebasestorage.app",
  messagingSenderId: "79721164862",
  appId: "1:79721164862:web:fc42ff7c2727e42aefa16f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore. 
// Note: We use the specific custom database ID provisioned for this applet
export const db = getFirestore(app, "ai-studio-e3932094-ce6a-4b33-8e66-55c4292dcc93");

// Initialize Cloud Functions
export const functions = getFunctions(app, "us-central1");

// Helper to sign in anonymously for Auth Context if needed
export const ensureAuthenticated = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
      console.log("Logged in anonymously to Firebase Auth");
    } catch (error: any) {
      if (error && (error.code === "auth/admin-restricted-operation" || String(error).includes("admin-restricted-operation"))) {
        console.warn("Firebase Anonymous Auth is restricted by admin policy. Operating in sandbox / open database mode.");
      } else {
        console.warn("Error signing in anonymously:", error);
      }
    }
  }
};

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
}

export interface CampaignQueue {
  id: string;
  brandId: string;
  title: string;
  channel: "Twitter/X" | "LinkedIn" | "Instagram" | "Newsletter" | "YouTube";
  status: "active" | "processing" | "scheduled" | "completed";
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

export interface CreativeBrief {
  id: string;
  brandId: string;
  title: string;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  deliverables: string;
  status: "Draft" | "Approved" | "In Progress";
}

export interface AnalyticsMetric {
  id: string;
  brandId: string;
  label: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  trend: number[];
}

export interface PerformanceIntelligenceReport {
  id: string;
  brandId: string;
  generatedAt: string;
  recommendations: string[];
  metricsSummary: {
    bestChannel: string;
    optimalPostingHour: string;
    predictedGrowth: string;
    roiFactor: string;
  };
}

export interface StrategicInsight {
  id: string;
  brandId: string;
  title: string;
  desc: string;
  standpoint: "analytics" | "observation" | "opportunity" | "pattern" | "lesson";
  status: "Pending" | "Approved" | "Rejected";
  metric: string;
  change: string;
  type: "positive" | "warning" | "neutral";
  createdAt?: string;
}

export interface BrandDirection {
  id: string;
  brandId: string;
  pillar: string;
  strategy: string;
  focus: string;
  checklist: string[];
  createdAt?: string;
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
}

// Pre-seeded local fallback data in case Firestore is unreachable or empty
export const FALLBACK_BRANDS: Brand[] = [
  {
    id: "acme-corp",
    name: "Acme Corp",
    domain: "acme.com",
    industry: "SaaS & Automation",
    primaryColor: "emerald",
    logoText: "AC",
    voiceTone: "Professional, Authoritative, Informative",
    tagline: "Unifying global pipelines through intelligent automation."
  },
  {
    id: "global-ind",
    name: "Global Industries",
    domain: "globalcorp.io",
    industry: "Logistics & Energy",
    primaryColor: "indigo",
    logoText: "GI",
    voiceTone: "Bold, Visionary, Eco-conscious",
    tagline: "Powering the future of resource optimization."
  },
  {
    id: "horizon-tech",
    name: "Horizon Tech",
    domain: "horizon.app",
    industry: "Consumer Electronics",
    primaryColor: "rose",
    logoText: "HT",
    voiceTone: "Playful, Friendly, Minimalist",
    tagline: "Beautiful hardware designed for elegant daily living."
  }
];

export const FALLBACK_QUEUES: CampaignQueue[] = [
  {
    id: "q-1",
    brandId: "acme-corp",
    title: "V2 Platform Launch Announcement",
    channel: "LinkedIn",
    status: "active",
    scheduledTime: "2026-06-30 09:00 AM",
    content: "We are thrilled to announce Acme Platform V2! Real-time telemetry, automated healing pipelines, and modular workflow adapters are now generally available. Read our launch brief.",
    metrics: { estimatedReach: 45000, engagementRate: 4.8 }
  },
  {
    id: "q-2",
    brandId: "acme-corp",
    title: "Serverless Scaling Infographic",
    channel: "Twitter/X",
    status: "processing",
    scheduledTime: "2026-06-30 02:30 PM",
    content: "Why are teams migrating to serverless databases? 1. Zero-idle costs 2. Sub-second auto-scaling 3. Instant replica forks. Here is the full breakdown. 👇",
    metrics: { estimatedReach: 12000, engagementRate: 6.2 }
  },
  {
    id: "q-3",
    brandId: "acme-corp",
    title: "July Newsletter Draft",
    channel: "Newsletter",
    status: "scheduled",
    scheduledTime: "2026-07-02 08:00 AM",
    content: "Your monthly digest is here. We explore multi-tenant partition design models, Firebase callable triggers, and how to structure your SaaS command panels.",
    metrics: { estimatedReach: 8500, engagementRate: 22.4 }
  },
  {
    id: "q-4",
    brandId: "global-ind",
    title: "Sustainable Grid Integration Press Release",
    channel: "LinkedIn",
    status: "active",
    scheduledTime: "2026-06-29 11:00 AM",
    content: "Global Industries has partnered with NetZero Power to integrate 400MW of offshore wind into the eastern distribution grid. Our commitment to high-density clean logistics remains firm.",
    metrics: { estimatedReach: 98000, engagementRate: 3.5 }
  },
  {
    id: "q-5",
    brandId: "global-ind",
    title: "Heavy Cargo Transport Optimization Video",
    channel: "YouTube",
    status: "scheduled",
    scheduledTime: "2026-07-05 04:00 PM",
    content: "Behind the scenes: How we utilized multi-commodity network flow models to reduce oceanic deadhead legs by 18.3%. Watch the full interview with our chief logistics architect.",
    metrics: { estimatedReach: 32000, engagementRate: 8.9 }
  },
  {
    id: "q-6",
    brandId: "horizon-tech",
    title: "Horizon Light Minimalist Speaker Teaser",
    channel: "Instagram",
    status: "active",
    scheduledTime: "2026-06-30 10:00 AM",
    content: "Pure acoustic resonance wrapped in brushed magnesium and tactile linen. A speaker designed not to occupy space, but to enrich it. Pre-orders open Thursday.",
    metrics: { estimatedReach: 150000, engagementRate: 7.4 }
  }
];

export const FALLBACK_CALENDAR: CalendarEvent[] = [
  { id: "e-1", brandId: "acme-corp", title: "API v2 Sandbox Open", date: "2026-06-28", type: "Launch", status: "Published", notes: "Public access opened to developers" },
  { id: "e-2", brandId: "acme-corp", title: "LinkedIn Launch Announcement", date: "2026-06-30", type: "Campaign", status: "Planned", notes: "Main launch visual asset required" },
  { id: "e-3", brandId: "acme-corp", title: "Dev Relations AMA Session", date: "2026-07-02", type: "Event", status: "Planned", notes: "Live on YouTube / Twitter spaces" },
  { id: "e-4", brandId: "global-ind", title: "Bi-Annual Logistics Summit", date: "2026-07-10", type: "Event", status: "Under Review", notes: "Keynote presentation slide deck final check" },
  { id: "e-5", brandId: "horizon-tech", title: "Pre-Order Opening Stream", date: "2026-07-02", type: "Campaign", status: "Planned", notes: "Countdown timer on website landing page" }
];

export const FALLBACK_BRIEFS: CreativeBrief[] = [
  {
    id: "b-1",
    brandId: "acme-corp",
    title: "Serverless Benefits Q3 Social Pack",
    objective: "Establish Acme as the ultimate cloud orchestrator for lean startups and modern dev teams.",
    targetAudience: "Senior Developers, CTOs, Tech Leads",
    keyMessage: "Acme cuts down pipeline idle spend by 90% while improving scaling agility.",
    deliverables: "3x Carousel graphic templates, 2x video scripts, 1x cheat sheet PDF",
    status: "In Progress"
  },
  {
    id: "b-2",
    brandId: "global-ind",
    title: "Decarbonization Impact Deck",
    objective: "Attract sustainable ESG investment portfolios by demonstrating our clear, audited carbon offset pipeline.",
    targetAudience: "Institutional Investors, Green Board Members",
    keyMessage: "Global Industries is tracking 2 years ahead of its Scope-2 net-neutrality targets.",
    deliverables: "18-slide Keynote/PDF deck, interactive carbon calculator embed",
    status: "Approved"
  }
];

export const FALLBACK_METRICS: Record<string, AnalyticsMetric[]> = {
  "acme-corp": [
    { id: "m-1", brandId: "acme-corp", label: "Active Integrations", value: "12,482", change: "+14.3%", changeType: "increase", trend: [10, 11, 11, 12, 12.4] },
    { id: "m-2", brandId: "acme-corp", label: "Workspace Members", value: "3,891", change: "+8.2%", changeType: "increase", trend: [3.4, 3.5, 3.7, 3.8, 3.89] },
    { id: "m-3", brandId: "acme-corp", label: "Serverless Invocations", value: "8.4M", change: "+24.1%", changeType: "increase", trend: [5, 6, 6.8, 7.5, 8.4] },
    { id: "m-4", brandId: "acme-corp", label: "Avg. Process Latency", value: "142ms", change: "-12.5%", changeType: "increase", trend: [180, 170, 162, 150, 142] }
  ],
  "global-ind": [
    { id: "m-5", brandId: "global-ind", label: "Managed Cargo Hubs", value: "248", change: "+2.1%", changeType: "increase", trend: [240, 242, 245, 247, 248] },
    { id: "m-6", brandId: "global-ind", label: "Grid Renewable Mix", value: "68.4%", change: "+5.8%", changeType: "increase", trend: [62, 63, 65, 67, 68.4] },
    { id: "m-7", brandId: "global-ind", label: "Total Asset Utilisation", value: "91.2%", change: "+0.4%", changeType: "neutral", trend: [90, 91, 91, 91, 91.2] },
    { id: "m-8", brandId: "global-ind", label: "Operational Fleet Count", value: "4,120", change: "-1.2%", changeType: "decrease", trend: [4180, 4160, 4150, 4130, 4120] }
  ],
  "horizon-tech": [
    { id: "m-9", brandId: "horizon-tech", label: "Retail Registrations", value: "88,290", change: "+34.2%", changeType: "increase", trend: [50, 60, 72, 81, 88.2] },
    { id: "m-10", brandId: "horizon-tech", label: "Pre-order Waitlist", value: "12,850", change: "+112.5%", changeType: "increase", trend: [3, 5, 8, 10, 12.8] },
    { id: "m-11", brandId: "horizon-tech", label: "Eco-packaging Rate", value: "100.0%", change: "Stable", changeType: "neutral", trend: [100, 100, 100, 100, 100] },
    { id: "m-12", brandId: "horizon-tech", label: "Direct-to-Consumer ROI", value: "4.2x", change: "+18.9%", changeType: "increase", trend: [3.2, 3.5, 3.8, 4.0, 4.2] }
  ]
};

// Seeder Function to populate Firestore so the DB is not empty
export const seedDatabaseIfEmpty = async () => {
  try {
    await ensureAuthenticated();
    
    // Check if brands exist
    const brandsSnapshot = await getDocs(collection(db, "brands"));
    if (brandsSnapshot.empty) {
      console.log("Firestore empty. Seeding workspace default data...");
      
      // Seed Brands
      for (const b of FALLBACK_BRANDS) {
        await setDoc(doc(db, "brands", b.id), b);
      }
      
      // Seed Campaigns
      for (const q of FALLBACK_QUEUES) {
        await setDoc(doc(db, "campaignQueues", q.id), q);
      }
      
      // Seed Calendar
      for (const e of FALLBACK_CALENDAR) {
        await setDoc(doc(db, "calendarEvents", e.id), e);
      }
      
      // Seed Briefs
      for (const b of FALLBACK_BRIEFS) {
        await setDoc(doc(db, "briefs", b.id), b);
      }

      // Seed Metrics
      for (const bId of Object.keys(FALLBACK_METRICS)) {
        for (const metric of FALLBACK_METRICS[bId]) {
          await setDoc(doc(db, "metrics", metric.id), metric);
        }
      }

      console.log("Firestore workspace seeding completed successfully!");
    } else {
      console.log("Firestore already seeded. Ready.");
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
};

// Firestore helper: Listen to Brands (live streaming)
export const subscribeToBrands = (onUpdate: (brands: Brand[]) => void) => {
  return onSnapshot(collection(db, "brands"), (snapshot) => {
    const list: Brand[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Brand);
    });
    if (list.length === 0) {
      // Return fallback while seeding
      onUpdate(FALLBACK_BRANDS);
    } else {
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error, using fallback brands:", err);
    onUpdate(FALLBACK_BRANDS);
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
      list.push({ id: doc.id, ...doc.data() } as CampaignQueue);
    });
    if (list.length === 0) {
      onUpdate(FALLBACK_QUEUES.filter(c => c.brandId === brandId));
    } else {
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error, using fallback queues:", err);
    onUpdate(FALLBACK_QUEUES.filter(c => c.brandId === brandId));
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
      list.push({ id: doc.id, ...doc.data() } as CalendarEvent);
    });
    if (list.length === 0) {
      onUpdate(FALLBACK_CALENDAR.filter(e => e.brandId === brandId));
    } else {
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error, using fallback calendar:", err);
    onUpdate(FALLBACK_CALENDAR.filter(e => e.brandId === brandId));
  });
};

// Firestore helper: Listen to Creative Briefs
export const subscribeToBriefs = (brandId: string, onUpdate: (briefs: CreativeBrief[]) => void) => {
  const q = query(collection(db, "briefs"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: CreativeBrief[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as CreativeBrief);
    });
    if (list.length === 0) {
      onUpdate(FALLBACK_BRIEFS.filter(b => b.brandId === brandId));
    } else {
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error, using fallback briefs:", err);
    onUpdate(FALLBACK_BRIEFS.filter(b => b.brandId === brandId));
  });
};

// Firestore helper: Listen to Metrics
export const subscribeToMetrics = (brandId: string, onUpdate: (metrics: AnalyticsMetric[]) => void) => {
  const q = query(collection(db, "metrics"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: AnalyticsMetric[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as AnalyticsMetric);
    });
    if (list.length === 0) {
      onUpdate(FALLBACK_METRICS[brandId] || FALLBACK_METRICS["acme-corp"]);
    } else {
      onUpdate(list);
    }
  }, (err) => {
    console.warn("Firestore subscription error, using fallback metrics:", err);
    onUpdate(FALLBACK_METRICS[brandId] || FALLBACK_METRICS["acme-corp"]);
  });
};

// Listen to Strategic Insights
export const subscribeToInsights = (brandId: string, onUpdate: (insights: StrategicInsight[]) => void) => {
  const q = query(collection(db, "strategicInsights"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: StrategicInsight[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as StrategicInsight);
    });
    onUpdate(list);
  }, (err) => {
    console.warn("Error subscribing to insights:", err);
    onUpdate([]);
  });
};

// Listen to Brand Positioning Directions
export const subscribeToDirections = (brandId: string, onUpdate: (directions: BrandDirection[]) => void) => {
  const q = query(collection(db, "brandDirections"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: BrandDirection[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as BrandDirection);
    });
    onUpdate(list);
  }, (err) => {
    console.warn("Error subscribing to directions:", err);
    onUpdate([]);
  });
};

// Listen to Raw Analytics Rows
export const subscribeToRawAnalytics = (brandId: string, onUpdate: (rows: RawAnalyticsRow[]) => void) => {
  const q = query(collection(db, "rawAnalytics"), where("brandId", "==", brandId));
  return onSnapshot(q, (snapshot) => {
    const list: RawAnalyticsRow[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as RawAnalyticsRow);
    });
    onUpdate(list);
  }, (err) => {
    console.warn("Error subscribing to raw analytics:", err);
    onUpdate([]);
  });
};

// Callable Cloud Function client invocation
export const generatePerformanceIntelligence = async (brandId: string, metricsPayload: any): Promise<PerformanceIntelligenceReport> => {
  try {
    await ensureAuthenticated();
    
    // Attempt HTTPS Callable Functions call to v2 Cloud Function 'generatePerformanceIntelligence'
    const generateIntelligenceFn = httpsCallable<
      { brandId: string; metrics: any }, 
      { success: boolean; data: PerformanceIntelligenceReport }
    >(functions, "generatePerformanceIntelligence");
    
    const result = await generateIntelligenceFn({ brandId, metrics: metricsPayload });
    return result.data.data;
  } catch (error) {
    console.warn("Cloud Functions call failed, falling back to mock intelligence engine:", error);
    
    // Local processing fallback so the application works seamlessly
    return new Promise((resolve) => {
      setTimeout(() => {
        const timestamp = new Date().toISOString();
        const fallbackReports: Record<string, PerformanceIntelligenceReport> = {
          "acme-corp": {
            id: "rep-acme-" + Date.now(),
            brandId: "acme-corp",
            generatedAt: timestamp,
            recommendations: [
              "Increase LinkedIn deployment rate on Tuesdays at 09:00 AM based on +24% click-through trend.",
              "Adjust tone of 'Serverless Scaling' copy to include more comparative benchmarking.",
              "Pause newsletter pipeline scheduled for Thursday; historical CTR drops by 14% on pre-holiday brackets."
            ],
            metricsSummary: {
              bestChannel: "LinkedIn",
              optimalPostingHour: "09:00 AM",
              predictedGrowth: "+18.4% reach",
              roiFactor: "4.8x"
            }
          },
          "global-ind": {
            id: "rep-global-" + Date.now(),
            brandId: "global-ind",
            generatedAt: timestamp,
            recommendations: [
              "Promote heavy logistic automation videos via YouTube Shorts to target younger industrial tech stakeholders.",
              "Saturate green grid communications inside the morning EU timezone to capture corporate board activity.",
              "Ensure key message aligns strictly with Scope-2 reduction indices to maximize ESG score metrics."
            ],
            metricsSummary: {
              bestChannel: "YouTube / Video",
              optimalPostingHour: "01:00 PM",
              predictedGrowth: "+12.2% visibility",
              roiFactor: "3.2x"
            }
          },
          "horizon-tech": {
            id: "rep-horizon-" + Date.now(),
            brandId: "horizon-tech",
            generatedAt: timestamp,
            recommendations: [
              "Leverage high-fidelity lifestyle images of the Horizon Speaker to sustain the pre-order momentum.",
              "Run interactive Instagram Stories QA session on materials sourcing (linen & magnesium) to boost authentic voice.",
              "Scale target audience categories in ad spends to include premium spatial audio seekers."
            ],
            metricsSummary: {
              bestChannel: "Instagram",
              optimalPostingHour: "06:00 PM",
              predictedGrowth: "+42.5% pre-orders",
              roiFactor: "5.5x"
            }
          }
        };
        
        resolve(fallbackReports[brandId] || fallbackReports["acme-corp"]);
      }, 1200);
    });
  }
};
