import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  BlogPost,
  ServicePackage,
  AgencyInfo,
  DiscoveryRequest,
  ClientBrand,
  INITIAL_AGENCY_INFO,
  INITIAL_SERVICES,
  INITIAL_BLOG_POSTS,
  INITIAL_DISCOVERY_REQUESTS,
  INITIAL_CLIENT_BRANDS
} from "../data/cmsData";
import {
  auth,
  subscribeToAgencyInfo,
  subscribeToServices,
  subscribeToBlogPosts,
  subscribeToClientBrands,
  subscribeToDiscoveryRequests,
  migrateCmsToFirestoreIfEmpty,
  cleanFirestoreData
} from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface CmsContextType {
  agencyInfo: AgencyInfo;
  services: ServicePackage[];
  blogPosts: BlogPost[];
  discoveryRequests: DiscoveryRequest[];
  clientBrands: ClientBrand[];
  updateAgencyInfo: (info: Partial<AgencyInfo>) => Promise<void>;
  addService: (service: Omit<ServicePackage, "id">) => Promise<void>;
  updateService: (id: string, updated: Partial<ServicePackage>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addBlogPost: (post: Omit<BlogPost, "id">) => Promise<void>;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  addDiscoveryRequest: (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status">) => Promise<void>;
  updateDiscoveryRequestStatus: (id: string, status: DiscoveryRequest["status"]) => Promise<void>;
  deleteDiscoveryRequest: (id: string) => Promise<void>;
  addClientBrand: (brand: Omit<ClientBrand, "id">) => Promise<void>;
  updateClientBrand: (id: string, updated: Partial<ClientBrand>) => Promise<void>;
  deleteClientBrand: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

const LOCAL_STORAGE_BLOG_KEY = "nok_cms_blog_posts_v1";
const LOCAL_STORAGE_INFO_KEY = "nok_cms_agency_info_v1";
const LOCAL_STORAGE_SERVICES_KEY = "nok_cms_services_v2";
const LOCAL_STORAGE_REQUESTS_KEY = "nok_cms_discovery_requests_v1";
const LOCAL_STORAGE_BRANDS_KEY = "nok_cms_client_brands_v2";

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // agencyInfo & services live in Firestore so edits sync across browsers/devices.
  // The local values (from this browser's pre-existing localStorage, if any) are
  // used as the seed for a one-time migration the first time Firestore is empty.
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_INFO_KEY);
      return saved ? JSON.parse(saved) : INITIAL_AGENCY_INFO;
    } catch (e) {
      return INITIAL_AGENCY_INFO;
    }
  });

  const [services, setServices] = useState<ServicePackage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SERVICES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch (e) {
      return INITIAL_SERVICES;
    }
  });

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

  const [discoveryRequests, setDiscoveryRequests] = useState<DiscoveryRequest[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DISCOVERY_REQUESTS;
    } catch (e) {
      return INITIAL_DISCOVERY_REQUESTS;
    }
  });

  const [clientBrands, setClientBrands] = useState<ClientBrand[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BRANDS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_BRANDS;
    } catch (e) {
      return INITIAL_CLIENT_BRANDS;
    }
  });

  const didMigrateCms = useRef(false);

  useEffect(() => {
    // Seeding Firestore requires a signed-in staff session (write rules deny
    // anonymous visitors), so only attempt it once auth has confirmed a real
    // user — never optimistically on page load, where it would silently fail
    // for every public visitor and never actually seed anything.
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && !didMigrateCms.current) {
        didMigrateCms.current = true;
        migrateCmsToFirestoreIfEmpty(agencyInfo, services, blogPosts, clientBrands, discoveryRequests);
      }
    });
    const unsubInfo = subscribeToAgencyInfo(setAgencyInfo);
    const unsubServices = subscribeToServices(setServices);
    const unsubBlogPosts = subscribeToBlogPosts(setBlogPosts);
    const unsubClientBrands = subscribeToClientBrands(setClientBrands);
    const unsubDiscoveryRequests = subscribeToDiscoveryRequests(setDiscoveryRequests);
    return () => {
      unsubAuth();
      unsubInfo();
      unsubServices();
      unsubBlogPosts();
      unsubClientBrands();
      unsubDiscoveryRequests();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAgencyInfo = async (info: Partial<AgencyInfo>) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "cms", "agencyInfo"), cleanFirestoreData({ ...agencyInfo, ...info }), { merge: true });
  };

  const addService = async (service: Omit<ServicePackage, "id">) => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    const id = "service-" + Date.now();
    await setDoc(doc(db, "services", id), cleanFirestoreData({ ...service, id, order: services.length }));
  };

  const updateService = async (id: string, updated: Partial<ServicePackage>) => {
    const current = services.find((s) => s.id === id);
    const { db } = await import("../lib/firebase");
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "services", id), cleanFirestoreData({ ...current, ...updated }), { merge: true });
  };

  const deleteService = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "services", id));
  };

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

  const addDiscoveryRequest = async (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status">) => {
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
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "discoveryRequests", id), cleanFirestoreData(newReq));
  };

  const updateDiscoveryRequestStatus = async (id: string, status: DiscoveryRequest["status"]) => {
    const { db } = await import("../lib/firebase");
    const { doc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "discoveryRequests", id), { status });
  };

  const deleteDiscoveryRequest = async (id: string) => {
    const { db } = await import("../lib/firebase");
    const { doc, deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "discoveryRequests", id));
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
    await setDoc(doc(db, "cms", "agencyInfo"), INITIAL_AGENCY_INFO);
    await Promise.all(services.map((s) => deleteDoc(doc(db, "services", s.id))));
    await Promise.all(INITIAL_SERVICES.map((s, i) => setDoc(doc(db, "services", s.id), { ...s, order: i })));

    await Promise.all(blogPosts.map((p) => deleteDoc(doc(db, "blogPosts", p.id))));
    await Promise.all(INITIAL_BLOG_POSTS.map((p, i) =>
      setDoc(doc(db, "blogPosts", p.id), cleanFirestoreData({ ...p, createdAt: new Date(Date.now() - i * 1000).toISOString() }))
    ));

    await Promise.all(clientBrands.map((b) => deleteDoc(doc(db, "clientBrands", b.id))));
    await Promise.all(INITIAL_CLIENT_BRANDS.map((b) => setDoc(doc(db, "clientBrands", b.id), cleanFirestoreData(b))));

    await Promise.all(discoveryRequests.map((r) => deleteDoc(doc(db, "discoveryRequests", r.id))));
    await Promise.all(INITIAL_DISCOVERY_REQUESTS.map((r) => setDoc(doc(db, "discoveryRequests", r.id), cleanFirestoreData(r))));

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
        discoveryRequests,
        clientBrands,
        updateAgencyInfo,
        addService,
        updateService,
        deleteService,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        addDiscoveryRequest,
        updateDiscoveryRequestStatus,
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
