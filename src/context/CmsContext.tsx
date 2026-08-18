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
import { subscribeToAgencyInfo, subscribeToServices, migrateCmsToFirestoreIfEmpty, cleanFirestoreData } from "../lib/firebase";

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
  addBlogPost: (post: Omit<BlogPost, "id">) => void;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  addDiscoveryRequest: (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status">) => DiscoveryRequest;
  updateDiscoveryRequestStatus: (id: string, status: DiscoveryRequest["status"]) => void;
  deleteDiscoveryRequest: (id: string) => void;
  addClientBrand: (brand: Omit<ClientBrand, "id">) => void;
  updateClientBrand: (id: string, updated: Partial<ClientBrand>) => void;
  deleteClientBrand: (id: string) => void;
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

  const didMigrateCms = useRef(false);

  useEffect(() => {
    if (!didMigrateCms.current) {
      didMigrateCms.current = true;
      migrateCmsToFirestoreIfEmpty(agencyInfo, services);
    }
    const unsubInfo = subscribeToAgencyInfo(setAgencyInfo);
    const unsubServices = subscribeToServices(setServices);
    return () => {
      unsubInfo();
      unsubServices();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BLOG_KEY, JSON.stringify(blogPosts));
    } catch (e) {
      console.error("Failed to save blog posts", e);
    }
  }, [blogPosts]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(discoveryRequests));
    } catch (e) {
      console.error("Failed to save discovery requests", e);
    }
  }, [discoveryRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BRANDS_KEY, JSON.stringify(clientBrands));
    } catch (e) {
      console.error("Failed to save client brands", e);
    }
  }, [clientBrands]);

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

  const addBlogPost = (post: Omit<BlogPost, "id">) => {
    const newPost: BlogPost = {
      ...post,
      id: "blog-" + Date.now()
    };
    setBlogPosts((prev) => [newPost, ...prev]);
  };

  const updateBlogPost = (id: string, updated: Partial<BlogPost>) => {
    setBlogPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
  };

  const deleteBlogPost = (id: string) => {
    setBlogPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const addDiscoveryRequest = (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status">): DiscoveryRequest => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newReq: DiscoveryRequest = {
      ...req,
      id: "call-" + Date.now(),
      createdAt: formattedDate,
      status: "New"
    };
    setDiscoveryRequests((prev) => [newReq, ...prev]);
    return newReq;
  };

  const updateDiscoveryRequestStatus = (id: string, status: DiscoveryRequest["status"]) => {
    setDiscoveryRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  };

  const deleteDiscoveryRequest = (id: string) => {
    setDiscoveryRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const addClientBrand = (brand: Omit<ClientBrand, "id">) => {
    const newBrand: ClientBrand = {
      ...brand,
      id: "brand-" + Date.now()
    };
    setClientBrands((prev) => [...prev, newBrand]);
  };

  const updateClientBrand = (id: string, updated: Partial<ClientBrand>) => {
    setClientBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updated } : b))
    );
  };

  const deleteClientBrand = (id: string) => {
    setClientBrands((prev) => prev.filter((b) => b.id !== id));
  };

  const resetToDefaults = async () => {
    const { db } = await import("../lib/firebase");
    const { doc, setDoc, deleteDoc } = await import("firebase/firestore");
    await setDoc(doc(db, "cms", "agencyInfo"), INITIAL_AGENCY_INFO);
    await Promise.all(services.map((s) => deleteDoc(doc(db, "services", s.id))));
    await Promise.all(INITIAL_SERVICES.map((s, i) => setDoc(doc(db, "services", s.id), { ...s, order: i })));

    setBlogPosts(INITIAL_BLOG_POSTS);
    setDiscoveryRequests(INITIAL_DISCOVERY_REQUESTS);
    setClientBrands(INITIAL_CLIENT_BRANDS);
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
