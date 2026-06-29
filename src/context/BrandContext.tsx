import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  Brand, 
  CampaignQueue, 
  CalendarEvent, 
  CreativeBrief, 
  AnalyticsMetric,
  StrategicInsight,
  RawAnalyticsRow,
  subscribeToBrands,
  subscribeToCampaignQueues,
  subscribeToCalendarEvents,
  subscribeToBriefs,
  subscribeToMetrics,
  subscribeToInsights,
  subscribeToRawAnalytics,
  seedDatabaseIfEmpty,
  ensureAuthenticated,
  auth
} from "../lib/firebase";
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
  loginFallbackUser: (email: string) => void;
  addCampaign: (campaign: Omit<CampaignQueue, "id" | "brandId">) => Promise<void>;
  updateCampaign: (id: string, campaign: Partial<CampaignQueue>) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, "id" | "brandId">) => Promise<void>;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  addCreativeBrief: (brief: Omit<CreativeBrief, "id" | "brandId">) => Promise<void>;
  updateCreativeBrief: (id: string, brief: Partial<CreativeBrief>) => Promise<void>;
  deleteCreativeBrief: (id: string) => Promise<void>;
  addBrand: (brand: Omit<Brand, "id">) => Promise<void>;
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
  addInsight: (insight: Omit<StrategicInsight, "id" | "brandId">) => Promise<void>;
  updateInsight: (id: string, insight: Partial<StrategicInsight>) => Promise<void>;
  deleteInsight: (id: string) => Promise<void>;
  bulkApproveInsights: (ids: string[]) => Promise<void>;
  bulkDeleteInsights: (ids: string[]) => Promise<void>;
  saveRawAnalyticsRows: (rows: Omit<RawAnalyticsRow, "id" | "brandId">[]) => Promise<void>;
  clearRawAnalytics: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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
        message: "Successfully synchronized brand telemetry with Firestore database partitions.",
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
    const newNotif: AppNotification = {
      id: "notif-" + Date.now(),
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
    // Check if there is a local fallback user first
    const localUserStr = localStorage.getItem("workspace_fallback_user");
    if (localUserStr) {
      try {
        const localUser = JSON.parse(localUserStr);
        setUser(localUser);
        seedDatabaseIfEmpty();
        setLoading(false);
        return;
      } catch (e) {
        console.error(e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await seedDatabaseIfEmpty();
      } else {
        const localUserStrCheck = localStorage.getItem("workspace_fallback_user");
        if (!localUserStrCheck) {
          setUser(null);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginFallbackUser = (email: string) => {
    const fallbackUser = { email, uid: "fallback-" + Date.now() };
    localStorage.setItem("workspace_fallback_user", JSON.stringify(fallbackUser));
    setUser(fallbackUser);
    seedDatabaseIfEmpty();
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem("workspace_fallback_user");
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setLoading(false);
    }
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

  // Firestore Add helpers
  const addCampaign = async (campaign: Omit<CampaignQueue, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "campaignQueues"), {
      ...campaign,
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    });
    addNotification("Campaign Scheduled", `New post "${campaign.title}" has been successfully added to the pipeline.`, "success");
  };

  const updateCampaign = async (id: string, campaign: Partial<CampaignQueue>) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "campaignQueues", id), campaign);
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
    await addDoc(collection(db, "calendarEvents"), {
      ...event,
      brandId: activeBrandId
    });
    addNotification("Roadmap Event Created", `"${event.title}" is now added to the content roadmap.`, "info");
  };

  const updateCalendarEvent = async (id: string, event: Partial<CalendarEvent>) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "calendarEvents", id), event);
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
    await addDoc(collection(db, "briefs"), {
      ...brief,
      brandId: activeBrandId
    });
    addNotification("Creative Brief Logged", `Brief for "${brief.title}" successfully saved.`, "info");
  };

  const updateCreativeBrief = async (id: string, brief: Partial<CreativeBrief>) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "briefs", id), brief);
    addNotification("Brief Approved", "Creative brief status has been updated successfully.", "success");
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
    await setDoc(doc(db, "brands", newId), {
      ...brand,
      id: newId,
      createdAt: new Date().toISOString()
    });
    setActiveBrandId(newId);
    addNotification("New Brand Provisioned", `Brand workspace for "${brand.name}" is now online!`, "success");
  };

  const addInsight = async (insight: Omit<StrategicInsight, "id" | "brandId">) => {
    const { db } = await import("../lib/firebase");
    const { collection, addDoc } = await import("firebase/firestore");
    await addDoc(collection(db, "strategicInsights"), {
      ...insight,
      brandId: activeBrandId,
      createdAt: new Date().toISOString()
    });
    addNotification("Strategic Insight Logged", `Insight "${insight.title}" has been successfully added.`, "success");
  };

  const updateInsight = async (id: string, insight: Partial<StrategicInsight>) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "strategicInsights", id), insight);
    addNotification("Insight Updated", "Strategic insight details were modified.", "info");
  };

  const deleteInsight = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "strategicInsights", id));
    addNotification("Insight Removed", "Strategic insight was deleted from brand records.", "warning");
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

  const saveRawAnalyticsRows = async (rows: Omit<RawAnalyticsRow, "id" | "brandId">[]) => {
    const { db } = await import("../lib/firebase");
    const { collection, writeBatch, doc } = await import("firebase/firestore");
    const batch = writeBatch(db);
    rows.forEach(row => {
      const newDocRef = doc(collection(db, "rawAnalytics"));
      batch.set(newDocRef, {
        ...row,
        brandId: activeBrandId,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  };

  const clearRawAnalytics = async () => {
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    if (!rawAnalytics || rawAnalytics.length === 0) return;
    const batch = writeBatch(db);
    rawAnalytics.forEach(row => {
      batch.delete(doc(db, "rawAnalytics", row.id));
    });
    await batch.commit();
    addNotification("Data Cleared", "Successfully cleared uploaded raw analytics data.", "info");
  };

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
      loginFallbackUser,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      addCreativeBrief,
      updateCreativeBrief,
      deleteCreativeBrief,
      addBrand,
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
      addInsight,
      updateInsight,
      deleteInsight,
      bulkApproveInsights,
      bulkDeleteInsights,
      saveRawAnalyticsRows,
      clearRawAnalytics
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
