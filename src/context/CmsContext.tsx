import React, { createContext, useContext, useState, useEffect } from "react";
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

interface CmsContextType {
  agencyInfo: AgencyInfo;
  services: ServicePackage[];
  blogPosts: BlogPost[];
  discoveryRequests: DiscoveryRequest[];
  clientBrands: ClientBrand[];
  updateAgencyInfo: (info: Partial<AgencyInfo>) => void;
  addService: (service: Omit<ServicePackage, "id">) => void;
  updateService: (id: string, updated: Partial<ServicePackage>) => void;
  deleteService: (id: string) => void;
  addBlogPost: (post: Omit<BlogPost, "id">) => void;
  updateBlogPost: (id: string, updated: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  addDiscoveryRequest: (req: Omit<DiscoveryRequest, "id" | "createdAt" | "status">) => DiscoveryRequest;
  updateDiscoveryRequestStatus: (id: string, status: DiscoveryRequest["status"]) => void;
  deleteDiscoveryRequest: (id: string) => void;
  addClientBrand: (brand: Omit<ClientBrand, "id">) => void;
  updateClientBrand: (id: string, updated: Partial<ClientBrand>) => void;
  deleteClientBrand: (id: string) => void;
  resetToDefaults: () => void;
}

const CmsContext = createContext<CmsContextType | undefined>(undefined);

const LOCAL_STORAGE_BLOG_KEY = "nok_cms_blog_posts_v1";
const LOCAL_STORAGE_INFO_KEY = "nok_cms_agency_info_v1";
const LOCAL_STORAGE_SERVICES_KEY = "nok_cms_services_v2";
const LOCAL_STORAGE_REQUESTS_KEY = "nok_cms_discovery_requests_v1";
const LOCAL_STORAGE_BRANDS_KEY = "nok_cms_client_brands_v2";

export const CmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_INFO_KEY, JSON.stringify(agencyInfo));
    } catch (e) {
      console.error("Failed to save agency info", e);
    }
  }, [agencyInfo]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SERVICES_KEY, JSON.stringify(services));
    } catch (e) {
      console.error("Failed to save services", e);
    }
  }, [services]);

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

  const updateAgencyInfo = (info: Partial<AgencyInfo>) => {
    setAgencyInfo((prev) => ({ ...prev, ...info }));
  };

  const addService = (service: Omit<ServicePackage, "id">) => {
    const newService: ServicePackage = {
      ...service,
      id: "service-" + Date.now()
    };
    setServices((prev) => [...prev, newService]);
  };

  const updateService = (id: string, updated: Partial<ServicePackage>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
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

  const resetToDefaults = () => {
    setAgencyInfo(INITIAL_AGENCY_INFO);
    setServices(INITIAL_SERVICES);
    setBlogPosts(INITIAL_BLOG_POSTS);
    setDiscoveryRequests(INITIAL_DISCOVERY_REQUESTS);
    setClientBrands(INITIAL_CLIENT_BRANDS);
    localStorage.removeItem(LOCAL_STORAGE_INFO_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SERVICES_KEY);
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
