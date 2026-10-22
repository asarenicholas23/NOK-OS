import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
import {
  auth,
  subscribeToBlogPosts,
  subscribeToClientBrands,
  subscribeToDiscoveryRequests,
  subscribeToCallAvailability,
  migrateCmsToFirestoreIfEmpty,
  cleanFirestoreData
} from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

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
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BRANDS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_BRANDS;
    } catch (e) {
      return INITIAL_CLIENT_BRANDS;
    }
  });

  const [callAvailability, setCallAvailability] = useState<CallAvailability>(INITIAL_CALL_AVAILABILITY);
  const [blogPostsReady, setBlogPostsReady] = useState(false);

  const didMigrateCms = useRef(false);
  const [staffUser, setStaffUser] = useState<import("firebase/auth").User | null>(null);

  useEffect(() => {
    // Seeding Firestore requires a signed-in staff session (write rules deny
    // anonymous visitors), so only attempt it once auth has confirmed a real
    // user — never optimistically on page load, where it would silently fail
    // for every public visitor and never actually seed anything.
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setStaffUser(user);
      if (user && !didMigrateCms.current) {
        didMigrateCms.current = true;
        migrateCmsToFirestoreIfEmpty(blogPosts, clientBrands);
      }
    });
    const unsubBlogPosts = subscribeToBlogPosts(setBlogPosts, () => setBlogPostsReady(true));
    // If Firestore never answers (offline), stop waiting and show what we have.
    const readyFallback = window.setTimeout(() => setBlogPostsReady(true), 8000);
    const unsubClientBrands = subscribeToClientBrands(setClientBrands);
    const unsubCallAvailability = subscribeToCallAvailability(setCallAvailability);
    return () => {
      unsubCallAvailability();
      unsubAuth();
      unsubBlogPosts();
      window.clearTimeout(readyFallback);
      unsubClientBrands();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Discovery requests (inbound lead/CRM data) are admin-only reads — public
  // visitors can still submit new ones via addDiscoveryRequest, they just
  // never subscribe to the live list.
  useEffect(() => {
    if (!staffUser) return;
    const unsubDiscoveryRequests = subscribeToDiscoveryRequests(setDiscoveryRequests);
    return () => unsubDiscoveryRequests();
  }, [staffUser]);

  const addBlogPost = async (post: Omit<BlogPost, "id">) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const id = "blog-" + Date.now();
    await setDoc(doc(db, "blogPosts", id), cleanFirestoreData({ ...post, id, createdAt: new Date().toISOString() }));
  };

  const updateBlogPost = async (id: string, updated: Partial<BlogPost>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "blogPosts", id), cleanFirestoreData(updated), { merge: true });
  };

  const deleteBlogPost = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "blogPosts", id));
  };

  const updateCallAvailability = async (availability: CallAvailability) => {
    const { db } = await import("../lib/firebase");
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
    const { db } = await import("../lib/firebase");
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
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "discoveryRequests", newReq.id), cleanFirestoreData(newReq));
    return newReq;
  };

  const updateDiscoveryRequestStatus = async (id: string, status: DiscoveryRequest["status"]) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "discoveryRequests", id), { status });
  };

  // Frees the call time for other visitors while keeping the request (and the
  // time it was booked for) on record as a closed lead.
  const releaseDiscoverySlot = async (id: string) => {
    const req = discoveryRequests.find((r) => r.id === id);
    const { db } = await import("../lib/firebase");
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
    const { db } = await import("../lib/firebase");
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    if (req?.slotStart && !req.slotReleased) {
      batch.delete(doc(db, "discoverySlots", req.slotStart));
    }
    batch.delete(doc(db, "discoveryRequests", id));
    await batch.commit();
  };

  const addClientBrand = async (brand: Omit<ClientBrand, "id">) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const id = "brand-" + Date.now();
    await setDoc(doc(db, "clientBrands", id), cleanFirestoreData({ ...brand, id }));
  };

  const updateClientBrand = async (id: string, updated: Partial<ClientBrand>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "clientBrands", id), cleanFirestoreData(updated), { merge: true });
  };

  const deleteClientBrand = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "clientBrands", id));
  };

  const resetToDefaults = async () => {
    const { db } = await import("../lib/firebase");
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
        resetToDefaults
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
