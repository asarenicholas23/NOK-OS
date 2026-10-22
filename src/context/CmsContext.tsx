import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";
import {
  BlogPost,
  ServicePackage,
  AgencyInfo,
  DiscoveryRequest,
  ClientBrand,
  CallAvailability,
  INITIAL_CALL_AVAILABILITY,
  INITIAL_BLOG_POSTS,
  INITIAL_CLIENT_BRANDS
} from "../data/cmsData";
import { loadFirebase, whenIdle } from "../lib/loadFirebase";
import { brand, contact, home } from "../content/siteContent";
import { SERVICE_PACKAGES } from "../content/services";

// Contact details and service packages are set in code (src/content), not the
// CMS. They're exposed here under the same names so every screen that already
// reads them (proposals, booking form, Add Client, public pages) keeps working.
const AGENCY_INFO: AgencyInfo = {
  name: brand.name,
  locationCity: brand.descriptor,
  email: contact.email,
  whatsapp: contact.whatsapp,
  address: contact.address,
  heroTitle: [home.hero.titleBefore, home.hero.titleHighlight, home.hero.titleAfter].filter(Boolean).join(" "),
  heroSubtitle: home.hero.subtitle,
};

interface CmsContextType {
  agencyInfo: AgencyInfo;
  services: ServicePackage[];
  blogPosts: BlogPost[];
  /** True once the live blog posts have loaded (or failed to). Until then `blogPosts` may be the built-in fallback list. */
  blogPostsReady: boolean;
  discoveryRequests: DiscoveryRequest[];
  clientBrands: ClientBrand[];
  callAvailability: CallAvailability;
  updateCallAvailability: (availability: CallAvailability) => Promise<void>;
  addBlogPost: (post: Omit<BlogPost, "id">) => Promise<void>;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  addDiscoveryRequest: (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status" | "slotReleased">) => Promise<void>;
  addManualClient: (client: Pick<DiscoveryRequest, "name" | "email" | "businessName" | "serviceTier" | "notes" | "phone" | "status">) => Promise<DiscoveryRequest>;
  updateDiscoveryRequestStatus: (id: string, status: DiscoveryRequest["status"]) => Promise<void>;
  releaseDiscoverySlot: (id: string) => Promise<void>;
  deleteDiscoveryRequest: (id: string) => Promise<void>;
  addClientBrand: (brand: Omit<ClientBrand, "id">) => Promise<void>;
  updateClientBrand: (id: string, updated: Partial<ClientBrand>) => Promise<void>;
  deleteClientBrand: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  /** Connects to the live CMS data now (blog and admin pages call this on arrival). */
  requestLiveData: () => void;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

/**
 * While the build pre-renders pages (scripts/prerender.ts), it supplies the
 * live CMS data up front, and pages use it instead of connecting to Firestore.
 */
type CmsSnapshot = { blogPosts: BlogPost[]; clientBrands: ClientBrand[]; callAvailability: Partial<CallAvailability> | null };
const prerender = (): { snapshot?: CmsSnapshot; active: boolean } => {
  if (typeof window === "undefined") return { active: false };
  const w = window as unknown as { __PRERENDER__?: boolean; __CMS_SNAPSHOT__?: CmsSnapshot };
  return { active: !!w.__PRERENDER__, snapshot: w.__CMS_SNAPSHOT__ };
};

const LOCAL_STORAGE_BLOG_KEY = "nok_cms_blog_posts_v1";
const LOCAL_STORAGE_REQUESTS_KEY = "nok_cms_discovery_requests_v1";
const LOCAL_STORAGE_BRANDS_KEY = "nok_cms_client_brands_v2";

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const agencyInfo = AGENCY_INFO;
  const services: ServicePackage[] = SERVICE_PACKAGES;

  // blogPosts, discoveryRequests & clientBrands also live in Firestore so edits
  // (new posts, brand updates, inbound call bookings) sync across browsers/devices
  // instead of being stuck in whichever single browser made the change.
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const snap = prerender().snapshot;
    if (snap?.blogPosts.length) return snap.blogPosts;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BLOG_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BLOG_POSTS;
    } catch (e) {
      return INITIAL_BLOG_POSTS;
    }
  });

  // Inbound Discovery Call bookings are live lead data — never mock-seeded.
  // Starts empty and is populated purely by the Firestore subscription below
  // (staff sessions only), so deleting a call actually deletes it.
  const [discoveryRequests, setDiscoveryRequests] = useState<DiscoveryRequest[]>([]);

  const [clientBrands, setClientBrands] = useState<ClientBrand[]>(() => {
    const snap = prerender().snapshot;
    if (snap?.clientBrands.length) return snap.clientBrands;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BRANDS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_BRANDS;
    } catch (e) {
      return INITIAL_CLIENT_BRANDS;
    }
  });

  const [callAvailability, setCallAvailability] = useState<CallAvailability>(() => {
    const snap = prerender().snapshot;
    return snap?.callAvailability ? { ...INITIAL_CALL_AVAILABILITY, ...snap.callAvailability } : INITIAL_CALL_AVAILABILITY;
  });
  const [blogPostsReady, setBlogPostsReady] = useState(() => !!prerender().snapshot);

  const didMigrateCms = useRef(false);
  const [staffUser, setStaffUser] = useState<import("firebase/auth").User | null>(null);

  // Live CMS data comes from Firestore. The blog and admin need it straight
  // away; every other public page is pre-rendered and starts from the
  // built-in data above, so it connects only once the page is idle, keeping
  // the Firebase download off the critical path.
  const live = useRef<{ started: boolean; run: number; unsubs: (() => void)[] }>({ started: false, run: 0, unsubs: [] });

  const requestLiveData = useCallback(() => {
    const l = live.current;
    if (l.started || prerender().active) return; // pre-rendering uses the snapshot
    l.started = true;
    const run = l.run;
    (async () => {
      const fb = await loadFirebase();
      const { onAuthStateChanged } = await import("firebase/auth");
      if (run !== l.run) return; // unmounted (or remounted) while loading
      // Seeding Firestore requires a signed-in staff session (write rules deny
      // anonymous visitors), so only attempt it once auth has confirmed a real
      // user — never optimistically on page load.
      l.unsubs.push(
        onAuthStateChanged(fb.auth, (user) => {
          setStaffUser(user);
          if (user && !didMigrateCms.current) {
            didMigrateCms.current = true;
            fb.migrateCmsToFirestoreIfEmpty(blogPosts, clientBrands);
          }
        }),
      );
      l.unsubs.push(fb.subscribeToBlogPosts(setBlogPosts, () => setBlogPostsReady(true)));
      l.unsubs.push(fb.subscribeToClientBrands(setClientBrands));
      l.unsubs.push(fb.subscribeToCallAvailability(setCallAvailability));
    })().catch((err) => {
      console.warn("Couldn't load live CMS data:", err);
      setBlogPostsReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const l = live.current;
    const run = l.run;
    if (/^\/(blog|os|proposal|review|approve)(\/|$)/.test(window.location.pathname)) requestLiveData();
    else whenIdle(() => run === l.run && requestLiveData());
    // If Firestore never answers (offline), stop waiting and show what we have.
    const readyFallback = window.setTimeout(() => setBlogPostsReady(true), 8000);
    return () => {
      l.run += 1;
      l.unsubs.forEach((u) => u());
      l.unsubs = [];
      l.started = false;
      window.clearTimeout(readyFallback);
    };
  }, [requestLiveData]);

  // Discovery requests (inbound lead/CRM data) are admin-only reads — public
  // visitors can still submit new ones via addDiscoveryRequest, they just
  // never subscribe to the live list.
  useEffect(() => {
    if (!staffUser) return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    loadFirebase().then((fb) => {
      if (!cancelled) unsub = fb.subscribeToDiscoveryRequests(setDiscoveryRequests);
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [staffUser]);

  const addBlogPost = async (post: Omit<BlogPost, "id">) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const id = "blog-" + Date.now();
    await setDoc(doc(db, "blogPosts", id), cleanFirestoreData({ ...post, id, createdAt: new Date().toISOString() }));
  };

  const updateBlogPost = async (id: string, updated: Partial<BlogPost>) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "blogPosts", id), cleanFirestoreData(updated), { merge: true });
  };

  const deleteBlogPost = async (id: string) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "blogPosts", id));
  };

  const updateCallAvailability = async (availability: CallAvailability) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "cms", "callAvailability"), cleanFirestoreData(availability));
  };

  // The request and its slot reservation are written in one batch. If the slot
  // doc already exists (someone else just took that time), the rules reject the
  // whole batch, so a request can never be saved against a double-booked slot.
  // Errors are re-thrown so the booking modal can tell the visitor.
  const addDiscoveryRequest = async (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status" | "slotReleased">) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const id = "call-" + Date.now();
    const newReq: DiscoveryRequest = {
      ...req,
      id,
      createdAt: formattedDate,
      status: "New"
    };
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    batch.set(doc(db, "discoveryRequests", id), cleanFirestoreData(newReq));
    if (req.slotStart) {
      batch.set(doc(db, "discoverySlots", req.slotStart), { start: req.slotStart, requestId: id });
    }
    await batch.commit();
  };

  // A client staff add by hand (met offline, referred, etc.), with no booked call.
  const addManualClient = async (client: Pick<DiscoveryRequest, "name" | "email" | "businessName" | "serviceTier" | "notes" | "phone" | "status">) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newReq: DiscoveryRequest = {
      ...client,
      id: "client-" + Date.now(),
      source: "manual",
      createdAt: formattedDate
    };
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "discoveryRequests", newReq.id), cleanFirestoreData(newReq));
    return newReq;
  };

  const updateDiscoveryRequestStatus = async (id: string, status: DiscoveryRequest["status"]) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "discoveryRequests", id), { status });
  };

  // Frees the call time for other visitors while keeping the request (and the
  // time it was booked for) on record as a closed lead.
  const releaseDiscoverySlot = async (id: string) => {
    const req = discoveryRequests.find((r) => r.id === id);
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    if (req?.slotStart && !req.slotReleased) {
      batch.delete(doc(db, "discoverySlots", req.slotStart));
    }
    batch.update(doc(db, "discoveryRequests", id), { status: "Closed", slotReleased: true });
    await batch.commit();
  };

  const deleteDiscoveryRequest = async (id: string) => {
    const req = discoveryRequests.find((r) => r.id === id);
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    if (req?.slotStart && !req.slotReleased) {
      batch.delete(doc(db, "discoverySlots", req.slotStart));
    }
    batch.delete(doc(db, "discoveryRequests", id));
    await batch.commit();
  };

  const addClientBrand = async (brand: Omit<ClientBrand, "id">) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    const id = "brand-" + Date.now();
    await setDoc(doc(db, "clientBrands", id), cleanFirestoreData({ ...brand, id }));
  };

  const updateClientBrand = async (id: string, updated: Partial<ClientBrand>) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "clientBrands", id), cleanFirestoreData(updated), { merge: true });
  };

  const deleteClientBrand = async (id: string) => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "clientBrands", id));
  };

  const resetToDefaults = async () => {
    const { db, cleanFirestoreData } = await loadFirebase();
    const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
    await Promise.all(blogPosts.map((p) => deleteDoc(doc(db, "blogPosts", p.id))));
    await Promise.all(INITIAL_BLOG_POSTS.map((p, i) =>
      setDoc(doc(db, "blogPosts", p.id), cleanFirestoreData({ ...p, createdAt: new Date(Date.now() - i * 1000).toISOString() }))
    ));

    await Promise.all(clientBrands.map((b) => deleteDoc(doc(db, "clientBrands", b.id))));
    await Promise.all(INITIAL_CLIENT_BRANDS.map((b) => setDoc(doc(db, "clientBrands", b.id), cleanFirestoreData(b))));

    // Discovery requests are live leads, not CMS defaults — "reset" just clears them.
    await Promise.all(discoveryRequests.map((r) => deleteDiscoveryRequest(r.id)));

    localStorage.removeItem(LOCAL_STORAGE_BLOG_KEY);
    localStorage.removeItem(LOCAL_STORAGE_REQUESTS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_BRANDS_KEY);
  };

  return (
    <CmsContext.Provider
      value={{
        agencyInfo,
        services,
        blogPosts,
        blogPostsReady,
        discoveryRequests,
        clientBrands,
        callAvailability,
        updateCallAvailability,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addDiscoveryRequest,
        addManualClient,
        updateDiscoveryRequestStatus,
        releaseDiscoverySlot,
        deleteDiscoveryRequest,
        addClientBrand,
        updateClientBrand,
        deleteClientBrand,
        resetToDefaults,
        requestLiveData
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => {
  const context = useContext(CmsContext);
  if (!context) {
    throw new Error("useCms must be used within a CmsProvider");
  }
  return context;
};
