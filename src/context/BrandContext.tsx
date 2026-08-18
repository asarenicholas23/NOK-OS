import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Brand, 
  CampaignQueue, 
  CalendarEvent, 
  CreativeBrief, 
  AnalyticsMetric,
  StrategicInsight,
  RawAnalyticsRow,
  BrandDirection,
  CreativeIdea,
  Lead,
  cleanFirestoreData,
  subscribeToBrands,
  subscribeToCampaignQueues,
  subscribeToCalendarEvents,
  subscribeToBriefs,
  subscribeToMetrics,
  subscribeToInsights,
  subscribeToRawAnalytics,
  subscribeToDirections,
  subscribeToIdeas,
  subscribeToLeads,
  seedDatabaseIfEmpty,
  auth,
  signInWithGoogleGmail,
  signInWithGoogleCalendar
} from "../lib/firebase";

export type { Brand };
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface BrandContextType {
  brands: Brand[];
  activeBrand: Brand | null;
  activeBrandId: string;
  setActiveBrandId: (id: string) => void;
  queues: CampaignQueue[];
  calendarEvents: CalendarEvent[];
  briefs: CreativeBrief[];
  metrics: AnalyticsMetric[];
  loading: boolean;
  user: any;
  logout: () => Promise<void>;
  addCampaign: (campaign: Omit<CampaignQueue, "id" | "brandId">) => Promise<void>;
  updateCampaign: (id: string, campaign: Partial<CampaignQueue>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, "id" | "brandId">) => Promise<void>;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  addCreativeBrief: (brief: Omit<CreativeBrief, "id" | "brandId">) => Promise<void>;
  updateCreativeBrief: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  deleteCreativeBrief: (id: string) => Promise<void>;
  bulkApproveBriefs: (ids: string[]) => Promise<void>;
  addBrand: (brand: Omit<Brand, "id">) => Promise<void>;
  updateBrand: (id: string, brand: Partial<Brand>) => Promise<void>;
  deleteBrand: (id: string) => Promise<void>;
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
  notifications: AppNotification[];
  addNotification: (title: string, message: string, type?: "info" | "success" | "warning") => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  accentColor: "violet" | "emerald" | "amber" | "rose";
  setAccentColor: (color: "violet" | "emerald" | "amber" | "rose") => void;
  insights: StrategicInsight[];
  rawAnalytics: RawAnalyticsRow[];
  directions: BrandDirection[];
  ideas: CreativeIdea[];
  leads: Lead[];
  addInsight: (insight: Omit<StrategicInsight, "id" | "brandId">) => Promise<void>;
  updateInsight: (id: string, insight: Partial<StrategicInsight>) => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;
  addCreativeIdea: (idea: Omit<CreativeIdea, "id" | "brandId">) => Promise<void>;
  updateCreativeIdea: (id: string, idea: Partial<CreativeIdea>) => Promise<void>;
  deleteCreativeIdea: (id: string) => Promise<void>;
  bulkApproveInsights: (ids: string[]) => Promise<void>;
  bulkDeleteInsights: (ids: string[]) => Promise<void>;
  saveRawAnalyticsRows: (rows: Omit<RawAnalyticsRow, "id" | "brandId">[], datasetType?: "baseline" | "comparison") => Promise<void>;
  clearRawAnalytics: (datasetType?: "baseline" | "comparison" | "all") => Promise<void>;
  addDirection: (direction: Omit<BrandDirection, "id" | "brandId">) => Promise<void>;
  updateDirection: (id: string, direction: Partial<BrandDirection>) => Promise<void>;
  deleteDirection: (id: string) => Promise<void>;
  bulkApproveDirections: (ids: string[]) => Promise<void>;
  bulkDeleteDirections: (ids: string[]) => Promise<void>;
  gmailToken: string | null;
  gmailUser: any | null;
  connectGmail: () => Promise<void>;
  disconnectGmail: () => void;
  googleCalendarToken: string | null;
  googleCalendarUser: any | null;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  resetBrandData: (brandId: string) => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>(() => {
    return localStorage.getItem("nok-os-active-brand-id") || "acme-corp";
  });
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  
  const [queues, setQueues] = useState<CampaignQueue[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [briefs, setBriefs] = useState<CreativeBrief[]>([]);
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [rawAnalytics, setRawAnalytics] = useState<RawAnalyticsRow[]>([]);
  const [directions, setDirections] = useState<BrandDirection[]>([]);
  const [ideas, setIdeas] = useState<CreativeIdea[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [gmailToken, setGmailToken] = useState<string | null>(null);
  const [gmailUser, setGmailUser] = useState<any | null>(null);
  const [googleCalendarToken, setGoogleCalendarToken] = useState<string | null>(null);
  const [googleCalendarUser, setGoogleCalendarUser] = useState<any | null>(null);

  // NEW STATES: N.O.K Os Theme, Notifications & Accent Color
  const [theme, setThemeState] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("nok-os-theme") as "dark" | "light") || "dark";
  });
  const [accentColor, setAccentColorState] = useState<"violet" | "emerald" | "amber" | "rose">(() => {
    return (localStorage.getItem("nok-os-accent") as "violet" | "emerald" | "amber" | "rose") || "violet";
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("nok-os-notifications");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: "notif-1",
        title: "N.O.K Os Core System Online",
        message: "System initialized with dual light/dark mode and workspace analytics synchronization.",
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: "success"
      },
      {
        id: "notif-2",
        title: "Brand Database Connected",
        message: "Successfully synchronized brand data with Firestore database partitions.",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: "info"
      }
    ];
  });

  // Sync theme class with HTML element on initial mount and theme changes
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("nok-os-theme", newTheme);
  };

  const setAccentColor = (newAccent: "violet" | "emerald" | "amber" | "rose") => {
    setAccentColorState(newAccent);
    localStorage.setItem("nok-os-accent", newAccent);
  };

  const addNotification = (title: string, message: string, type: "info" | "success" | "warning" = "info") => {
    const uniqueId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNotif: AppNotification = {
      id: uniqueId,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem("nok-os-notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem("nok-os-notifications", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem("nok-os-notifications", JSON.stringify([]));
  };

  // Listen to Auth State changes & Seed Database
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await seedDatabaseIfEmpty();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setGmailToken(null);
      setGmailUser(null);
      setGoogleCalendarToken(null);
      setGoogleCalendarUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      const result = await signInWithGoogleGmail();
      if (result) {
        setGmailToken(result.accessToken);
        setGmailUser(result.user);
        addNotification(
          "Gmail Connected",
          `Successfully authenticated Gmail account: ${result.user.email || ""}`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Connect Gmail failed:", err);
      const isPopupError = err?.code === "auth/popup-closed-by-user" || 
                           err?.message?.includes("popup-closed-by-user") ||
                           err?.message?.includes("popup-closed") ||
                           err?.message?.includes("cancelled-by-user");
      
      const friendlyMessage = isPopupError
        ? "Google authentication popup was closed or blocked. Because browser security restricts login popups inside preview iframes, please click the 'Open in New Tab' icon in the upper-right corner of the preview pane and try again from there."
        : (err.message || "Failed to authorize Gmail send permission.");

      addNotification(
        "Gmail Connection Failed",
        friendlyMessage,
        "warning"
      );
    }
  };

  const disconnectGmail = () => {
    setGmailToken(null);
    setGmailUser(null);
    addNotification("Gmail Disconnected", "Your Gmail integration has been disconnected.", "info");
  };

  const connectGoogleCalendar = async () => {
    try {
      const result = await signInWithGoogleCalendar();
      if (result) {
        setGoogleCalendarToken(result.accessToken);
        setGoogleCalendarUser(result.user);
        addNotification(
          "Calendar Connected",
          `Successfully authenticated Google Calendar: ${result.user.email || ""}`,
          "success"
        );
      }
    } catch (err: any) {
      console.error("Connect Google Calendar failed:", err);
      const isPopupError = err?.code === "auth/popup-closed-by-user" || 
                           err?.message?.includes("popup-closed-by-user") ||
                           err?.message?.includes("popup-closed") ||
                           err?.message?.includes("cancelled-by-user");
      
      const friendlyMessage = isPopupError
        ? "Google authentication popup was closed or blocked. Because browser security restricts login popups inside preview iframes, please click the 'Open in New Tab' icon in the upper-right corner of the preview pane and try again from there."
        : (err.message || "Failed to authorize Google Calendar permissions.");

      addNotification(
        "Calendar Connection Failed",
        friendlyMessage,
        "warning"
      );
    }
  };

  const disconnectGoogleCalendar = () => {
    setGoogleCalendarToken(null);
    setGoogleCalendarUser(null);
    addNotification("Calendar Disconnected", "Your Google Calendar integration has been disconnected.", "info");
  };

  // Listen to Brands (Live)
  useEffect(() => {
    const unsubscribe = subscribeToBrands((updatedBrands) => {
      setBrands(updatedBrands);
      // If activeBrandId is not in updatedBrands, default to first or stay
      if (updatedBrands.length > 0 && !updatedBrands.find(b => b.id === activeBrandId)) {
        setActiveBrandId(updatedBrands[0].id);
      }
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Sync Active Brand Object
  useEffect(() => {
    const b = brands.find(b => b.id === activeBrandId);
    if (b) {
      setActiveBrand(b);
    } else if (brands.length > 0) {
      setActiveBrand(brands[0]);
      setActiveBrandId(brands[0].id);
    }
  }, [brands, activeBrandId]);

  // Persist activeBrandId changes to localStorage
  useEffect(() => {
    if (activeBrandId) {
      localStorage.setItem("nok-os-active-brand-id", activeBrandId);
    }
  }, [activeBrandId]);

  // Listen to Campaign Queues for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToCampaignQueues(activeBrandId, (updatedQueues) => {
      setQueues(updatedQueues);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Calendar Events for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToCalendarEvents(activeBrandId, (updatedEvents) => {
      setCalendarEvents(updatedEvents);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Briefs for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToBriefs(activeBrandId, (updatedBriefs) => {
      setBriefs(updatedBriefs);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Metrics for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToMetrics(activeBrandId, (updatedMetrics) => {
      setMetrics(updatedMetrics);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Strategic Insights for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToInsights(activeBrandId, (updated) => {
      setInsights(updated);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Raw Analytics Rows for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToRawAnalytics(activeBrandId, (updated) => {
      setRawAnalytics(updated);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Auto-correct "LinkedIn" platform to "Instagram" for Peculiar Foods uploaded data
  useEffect(() => {
    if (!activeBrand || !rawAnalytics || rawAnalytics.length === 0) return;
    
    const isPeculiarFoods = activeBrand.name.toLowerCase().includes("peculiar");
    if (!isPeculiarFoods) return;

    const incorrectRows = rawAnalytics.filter(row => row.platform === "LinkedIn" && !row.id.startsWith("raw-"));
    if (incorrectRows.length === 0) return;

    const correctRows = async () => {
      try {
        const { db } = await import("../lib/firebase");
        const { doc, writeBatch } = await import("firebase/firestore");
        const batch = writeBatch(db);
        incorrectRows.forEach(row => {
          batch.update(doc(db, "rawAnalytics", row.id), { platform: "Instagram" });
        });
        await batch.commit();
        addNotification(
          "Platform Alignment",
          `Automatically aligned ${incorrectRows.length} Peculiar Foods records from LinkedIn to Instagram.`,
          "success"
        );
      } catch (err) {
        console.error("Failed to correct Peculiar Foods records:", err);
      }
    };

    correctRows();
  }, [activeBrand, rawAnalytics]);

  // Listen to Brand Positioning Directions for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToDirections(activeBrandId, (updated) => {
      setDirections(updated);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Creative Ideas (sandbox) for active Brand
  useEffect(() => {
    if (!activeBrandId) return;
    const unsubscribe = subscribeToIdeas(activeBrandId, (updated) => {
      setIdeas(updated);
    });
    return () => unsubscribe();
  }, [activeBrandId]);

  // Listen to Leads captured from the public /resources page. Not brand-scoped
  // (agency-wide), so this is gated on staff auth rather than activeBrandId.
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToLeads((updated) => {
      setLeads(updated);
    });
    return () => unsubscribe();
  }, [user]);

  // Firestore Add helpers
  const addCampaign = async (campaign: Omit<CampaignQueue, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "campaignQueues"), cleanFirestoreData({
      ...campaign,
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    }));
    addNotification("Campaign Scheduled", `New post "${campaign.title}" has been successfully added to the pipeline.`, "success");
  };

  const updateCampaign = async (id: string, campaign: Partial<CampaignQueue>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "campaignQueues", id), cleanFirestoreData(campaign), { merge: true });
    addNotification("Campaign Updated", "Campaign queue document was successfully modified.", "info");
  };

  const deleteCampaign = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "campaignQueues", id));
    addNotification("Campaign Removed", "Campaign queue item was deleted from workspace partitions.", "warning");
  };

  const addCalendarEvent = async (event: Omit<CalendarEvent, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "calendarEvents"), cleanFirestoreData({
      ...event,
      brandId: activeBrandId
    }));
    addNotification("Roadmap Event Created", `"${event.title}" is now added to the content roadmap.`, "info");
  };

  const updateCalendarEvent = async (id: string, event: Partial<CalendarEvent>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "calendarEvents", id), cleanFirestoreData(event), { merge: true });
    addNotification("Event Updated", "Content roadmap event details were modified.", "info");
  };

  const deleteCalendarEvent = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "calendarEvents", id));
    addNotification("Event Removed", "Content calendar event was deleted from workspace partitions.", "warning");
  };

  const addCreativeBrief = async (brief: Omit<CreativeBrief, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "briefs"), cleanFirestoreData({
      ...brief,
      brandId: activeBrandId
    }));
    addNotification("Creative Brief Logged", `Brief for "${brief.title}" successfully saved.`, "info");
  };

  const updateCreativeBrief = async (id: string, brief: Partial<CreativeBrief>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc, collection, addDoc } = await import("firebase/firestore");
    
    // Check if brief document exists or if we should merge with existing brief in local state
    const existingBrief = briefs.find(b => b.id === id);
    const mergedBriefPayload = {
      ...(existingBrief || {}),
      ...brief,
      id,
      brandId: existingBrief?.brandId || activeBrandId
    };
    
    await setDoc(doc(db, "briefs", id), cleanFirestoreData(mergedBriefPayload), { merge: true });
    
    // If status is changed to Approved, ensure it is available in Posting Queue
    if (brief.status === "Approved") {
      const briefTitle = brief.title || existingBrief?.title || "Approved Campaign";
      const briefChannel = (brief.platform?.split(",")[0]?.trim() || existingBrief?.platform?.split(",")[0]?.trim() || "Instagram") as CampaignQueue["channel"];
      const briefContent = brief.copywritingCaption || existingBrief?.copywritingCaption || brief.keyMessage || existingBrief?.keyMessage || briefTitle;
      const briefDate = brief.date || existingBrief?.date || new Date().toISOString().split("T")[0];
      
      // Check if already in queue
      const inQueue = queues.some(q => q.title.toLowerCase() === briefTitle.toLowerCase());
      if (!inQueue) {
        await addDoc(collection(db, "campaignQueues"), cleanFirestoreData({
          brandId: activeBrandId,
          title: briefTitle,
          channel: briefChannel,
          status: "scheduled",
          scheduledTime: `${briefDate} 10:00 AM`,
          content: briefContent,
          metrics: {
            estimatedReach: 35000,
            engagementRate: 5.2
          },
          createdAt: new Date().toISOString()
        }));
      }
      addNotification("Brief Approved", `"${briefTitle}" is approved and queued in the Posting Queue.`, "success");
    } else if (brief.status === "Changes Requested") {
      addNotification("Changes Requested", "Feedback and revision notes logged for designer review.", "warning");
    } else {
      addNotification("Brief Updated", "Creative brief attributes modified successfully.", "info");
    }
  };

  const bulkApproveBriefs = async (ids: string[]) => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch, collection, addDoc } = await import("firebase/firestore");
    
    // Only approve briefs that are currently in "Proposed" state (never override Changes Requested silently)
    const proposedBriefsToApprove = briefs.filter(b => ids.includes(b.id) && b.status === "Proposed");
    
    if (proposedBriefsToApprove.length === 0) {
      addNotification("No Proposed Items", "Selected days have already been approved or have pending changes requested.", "info");
      return;
    }

    const batch = writeBatch(db);
    for (const b of proposedBriefsToApprove) {
      batch.update(doc(db, "briefs", b.id), { status: "Approved" });
      
      // Auto-sync into Posting Queue
      const briefTitle = b.title;
      const inQueue = queues.some(q => q.title.toLowerCase() === briefTitle.toLowerCase());
      if (!inQueue) {
        const briefChannel = (b.platform?.split(",")[0]?.trim() || "Instagram") as CampaignQueue["channel"];
        const briefContent = b.copywritingCaption || b.keyMessage || b.title;
        const briefDate = b.date || new Date().toISOString().split("T")[0];
        
        await addDoc(collection(db, "campaignQueues"), {
          brandId: activeBrandId,
          title: briefTitle,
          channel: briefChannel,
          status: "scheduled",
          scheduledTime: `${briefDate} 10:00 AM`,
          content: briefContent,
          metrics: {
            estimatedReach: 40000,
            engagementRate: 5.5
          },
          createdAt: new Date().toISOString()
        });
      }
    }
    
    await batch.commit();
    addNotification(
      "Week Approved", 
      `Approved ${proposedBriefsToApprove.length} proposed briefs. These are now live in the Posting Queue.`, 
      "success"
    );
  };

  const deleteCreativeBrief = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "briefs", id));
    addNotification("Brief Deleted", "Creative brief was removed from brand records.", "warning");
  };

  const addBrand = async (brand: Omit<Brand, "id">) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const newId = brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await setDoc(doc(db, "brands", newId), cleanFirestoreData({
      ...brand,
      id: newId,
      createdAt: new Date().toISOString()
    }));
    setActiveBrandId(newId);
    addNotification("New Brand Provisioned", `Brand workspace for "${brand.name}" is now online!`, "success");
  };

  const updateBrand = async (id: string, brand: Partial<Brand>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "brands", id), cleanFirestoreData(brand), { merge: true });
    
    // update activeBrand local state if it is active brand
    if (activeBrandId === id && activeBrand) {
      setActiveBrand({
        ...activeBrand,
        ...brand
      });
    }
    // and update local brands array if present to ensure sync across elements
    setBrands(prev => prev.map(b => b.id === id ? { ...b, ...brand } : b));
    addNotification("Brand Guide Updated", "The style and guidelines have been saved successfully.", "success");
  };

  const deleteBrand = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "brands", id));
    
    if (activeBrandId === id) {
      const remaining = brands.filter(b => b.id !== id);
      if (remaining.length > 0) {
        setActiveBrandId(remaining[0].id);
        setActiveBrand(remaining[0]);
      } else {
        setActiveBrandId("");
        setActiveBrand(null);
      }
    }
    setBrands(prev => prev.filter(b => b.id !== id));
    addNotification("Brand Workspace Deleted", "The brand configuration has been permanently removed.", "warning");
  };

  const addCreativeIdea = async (idea: Omit<CreativeIdea, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "creativeIdeas"), cleanFirestoreData({
      ...idea,
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    }));
    addNotification("Idea Saved", `"${idea.title}" saved to your Creative Sandbox.`, "success");
  };

  const updateCreativeIdea = async (id: string, idea: Partial<CreativeIdea>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "creativeIdeas", id), cleanFirestoreData(idea), { merge: true });
    addNotification("Idea Updated", "Creative Sandbox item modified.", "info");
  };

  const deleteCreativeIdea = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "creativeIdeas", id));
    addNotification("Idea Deleted", "Idea removed from Creative Sandbox.", "warning");
  };

  const addInsight = async (insight: Omit<StrategicInsight, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "strategicInsights"), cleanFirestoreData({
      ...insight,
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    }));
    addNotification("Strategic Insight Logged", `Insight "${insight.title}" has been successfully added.`, "success");
  };

  const updateInsight = async (id: string, insight: Partial<StrategicInsight>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "strategicInsights", id), cleanFirestoreData(insight), { merge: true });
    addNotification("Insight Updated", "Strategic insight details were modified.", "info");
  };

  const deleteInsight = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "strategicInsights", id));
    addNotification("Insight Removed", "Strategic insight was deleted from brand records.", "warning");
  };

  const addDirection = async (direction: Omit<BrandDirection, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "brandDirections"), cleanFirestoreData({
      ...direction,
      status: direction.status || "Pending",
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    }));
    addNotification("Positioning Direction Logged", `Direction pillar "${direction.pillar}" has been successfully added.`, "success");
  };

  const updateDirection = async (id: string, direction: Partial<BrandDirection>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "brandDirections", id), cleanFirestoreData(direction), { merge: true });
    addNotification("Direction Updated", "Brand positioning direction details were modified.", "info");
  };

  const deleteDirection = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "brandDirections", id));
    addNotification("Direction Removed", "Brand positioning direction was deleted.", "warning");
  };

  const bulkApproveDirections = async (ids: string[]) => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.update(doc(db, "brandDirections", id), { status: "Approved" });
    });
    await batch.commit();
    addNotification("Directions Approved", `Successfully approved ${ids.length} positioning directions in bulk.`, "success");
  };

  const bulkDeleteDirections = async (ids: string[]) => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, "brandDirections", id));
    });
    await batch.commit();
    addNotification("Directions Removed", `Successfully deleted ${ids.length} directions in bulk.`, "warning");
  };

  const bulkApproveInsights = async (ids: string[]) => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.update(doc(db, "strategicInsights", id), { status: "Approved" });
    });
    await batch.commit();
    addNotification("Insights Approved", `Successfully approved ${ids.length} insights in bulk.`, "success");
  };

  const bulkDeleteInsights = async (ids: string[]) => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    ids.forEach(id => {
      batch.delete(doc(db, "strategicInsights", id));
    });
    await batch.commit();
    addNotification("Insights Removed", `Successfully deleted ${ids.length} insights in bulk.`, "warning");
  };

  const saveRawAnalyticsRows = async (rows: Omit<RawAnalyticsRow, "id" | "brandId">[], datasetType: "baseline" | "comparison" = "baseline") => {
    const { db } = await import("../lib/firebase");
    const { collection, writeBatch, doc } = await import("firebase/firestore");
    const batch = writeBatch(db);
    rows.forEach(row => {
      const newDocRef = doc(collection(db, "rawAnalytics"));
      batch.set(newDocRef, {
        ...row,
        datasetType,
        brandId: activeBrandId,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  };

  const clearRawAnalytics = async (datasetType: "baseline" | "comparison" | "all" = "all") => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    if (!rawAnalytics || rawAnalytics.length === 0) return;
    const batch = writeBatch(db);
    let count = 0;
    rawAnalytics.forEach(row => {
      const rowType = row.datasetType || "baseline";
      if (datasetType === "all" || rowType === datasetType) {
        batch.delete(doc(db, "rawAnalytics", row.id));
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
      addNotification("Data Cleared", `Successfully cleared ${count} ${datasetType} raw analytics records.`, "info");
    } else {
      addNotification("No Data Found", `No raw analytics records found for '${datasetType}' type.`, "info");
    }
  };

  const resetBrandData = async (brandId: string) => {
    const { db } = await import("../lib/firebase");
    const { collection, getDocs, query, where, writeBatch, doc } = await import("firebase/firestore");
    
    addNotification("Reset Initiating", `Clearing brand partitions...`, "info");
    
    const collectionsToClear = [
      "campaignQueues",
      "calendarEvents",
      "briefs",
      "strategicInsights",
      "brandDirections",
      "rawAnalytics",
      "metrics",
      "creativeIdeas"
    ];
    
    let totalCleared = 0;
    
    try {
      for (const colName of collectionsToClear) {
        const q = query(collection(db, colName), where("brandId", "==", brandId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.forEach(docSnap => {
            batch.delete(doc(db, colName, docSnap.id));
            totalCleared++;
          });
          await batch.commit();
        }
      }
      addNotification(
        "Workspace Reset Complete", 
        `Successfully cleared ${totalCleared} generated insights, events, campaigns, briefs, and analytics. Brand style guide has been kept.`, 
        "success"
      );
    } catch (err) {
      console.error("Error resetting brand data:", err);
      addNotification("Reset Failed", "Failed to clear all brand partitions.", "warning");
    }
  };

  // Auto-clear "tnyou fitness" brand once on mount/load if requested by user
  useEffect(() => {
    if (!brands || brands.length === 0) return;
    const tnyouBrand = brands.find(b => b.id.includes("tnyou") || b.name.toLowerCase().includes("tnyou"));
    if (tnyouBrand) {
      const hasAutoCleared = localStorage.getItem(`nok-os-autocleared-${tnyouBrand.id}`);
      if (!hasAutoCleared) {
        console.log(`Auto-clearing generated data for brand: ${tnyouBrand.name} (${tnyouBrand.id})`);
        resetBrandData(tnyouBrand.id).then(() => {
          localStorage.setItem(`nok-os-autocleared-${tnyouBrand.id}`, "true");
        });
      }
    }
  }, [brands]);

  return (
    <BrandContext.Provider value={{
      brands,
      activeBrand,
      activeBrandId,
      setActiveBrandId,
      queues,
      calendarEvents,
      briefs,
      metrics,
      loading,
      user,
      logout,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      addCreativeBrief,
      updateCreativeBrief,
      deleteCreativeBrief,
      bulkApproveBriefs,
      addBrand,
      updateBrand,
      deleteBrand,
      theme,
      setTheme,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      accentColor,
      setAccentColor,
      insights,
      rawAnalytics,
      directions,
      ideas,
      leads,
      addInsight,
      updateInsight,
      deleteInsight,
      addCreativeIdea,
      updateCreativeIdea,
      deleteCreativeIdea,
      bulkApproveInsights,
      bulkDeleteInsights,
      saveRawAnalyticsRows,
      clearRawAnalytics,
      addDirection,
      updateDirection,
      deleteDirection,
      bulkApproveDirections,
      bulkDeleteDirections,
      gmailToken,
      gmailUser,
      connectGmail,
      disconnectGmail,
      googleCalendarToken,
      googleCalendarUser,
      connectGoogleCalendar,
      disconnectGoogleCalendar,
      resetBrandData
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error("useBrand must be used within a BrandProvider");
  }
  return context;
};
