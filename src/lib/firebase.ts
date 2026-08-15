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
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
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
  contentPillars?: string;
  audiencePersonas?: string;
  competitorContext?: string;
  platformNotes?: string;
  brandDescription?: string;
  campaignObjective?: string;
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

export interface CreativeBrief {
  id: string;
  brandId: string;
  title: string;
  objective: string;
  targetAudience: string;
  keyMessage: string;
  deliverables: string;
  status: "Proposed" | "Approved" | "Changes Requested" | "Draft" | "In Progress";
  campaignId?: string;
  date?: string;
  dayOfWeek?: "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | string;
  weekNumber?: number;
  sequencePosition?: string;
  proofPoint?: string;
  formatSpec?: string;
  contentOutline?: string;
  cta?: string;
  toneVisualRef?: string;
  successMetric?: string;
  approver?: string;
  // Content planner spreadsheet attributes
  platform?: string; // e.g. "Instagram, Facebook, LinkedIn, TikTok, Twitter"
  platforms?: string[];
  mainFocus?: string; // e.g. "Reach", "Engagement", "Link Click", "Sales"
  topicIdea?: string; // e.g. "What if your body and mind were your greatest asset?"
  contentPillar?: string; // e.g. "Marketing", "Tips", "Entertainment", "Story Time", "Workout"
  postType?: string; // e.g. "Artwork", "Carousel", "Video", "Reel"
  progressTracking?: "Create" | "Edit" | "Film" | "Review" | "Schedule" | "Done" | string;
  visualReference?: string;
  visualCopyDetail?: string; // e.g. "Story Arc:\nSlide 1 (Hook)...\nSlide 2 (Problem)..."
  copywritingCaption?: string; // e.g. "In three months, you could be wishing you had taken a step..."
  hashtags?: string;
  notes?: string;
  revisionNotes?: string; // Captures owner feedback when "Request Changes" is clicked
  workflowType?: "weekly" | "campaign" | "hybrid"; // Workflow classification
  campaignName?: string;
  campaignDropNumber?: number;
  totalCampaignDrops?: number;
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
  status?: "Pending" | "Approved" | "Rejected";
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

// Pre-seeded local fallback data in case Firestore is unreachable or empty
export const FALLBACK_IDEAS: CreativeIdea[] = [
  {
    id: "idea-acme-1",
    brandId: "acme-corp",
    title: "Serverless Cold Starts Copy Draft",
    category: "caption",
    content: "Cold starts are the silent killer of serverless applications. Here is how Acme's pre-warming adapter resolves it under 40ms without active idle costs.\n\nRead the technical brief below.",
    tags: ["SaaS", "Serverless", "ColdStarts"],
    createdAt: "2026-06-28T10:00:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-acme-2",
    brandId: "acme-corp",
    title: "DevOps & Cloud Engineers Hashtag Bundle",
    category: "hashtag",
    content: "#DevOps #CloudComputing #Serverless #BackendEngineering #SaaSArchitecture #SystemDesign #AcmeAutomation",
    tags: ["hashtags", "distribution", "devops"],
    createdAt: "2026-06-29T11:00:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-acme-3",
    brandId: "acme-corp",
    title: "The Legacy Monolith vs. Serverless Grid",
    category: "concept",
    content: "Visual Concept: A sleek, 2-column bento box comparison. Left is a bulky concrete block representing standard VM server costs. Right is a transparent neon blue lattice showing modular micro-allocations.",
    tags: ["bento", "visual-guide", "monolith"],
    createdAt: "2026-06-30T14:30:00.000Z",
    aiGenerated: true
  },
  {
    id: "idea-global-1",
    brandId: "global-ind",
    title: "Scope-2 Green Distribution Copy Draft",
    category: "caption",
    content: "Net-neutrality isn't a 2050 checklist goal — it is a quarterly logistics metric. By swapping regional deadhead miles for predictive routing, we saved 1,400 metric tons this month alone.",
    tags: ["Logistics", "Sustainability", "ESG"],
    createdAt: "2026-06-28T09:00:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-global-2",
    brandId: "global-ind",
    title: "Eco Supply Chain Hashtags",
    category: "hashtag",
    content: "#Sustainability #GreenLogistics #ESG #SupplyChainOptimization #WindGrid #CorporateResponsibility #LogisticsTech",
    tags: ["hashtags", "green", "supply-chain"],
    createdAt: "2026-06-29T08:30:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-horizon-1",
    brandId: "horizon-tech",
    title: "Minimalist Speaker Launch Carousel Caption",
    category: "caption",
    content: "Linen, magnesium, and pure resonance. The Horizon Minimalist Speaker doesn't just play sound — it organizes acoustic space. Pre-orders launching in 48 hours.",
    tags: ["InteriorDesign", "AudioTech", "Minimalism"],
    createdAt: "2026-06-28T15:00:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-horizon-2",
    brandId: "horizon-tech",
    title: "Premium Tech & Minimalism Hashtags",
    category: "hashtag",
    content: "#Minimalism #IndustrialDesign #SpatialAudio #PremiumHardware #InteriorAesthetic #HorizonSpeaker #SmartHome",
    tags: ["hashtags", "audiophile", "interior"],
    createdAt: "2026-06-29T10:15:00.000Z",
    aiGenerated: false
  },
  {
    id: "idea-horizon-3",
    brandId: "horizon-tech",
    title: "Brushed Magnesium Macro Visual Concept",
    category: "concept",
    content: "Visual Concept: High-contrast close-up shot focusing on the tactile linen mesh blending seamlessly into sand-blasted magnesium alloy curves. Studio lighting with amber undertone shadows.",
    tags: ["visual", "materials", "industrial-design"],
    createdAt: "2026-06-30T16:00:00.000Z",
    aiGenerated: true
  }
];

export const FALLBACK_BRANDS: Brand[] = [
  {
    id: "standout-clothing",
    name: "standout clothing",
    domain: "standout-clothing.ai.studio",
    industry: "Contemporary Streetwear & Unisex Fashion",
    primaryColor: "emerald",
    logoText: "SC",
    voiceTone: "Bold, Authentic, High-Street Minimalist",
    tagline: "Wear your story. Unapologetic premium streetwear crafted for the culture.",
    contentPillars: "New Drops, Cultural Storytelling, Fit Tutorials, Behind the Seams, Community Showcases",
    audiencePersonas: "Gen Z & Millennial urban creatives, streetwear enthusiasts, independent music and lifestyle tastemakers."
  },
  {
    id: "nkabomworldd",
    name: "nkabomworldd",
    domain: "nkabomworld-store.web.app",
    industry: "Streetwear & Cultural Apparel",
    primaryColor: "amber",
    logoText: "NW",
    voiceTone: "Unity-driven, Elevated, Afrocentric Modernism",
    tagline: "Connecting worlds through textile craftsmanship, urban heritage, and collective unity.",
    contentPillars: "Unity Stories, Artisan Craftsmanship, Limited Capsule Releases, Style Challenges, Street Culture",
    audiencePersonas: "Global diaspora, fashion-forward youth, creative storytellers celebrating authentic roots."
  },
  {
    id: "vividel-inc",
    name: "vividel inc.",
    domain: "vividel-inc.ai.studio",
    industry: "Digital Growth & Production Studio",
    primaryColor: "rose",
    logoText: "VI",
    voiceTone: "Precision, Sharp, High-Impact Visuals",
    tagline: "High-octane commercial cinematography, editorial branding, and cross-channel growth acceleration.",
    contentPillars: "Production BTS, Client Wins, Direct-Response Creative Tips, Campaign Breakdowns, Tech Stacks",
    audiencePersonas: "Founders, e-commerce direct-to-consumer brands, marketing executives seeking top-tier creative assets."
  },
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
    brandId: "standout-clothing",
    title: "Happy New Month Drop Teaser",
    channel: "Instagram",
    status: "active",
    scheduledTime: "2026-09-01 09:00 AM",
    content: "Happy New Month! 🚀 Kicking off September with our fresh capsule collection teaser. Reach out in the DMs for exclusive VIP drop access.",
    metrics: { estimatedReach: 45000, engagementRate: 5.8 }
  },
  {
    id: "q-2",
    brandId: "standout-clothing",
    title: "Body & Mind Streetwear Carousel",
    channel: "Instagram",
    status: "scheduled",
    scheduledTime: "2026-09-02 02:30 PM",
    content: "What if your body and mind were your greatest asset? Join us on our 6-week street-to-gym package and level up. DM us 'POWER' to get started.",
    metrics: { estimatedReach: 38000, engagementRate: 6.4 }
  },
  {
    id: "q-3",
    brandId: "nkabomworldd",
    title: "Unity Capsule Lookbook Teaser",
    channel: "Instagram",
    status: "scheduled",
    scheduledTime: "2026-09-02 11:00 AM",
    content: "Unity is in the stitch. Exploring our latest heavy cotton interlocking knit capsules. Direct store link in bio.",
    metrics: { estimatedReach: 52000, engagementRate: 7.2 }
  },
  {
    id: "q-4",
    brandId: "acme-corp",
    title: "V2 Platform Launch Announcement",
    channel: "LinkedIn",
    status: "active",
    scheduledTime: "2026-06-30 09:00 AM",
    content: "We are thrilled to announce Acme Platform V2! Real-time performance analytics, automated scaling pipelines, and modular workflow adapters are now generally available. Read our launch brief.",
    metrics: { estimatedReach: 45000, engagementRate: 4.8 }
  }
];

export const FALLBACK_CALENDAR: CalendarEvent[] = [
  { id: "e-1", brandId: "standout-clothing", title: "September Campaign Kickoff", date: "2026-09-01", type: "Launch", status: "Published", notes: "Public launch of Month 1 content grid" },
  { id: "e-2", brandId: "standout-clothing", title: "Workout Challenge Reel", date: "2026-09-05", type: "Campaign", status: "Planned", notes: "Tutorial reel with creator ambassador" },
  { id: "e-3", brandId: "acme-corp", title: "API v2 Sandbox Open", date: "2026-06-28", type: "Launch", status: "Published", notes: "Public access opened to developers" }
];

export const FALLBACK_BRIEFS: CreativeBrief[] = [
  // ================= STANDOUT CLOTHING / SEPTEMBER PLANNER (MATCHING USER IMAGES) =================
  {
    id: "brief-sc-w1-d1",
    brandId: "standout-clothing",
    title: "Happy New Month Announcement",
    weekNumber: 1,
    dayOfWeek: "Monday",
    date: "2026-09-01",
    platform: "Instagram, Facebook, LinkedIn, TikTok, Twitter",
    platforms: ["Instagram", "Facebook", "LinkedIn", "TikTok", "Twitter/X"],
    mainFocus: "Reach",
    topicIdea: "Happy New Month",
    contentPillar: "Marketing",
    postType: "Artwork",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "High-contrast editorial hero banner with warm gold accents and minimalist bold typography.",
    visualCopyDetail: "Visual Banner Concept:\nBold metallic headline: 'SEPTEMBER UNLOCKED'\nSub-copy: Step into the new cycle with purpose and unmatched craftsmanship.",
    copywritingCaption: "A new month brings new ambition. In three months, you could be wishing you had taken a step towards a bolder digital presence and healthier lifestyle earlier. Tap the link in bio or DM us to get started with the new collection.",
    hashtags: "#StandoutClothing #NewMonthNewGoals #StreetwearCulture #UrbanLifestyle #SeptemberEdition",
    objective: "Maximize organic Reach across all channels to announce the new monthly campaign cycle.",
    targetAudience: "Urban creators, fashion-forward youth, young professionals (18-35)",
    keyMessage: "Start the new month with intentional focus, style, and momentum.",
    deliverables: "1x High-res 1080x1350 artwork banner, 1x Story visual, 5x platform captions",
    formatSpec: "1080x1350px Portrait (IG) & 1920x1080px Landscape (LinkedIn)",
    approver: "Brand Owner / Creative Lead",
    notes: "Day 1 kickoff post for September"
  },
  {
    id: "brief-sc-w1-d2",
    brandId: "standout-clothing",
    title: "Body & Mind Greatest Asset Carousel",
    weekNumber: 1,
    dayOfWeek: "Tuesday",
    date: "2026-09-02",
    platform: "Instagram, Facebook, TikTok, LinkedIn, Twitter",
    platforms: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter/X"],
    mainFocus: "Engagement",
    topicIdea: "What if your body and mind were your greatest asset?",
    contentPillar: "Tips",
    postType: "Carousel",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "5-slide aesthetic carousel with dark neumorphic card framing, clean sans-serif typography and high-fashion streetwear athlete imagery.",
    visualCopyDetail: "Story Arc:\nSlide 1 (Hook - Problem Statement): What if your body and mind were your greatest asset?\nSlide 2 (The Friction): Most shortcuts lead to long-term burnout.\nSlide 3 (The Tip): Build non-negotiable daily habits in 20-min blocks.\nSlide 4 (The Transformation): Imagine where you'll stand in 6 weeks.\nSlide 5 (Call to Action): DM us 'POWER' to claim the blueprint.",
    copywritingCaption: "In three months, you could be wishing you had taken a step towards a healthier lifestyle earlier, and you may just be tempted to take a shortcut. But don't do that because shortcuts are dangerous. Join us on our 6 weeks package and achieve your desired weight in a healthy and risk free way. Send us a DM or fill the form in our bio 'tell us about your goals' to get started. Watch out for our series on shortcuts in weight loss.",
    hashtags: "#MindBodyAsset #HealthyHabits #FitnessJourney #NoShortcuts #ConsistencyWins #StandoutCommunity",
    objective: "Drive deep saves, comments, and DM conversations with insightful educational carousel.",
    targetAudience: "Active individuals seeking sustainable health, fitness & wellness habits.",
    keyMessage: "Shortcuts are dangerous—true transformation happens through structured, risk-free habits.",
    deliverables: "5-slide multi-frame Instagram & LinkedIn Carousel, 1x PDF slide deck",
    formatSpec: "1080x1350px (5 slides 4:5 aspect ratio)",
    approver: "Brand Owner / Lead Designer",
    notes: "Main engagement driver for Week 1"
  },
  {
    id: "brief-sc-w1-d3",
    brandId: "standout-clothing",
    title: "Favourite Meal Challenge Carousel",
    weekNumber: 1,
    dayOfWeek: "Wednesday",
    date: "2026-09-03",
    platform: "Instagram, Facebook, TikTok, LinkedIn, Twitter",
    platforms: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter/X"],
    mainFocus: "Engagement",
    topicIdea: "Favourite meal challenge",
    contentPillar: "Entertainment",
    postType: "Carousel",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "Interactive quiz-style carousel with side-by-side meal prep comparison photos and playful polls.",
    visualCopyDetail: "Engagement Prompt:\n'What's one small healthy meal swap that changed your week?'\n'Do you agree that prep is 80% of the game?'\n'DM us 'POWER' like it or drop your pick in the comments!'",
    copywritingCaption: "Food is fuel, but it should never be boring. What is your go-to meal that keeps your energy peaked without the afternoon crash? Drop your favourite dish below and let's see who has the cleanest prep in the community.",
    hashtags: "#MealPrepChallenge #FuelYourBody #CleanEatingTips #StreetAthlete #FoodForFocus",
    objective: "Ignite community banter and organic comment volume with an approachable interactive debate.",
    targetAudience: "Lifestyle and fitness community looking for easy nutrition inspiration.",
    keyMessage: "Healthy nutrition is flavorful, practical, and sustainable.",
    deliverables: "4-slide interactive Carousel with comment sticker overlays",
    formatSpec: "1080x1350px Carousel",
    approver: "Brand Owner",
    notes: "Mid-week engagement booster"
  },
  {
    id: "brief-sc-w1-d4",
    brandId: "standout-clothing",
    title: "Founder Journey & Community Story Time",
    weekNumber: 1,
    dayOfWeek: "Thursday",
    date: "2026-09-04",
    platform: "Instagram, Facebook, TikTok, LinkedIn, Twitter",
    platforms: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter/X"],
    mainFocus: "Link Click",
    topicIdea: "Story Time",
    contentPillar: "Story Time",
    postType: "Video",
    status: "Proposed",
    progressTracking: "Edit",
    visualReference: "Candid vertical 9:16 footage: Behind the scenes in the workshop giving tips on how to prepare garments and mindset for performance.",
    visualCopyDetail: "Video Concept:\nGiving a tip on how to prepare for high-intensity work weeks.\nAuthentic voiceover talking through early mistakes and lessons.\nOverlay text: 'The hardest lesson we learned in Year 1...'",
    copywritingCaption: "Every breakthrough starts with a messy beginning. When we started, we thought speed was everything. Turns out, endurance and consistency beat fast hacks every single time. Here is what we learned along the way.",
    hashtags: "#FounderStory #BehindTheBrand #AuthenticJourney #StreetwearOrigins #StoryTime",
    objective: "Build deep emotional connection and drive click-throughs to the brand manifesto.",
    targetAudience: "Entrepreneurs, creators, and loyal community supporters.",
    keyMessage: "Authenticity and patience build enduring brand equity.",
    deliverables: "1x 45-second vertical 9:16 Reel / TikTok video + subtitles",
    formatSpec: "1080x1920px 9:16 Video (MP4/H.264)",
    approver: "Brand Owner / Video Editor",
    notes: "Video production currently in final editing"
  },
  {
    id: "brief-sc-w1-d5",
    brandId: "standout-clothing",
    title: "Workout Tutorial & Form Challenge",
    weekNumber: 1,
    dayOfWeek: "Friday",
    date: "2026-09-05",
    platform: "Instagram, Facebook, TikTok, LinkedIn, Twitter",
    platforms: ["Instagram", "Facebook", "TikTok", "LinkedIn", "Twitter/X"],
    mainFocus: "Engagement",
    topicIdea: "Workout Challenge",
    contentPillar: "Workout",
    postType: "Video",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "High-energy training clip of athlete/trainer demonstrating proper form on a signature compound movement wearing new capsule gear.",
    visualCopyDetail: "Video Breakdown:\nVideo of trainer demonstrating tutorial on a specific functional workout.\nStep 1: Joint prep & posture lock.\nStep 2: Smooth eccentric control.\nStep 3: Explosive drive.",
    copywritingCaption: "Friday finisher! Try this 3-move circuit before the weekend kicks off. Save this for your next gym session and tag us when you crush it! Group 2 spaces are now open—DM 'POWER' to claim yours.",
    hashtags: "#WorkoutChallenge #FridayFinisher #FormFirst #FunctionalStrength #StandoutFitness",
    objective: "Drive video shares, bookmarks, and weekend fitness engagement.",
    targetAudience: "Gymgoers, athletes, and fitness enthusiasts.",
    keyMessage: "Form precedes intensity. Master the basics to unlock true power.",
    deliverables: "1x 60-second high-energy Tutorial Reel + Caption Breakdown",
    formatSpec: "1080x1920px 9:16 Video",
    approver: "Brand Owner / Fitness Coach",
    notes: "Weekend workout challenge clip"
  },

  // ================= NKABOMWORLDD BRIEFS =================
  {
    id: "brief-nw-w1-d1",
    brandId: "nkabomworldd",
    title: "Unity In The Thread: Heritage Knit Teaser",
    weekNumber: 1,
    dayOfWeek: "Monday",
    date: "2026-09-01",
    platform: "Instagram, TikTok, Twitter",
    platforms: ["Instagram", "TikTok", "Twitter/X"],
    mainFocus: "Reach",
    topicIdea: "Unity is in the stitch",
    contentPillar: "Culture",
    postType: "Artwork",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "Macro texture photo of heavy organic cotton interlocking knit in earthy tones.",
    visualCopyDetail: "Visual Concept: Intricate close-up of the iconic unity arms emblem stitched into 450GSM cotton fleece.",
    copywritingCaption: "Nkabom stands for unity. Every thread is woven with intent. Dropping our limited capsule this Friday. Link in bio for early access.",
    hashtags: "#NkabomWorld #UnityInFashion #AfrocentricStreetwear #ContemporaryHeritage",
    objective: "Announce new capsule drop date and drive email VIP signups.",
    targetAudience: "Global cultural diaspora, streetwear tastemakers (18-32)",
    keyMessage: "Authentic unity woven into modern urban silhouettes.",
    deliverables: "3x 4:5 editorial photos, 1x story teaser countdown",
    formatSpec: "1080x1350px",
    approver: "Creative Director"
  },
  {
    id: "brief-nw-w1-d2",
    brandId: "nkabomworldd",
    title: "Behind The Craft: Artisan Weaving Story",
    weekNumber: 1,
    dayOfWeek: "Wednesday",
    date: "2026-09-03",
    platform: "Instagram, YouTube, TikTok",
    platforms: ["Instagram", "YouTube", "TikTok"],
    mainFocus: "Engagement",
    topicIdea: "How we source and craft our textiles",
    contentPillar: "Story Time",
    postType: "Video",
    status: "Approved",
    progressTracking: "Film",
    visualReference: "Documentary-style studio footage showcasing the master weavers and pattern cutters.",
    visualCopyDetail: "Docu-Short:\nScene 1: Loom setup\nScene 2: Precision hand-finishing\nScene 3: Final garment on model.",
    copywritingCaption: "Fast fashion cuts corners. We take our time. From sustainable cotton sourcing to hand-finished seams, here is how each Nkabom piece comes alive.",
    hashtags: "#SlowFashion #ArtisanTextiles #SustainableStreetwear #CraftsmanshipMatters",
    objective: "Highlight luxury craftsmanship and justify premium price tier.",
    targetAudience: "Conscious fashion consumers and design aficionados.",
    keyMessage: "Crafted with reverence, built to last a lifetime.",
    deliverables: "1x 90-sec documentary short + 3x 15-sec vertical cuts",
    formatSpec: "4K 9:16 & 16:9 Master",
    approver: "Brand Owner"
  },

  // ================= VIVIDEL INC. BRIEFS =================
  {
    id: "brief-vi-w1-d1",
    brandId: "vividel-inc",
    title: "Cinematic Commercial Lighting Breakdown",
    weekNumber: 1,
    dayOfWeek: "Tuesday",
    date: "2026-09-02",
    platform: "LinkedIn, Instagram, YouTube",
    platforms: ["LinkedIn", "Instagram", "YouTube"],
    mainFocus: "Reach",
    topicIdea: "3-point lighting for high-ticket DTC commercials",
    contentPillar: "Tips",
    postType: "Carousel",
    status: "Proposed",
    progressTracking: "Create",
    visualReference: "Schematic floorplan breakdown paired with final graded film frames.",
    visualCopyDetail: "Slide 1: Final movie frame\nSlide 2: Key light placement (Aputure 600d + 5ft Octa)\nSlide 3: Hair/rim backlight angle\nSlide 4: Atmosphere haze & grading LUT.",
    copywritingCaption: "How we made a $50k product spot look like a $500k feature film. Lighting is 90% mood, 10% brightness. Here is the full diagram.",
    hashtags: "#CinematographyTips #CommercialProduction #DTCAdvertising #VividelStudios",
    objective: "Position Vividel as the leading studio for commercial film production.",
    targetAudience: "DTC Founders, Creative Directors, CMOs",
    keyMessage: "World-class lighting and cinematography elevate perceived product value by 10x.",
    deliverables: "5-slide LinkedIn PDF Deck + Instagram Carousel",
    formatSpec: "1080x1350px",
    approver: "Head of Production"
  },

  // ================= ACME CORP BRIEFS =================
  {
    id: "b-1",
    brandId: "acme-corp",
    title: "Serverless Benefits Q3 Social Pack",
    weekNumber: 1,
    dayOfWeek: "Monday",
    date: "2026-09-01",
    platform: "LinkedIn, Twitter",
    platforms: ["LinkedIn", "Twitter/X"],
    mainFocus: "Reach",
    topicIdea: "Why Serverless Pipelines Cut Cloud Spend by 90%",
    contentPillar: "Marketing",
    postType: "Carousel",
    objective: "Establish Acme as the ultimate cloud orchestrator for lean startups and modern dev teams.",
    targetAudience: "Senior Developers, CTOs, Tech Leads",
    keyMessage: "Acme cuts down pipeline idle spend by 90% while improving scaling agility.",
    deliverables: "3x Carousel graphic templates, 2x video scripts, 1x cheat sheet PDF",
    status: "Proposed",
    progressTracking: "Create",
    copywritingCaption: "Why pay for servers when they are sitting idle at 3 AM? Serverless event architecture scales to zero automatically. Read our architectural whitepaper.",
    hashtags: "#Serverless #CloudArchitecture #DevOps #SaaSScale",
    approver: "VP of Marketing"
  },
  {
    id: "b-2",
    brandId: "global-ind",
    title: "Decarbonization Impact Deck",
    weekNumber: 1,
    dayOfWeek: "Thursday",
    date: "2026-09-04",
    platform: "LinkedIn",
    platforms: ["LinkedIn"],
    mainFocus: "Link Click",
    topicIdea: "Scope-2 Net Neutrality Audited Milestones",
    contentPillar: "Tips",
    postType: "Artwork",
    objective: "Attract sustainable ESG investment portfolios by demonstrating our clear, audited carbon offset pipeline.",
    targetAudience: "Institutional Investors, Green Board Members",
    keyMessage: "Global Industries is tracking 2 years ahead of its Scope-2 net-neutrality targets.",
    deliverables: "18-slide Keynote/PDF deck, interactive carbon calculator embed",
    status: "Approved",
    progressTracking: "Done",
    copywritingCaption: "We are proud to share our audited 2026 carbon footprint reduction matrix. Transparency drives long-term shareholder trust.",
    hashtags: "#ESG #CleanEnergy #LogisticsInnovation",
    approver: "Board Committee"
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

      // Seed Creative Ideas
      for (const idea of FALLBACK_IDEAS) {
        await setDoc(doc(db, "creativeIdeas", idea.id), idea);
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
      list.push({ ...doc.data(), id: doc.id } as Brand);
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
      list.push({ ...doc.data(), id: doc.id } as CampaignQueue);
    });
    onUpdate(list);
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
      list.push({ ...doc.data(), id: doc.id } as CalendarEvent);
    });
    onUpdate(list);
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
      list.push({ ...doc.data(), id: doc.id } as CreativeBrief);
    });
    onUpdate(list);
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
      list.push({ ...doc.data(), id: doc.id } as AnalyticsMetric);
    });
    onUpdate(list);
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
      list.push({ ...doc.data(), id: doc.id } as StrategicInsight);
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
      list.push({ ...doc.data(), id: doc.id } as BrandDirection);
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
      list.push({ ...doc.data(), id: doc.id } as RawAnalyticsRow);
    });
    onUpdate(list);
  }, (err) => {
    console.warn("Error subscribing to raw analytics:", err);
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
    console.warn("Error subscribing to creative ideas, using fallbacks:", err);
    onUpdate(FALLBACK_IDEAS.filter(i => i.brandId === brandId));
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
  try {
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
  } catch (error) {
    console.error("Error creating/fetching calendar share link:", error);
    // Return a safe local instance in case of offline/fallback mode
    return {
      id: "local-" + Date.now(),
      token: generateSecureCalendarToken(),
      brandId,
      brandName: brandName || brandId,
      periodType,
      month,
      year,
      weekNumber,
      periodLabel: periodLabel || `${month + 1}/${year}`,
      createdAt: new Date().toISOString(),
      revoked: false,
      emailSentCount: 0
    };
  }
};

export const fetchCalendarShareLinkByToken = async (
  token: string
): Promise<CalendarShareLink | null> => {
  try {
    const shareLinksRef = collection(db, "calendarShareLinks");
    const q = query(shareLinksRef, where("token", "==", token));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data() as Omit<CalendarShareLink, "id">;
    return { id: docSnap.id, ...data };
  } catch (error) {
    console.error("Error fetching calendar share link by token:", error);
    return null;
  }
};

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
  if (currentLinkId && !currentLinkId.startsWith("local-")) {
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
  if (!linkId || linkId.startsWith("local-")) return;
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
  if (!linkId || linkId.startsWith("local-")) return;
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
  if (!linkId || linkId.startsWith("local-")) return;
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


