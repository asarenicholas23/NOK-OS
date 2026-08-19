import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useCms } from "../context/CmsContext";
import { apiFetch } from "../lib/apiBase";
import { BlogPost, ServicePackage, DiscoveryRequest, ClientBrand } from "../data/cmsData";
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Globe, 
  Sparkles, 
  X,
  RotateCcw,
  BookOpen,
  Layers,
  Upload,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Eye,
  Link2,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  Search,
  Filter,
  UserCheck,
  ShieldCheck,
  Building2
} from "lucide-react";

export const CmsPage: React.FC = () => {
  const { 
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
    updateDiscoveryRequestStatus,
    deleteDiscoveryRequest,
    addClientBrand,
    updateClientBrand,
    deleteClientBrand,
    resetToDefaults
  } = useCms();

  const [activeTab, setActiveTab] = useState<"leads" | "blog" | "agency" | "services" | "brands">("leads");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Leads tab state
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>("All");
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  // Blog editing state
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [isAddingBlog, setIsAddingBlog] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importPasteText, setImportPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"write" | "preview">("write");
  const [blogFormData, setBlogFormData] = useState({
    title: "",
    category: "Sales Funnel Mastery",
    authorName: "Osei Kofi",
    authorRole: "Lead Strategist, NOK Social",
    readTime: "5 min read",
    coverImage: "",
    excerpt: "",
    contentRaw: ""
  });

  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "text") => {
    setBlogFormData((prev) => {
      const current = prev.contentRaw;
      const addition = suffix ? `${prefix}${placeholder}${suffix}` : `${prefix}${placeholder}`;
      const updated = current ? `${current}\n\n${addition}` : addition;
      return { ...prev, contentRaw: updated };
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter the destination URL:", "https://");
    if (!url || !url.trim()) return;
    const linkText = window.prompt("Enter the text readers will see (optional):", "") || "link text";
    setBlogFormData((prev) => {
      const current = prev.contentRaw;
      const addition = `[${linkText}](${url.trim()})`;
      const updated = current ? `${current} ${addition}` : addition;
      return { ...prev, contentRaw: updated };
    });
  };

  // Agency info form state
  const [agencyFormData, setAgencyFormData] = useState({ ...agencyInfo });

  // Service editing state
  const [editingService, setEditingService] = useState<ServicePackage | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    title: "",
    tier: "Tier 1",
    ghsPrice: "GH₵ 1,500",
    period: "per month",
    desc: "",
    featuresRaw: "",
    featured: false
  });

  // Brand editing state
  const [editingBrand, setEditingBrand] = useState<ClientBrand | null>(null);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);
  const [brandFormData, setBrandFormData] = useState({
    name: "",
    slug: "",
    tagline: "",
    industry: "Streetwear & Fashion",
    overview: "",
    socialHandle: "@",
    website: "",
    accentColor: "#B08D57",
    bannerColor: "#0D0D12",
    logoUrl: "",
    servicesRaw: "",
    deliverablesRaw: "",
    metric1Val: "",
    metric1Label: "",
    metric2Val: "",
    metric2Label: "",
    metric3Val: "",
    metric3Label: ""
  });

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Blog posts are stored as Firestore documents (1MiB hard limit per
  // document), so images are uploaded to Cloud Storage and only the download
  // URL is saved on the post — keeping the document small regardless of
  // photo size.
  const MAX_UPLOAD_IMAGE_BYTES = 10 * 1024 * 1024;
  const [uploadingImage, setUploadingImage] = useState<"cover" | "body" | null>(null);

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      alert("Please select an image smaller than 10MB.");
      return;
    }
    setUploadingImage("cover");
    try {
      const { uploadBlogImage } = await import("../lib/firebase");
      const url = await uploadBlogImage(file);
      setBlogFormData((prev) => ({ ...prev, coverImage: url }));
      showNotification("Cover image uploaded successfully!");
    } catch (err: any) {
      alert("Failed to upload image: " + (err?.message || "Unknown error"));
    } finally {
      setUploadingImage(null);
    }
  };

  const handleBodyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_IMAGE_BYTES) {
      alert("Please select an image smaller than 10MB.");
      return;
    }
    setUploadingImage("body");
    try {
      const { uploadBlogImage } = await import("../lib/firebase");
      const url = await uploadBlogImage(file);
      setBlogFormData((prev) => ({
        ...prev,
        contentRaw: prev.contentRaw ? `${prev.contentRaw}\n\n${url}` : url
      }));
      showNotification("Photo inserted into article body!");
    } catch (err: any) {
      alert("Failed to upload image: " + (err?.message || "Unknown error"));
    } finally {
      setUploadingImage(null);
    }
  };

  // Substack / Blogger migration importer
  const handleImportFromUrlOrText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl && !importPasteText) {
      showNotification("Please paste a Substack/Blogger URL or article text!");
      return;
    }

    setImporting(true);

    try {
      const resp = await apiFetch("/api/import-blog-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl.trim(),
          rawText: importPasteText.trim()
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setBlogFormData({
          title: data.title || "Migrated Article",
          category: data.category || "Substack Series",
          authorName: data.authorName || "Osei Kofi",
          authorRole: data.authorRole || "Lead Strategist, NOK Social",
          readTime: data.readTime || "5 min read",
          coverImage: data.coverImage || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80",
          excerpt: data.excerpt || "",
          contentRaw: data.contentMarkdown || ""
        });
        setIsImportModalOpen(false);
        setIsAddingBlog(true);
        setEditingBlog(null);
        setImportUrl("");
        setImportPasteText("");
        showNotification("Full Substack/Blogger article extracted! Review and click Save & Publish.");
        return;
      }
    } catch (err) {
      console.warn("API import failed, using fallback", err);
    }

    // Client fallback if offline
    try {
      let inferredTitle = "Migrated Post";
      let inferredCategory = "Substack Series";
      let inferredCover = "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80";
      let bodyText = importPasteText.trim();

      if (importUrl.trim()) {
        const cleanUrl = importUrl.trim();
        const urlParts = cleanUrl.split("/").filter(Boolean);
        const lastPart = urlParts[urlParts.length - 1] || "migrated-article";
        inferredTitle = lastPart
          .replace(/-/g, " ")
          .replace(/_/g, " ")
          .replace(/\.html?$/i, "")
          .replace(/\b\w/g, (c) => c.toUpperCase());

        if (cleanUrl.includes("substack.com")) {
          inferredCategory = "Substack Series";
        } else if (cleanUrl.includes("blogspot.com") || cleanUrl.includes("blogger.com")) {
          inferredCategory = "Blogger Archive";
        }

        if (!bodyText) {
          bodyText = `## ${inferredTitle}\n\n*Migrated article from ${cleanUrl}*\n\nReview sections below before publishing.`;
        }
      }

      setBlogFormData({
        title: inferredTitle,
        category: inferredCategory,
        authorName: "Osei Kofi",
        authorRole: "Lead Strategist, NOK Social",
        readTime: "5 min read",
        coverImage: inferredCover,
        excerpt: bodyText.slice(0, 180) + "...",
        contentRaw: bodyText
      });

      setIsImportModalOpen(false);
      setIsAddingBlog(true);
      setEditingBlog(null);
      setImportUrl("");
      setImportPasteText("");
      showNotification("Article prepared! Review and click Save & Publish.");
    } catch (err) {
      showNotification("Error parsing article link.");
    } finally {
      setImporting(false);
    }
  };

  // Blog submission
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    const contentArray = blogFormData.contentRaw
      .split("\n\n")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const slug = blogFormData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    try {
      if (editingBlog) {
        await updateBlogPost(editingBlog.id, {
          title: blogFormData.title,
          slug,
          category: blogFormData.category,
          readTime: blogFormData.readTime,
          coverImage: blogFormData.coverImage.trim() || undefined,
          author: {
            name: blogFormData.authorName,
            role: blogFormData.authorRole
          },
          excerpt: blogFormData.excerpt,
          content: contentArray
        });
        showNotification("Blog post updated successfully!");
      } else {
        await addBlogPost({
          slug,
          title: blogFormData.title,
          category: blogFormData.category,
          date: dateStr,
          readTime: blogFormData.readTime,
          coverImage: blogFormData.coverImage.trim() || undefined,
          author: {
            name: blogFormData.authorName,
            role: blogFormData.authorRole
          },
          excerpt: blogFormData.excerpt,
          content: contentArray
        });
        showNotification("New blog post published!");
      }
    } catch (err: any) {
      alert("Failed to save this article: " + (err?.message || "Unknown error") + "\n\nYour changes were NOT saved. Please check you're still logged in and try again.");
      return;
    }

    setEditingBlog(null);
    setIsAddingBlog(false);
  };

  const startEditBlog = (post: BlogPost) => {
    setEditingBlog(post);
    setBlogFormData({
      title: post.title,
      category: post.category,
      authorName: post.author.name,
      authorRole: post.author.role,
      readTime: post.readTime,
      coverImage: post.coverImage || "",
      excerpt: post.excerpt,
      contentRaw: post.content.join("\n\n")
    });
    setIsAddingBlog(true);
  };

  const openNewBlogForm = () => {
    setEditingBlog(null);
    setBlogFormData({
      title: "",
      category: "Sales Funnel Mastery",
      authorName: "Osei Kofi",
      authorRole: "Lead Strategist, NOK Social",
      readTime: "5 min read",
      coverImage: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80",
      excerpt: "",
      contentRaw: ""
    });
    setIsAddingBlog(true);
  };

  // Save Agency Info
  const handleSaveAgencyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgencyInfo(agencyFormData);
    showNotification("Agency contact details & hero text updated!");
  };

  // Service submission
  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = serviceFormData.featuresRaw
      .split("\n")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    if (editingService) {
      updateService(editingService.id, {
        title: serviceFormData.title,
        tier: serviceFormData.tier,
        ghsPrice: serviceFormData.ghsPrice,
        period: serviceFormData.period,
        desc: serviceFormData.desc,
        featured: serviceFormData.featured,
        features: featuresList
      });
      showNotification("Service package updated!");
    } else {
      addService({
        title: serviceFormData.title,
        tier: serviceFormData.tier,
        ghsPrice: serviceFormData.ghsPrice,
        period: serviceFormData.period,
        desc: serviceFormData.desc,
        featured: serviceFormData.featured,
        features: featuresList
      });
      showNotification("New service package created!");
    }

    setEditingService(null);
    setIsAddingService(false);
  };

  const startEditService = (service: ServicePackage) => {
    setEditingService(service);
    setServiceFormData({
      title: service.title,
      tier: service.tier,
      ghsPrice: service.ghsPrice,
      period: service.period,
      desc: service.desc,
      featured: !!service.featured,
      featuresRaw: service.features.join("\n")
    });
    setIsAddingService(true);
  };

  const openNewServiceForm = () => {
    setEditingService(null);
    setServiceFormData({
      title: "",
      tier: "Tier 1",
      ghsPrice: "GH₵ 1,500",
      period: "per month",
      desc: "",
      featured: false,
      featuresRaw: ""
    });
    setIsAddingService(true);
  };

  // Brand handlers
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const servicesList = brandFormData.servicesRaw
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const deliverablesList = brandFormData.deliverablesRaw
      .split("\n")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const metricsList = [
      { value: brandFormData.metric1Val, label: brandFormData.metric1Label },
      { value: brandFormData.metric2Val, label: brandFormData.metric2Label },
      { value: brandFormData.metric3Val, label: brandFormData.metric3Label }
    ].filter((m) => m.value.trim() && m.label.trim());

    const slug = brandFormData.slug.trim() || brandFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    try {
      if (editingBrand) {
        await updateClientBrand(editingBrand.id, {
          name: brandFormData.name,
          slug,
          tagline: brandFormData.tagline,
          industry: brandFormData.industry,
          overview: brandFormData.overview,
          socialHandle: brandFormData.socialHandle,
          website: brandFormData.website,
          accentColor: brandFormData.accentColor,
          bannerColor: brandFormData.bannerColor,
          logoUrl: brandFormData.logoUrl,
          servicesProvided: servicesList,
          deliverables: deliverablesList,
          metrics: metricsList.length > 0 ? metricsList : [{ value: "100%", label: "Strategy Alignment" }]
        });
        showNotification("Client brand updated successfully!");
      } else {
        await addClientBrand({
          name: brandFormData.name,
          slug,
          tagline: brandFormData.tagline,
          industry: brandFormData.industry,
          overview: brandFormData.overview,
          socialHandle: brandFormData.socialHandle,
          website: brandFormData.website,
          accentColor: brandFormData.accentColor,
          bannerColor: brandFormData.bannerColor,
          logoUrl: brandFormData.logoUrl,
          servicesProvided: servicesList,
          deliverables: deliverablesList,
          metrics: metricsList.length > 0 ? metricsList : [{ value: "100%", label: "Strategy Alignment" }]
        });
        showNotification("New client brand added to showcase!");
      }
    } catch (err: any) {
      alert("Failed to save this client brand: " + (err?.message || "Unknown error") + "\n\nYour changes were NOT saved. Please check you're still logged in and try again.");
      return;
    }

    setEditingBrand(null);
    setIsAddingBrand(false);
  };

  const startEditBrand = (brand: ClientBrand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      slug: brand.slug,
      tagline: brand.tagline,
      industry: brand.industry,
      overview: brand.overview,
      socialHandle: brand.socialHandle || "",
      website: brand.website || "",
      accentColor: brand.accentColor || "#B08D57",
      bannerColor: brand.bannerColor || "#0D0D12",
      logoUrl: brand.logoUrl || "",
      servicesRaw: brand.servicesProvided.join("\n"),
      deliverablesRaw: brand.deliverables.join("\n"),
      metric1Val: brand.metrics[0]?.value || "",
      metric1Label: brand.metrics[0]?.label || "",
      metric2Val: brand.metrics[1]?.value || "",
      metric2Label: brand.metrics[1]?.label || "",
      metric3Val: brand.metrics[2]?.value || "",
      metric3Label: brand.metrics[2]?.label || ""
    });
    setIsAddingBrand(true);
  };

  const openNewBrandForm = () => {
    setEditingBrand(null);
    setBrandFormData({
      name: "",
      slug: "",
      tagline: "",
      industry: "Streetwear & Fashion",
      overview: "",
      socialHandle: "@",
      website: "https://",
      accentColor: "#B08D57",
      bannerColor: "#0D0D12",
      logoUrl: "",
      servicesRaw: "Social Engine\nContent Strategy",
      deliverablesRaw: "Visual Assets\nPublishing Cadence",
      metric1Val: "+120%",
      metric1Label: "Growth",
      metric2Val: "3.2x",
      metric2Label: "Engagement",
      metric3Val: "100%",
      metric3Label: "Delivery"
    });
    setIsAddingBrand(true);
  };

  return (
    <div className="space-y-6 text-[#F2F0EB]">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-2xl neu-raised bg-[#15151A] text-emerald-400 border border-emerald-500/30 flex items-center space-x-2 text-xs font-mono shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl neu-raised flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full neu-pressed text-[#B08D57] text-[10px] font-mono mb-2 uppercase tracking-wider font-bold">
            <Sparkles className="w-3 h-3 text-[#B08D57]" />
            <span>NOK OS Content Management System</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#F2F0EB]">
            CMS & Public Website Editor
          </h1>
          <p className="text-xs text-[#8A8A93] mt-1 max-w-xl">
            Update blog articles migrated from noksocials.blogspot.com, customize agency pricing & packages, and modify address/contact details live without code changes.
          </p>
        </div>

        <button
          onClick={resetToDefaults}
          className="neu-raised-sm px-3.5 py-2 rounded-xl text-xs font-mono text-[#8A8A93] hover:text-rose-400 flex items-center space-x-1.5 shrink-0 cursor-pointer"
          title="Reset CMS data back to initial defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl neu-pressed">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2 transition-all cursor-pointer relative ${
            activeTab === "leads"
              ? "neu-pressed text-[#B08D57] border-l-2 border-[#B08D57]"
              : "text-[#8A8A93] hover:text-[#F2F0EB]"
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Inbound Discovery Calls ({discoveryRequests.length})</span>
          {discoveryRequests.filter(r => r.status === "New").length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("blog")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "blog"
              ? "neu-pressed text-[#B08D57] border-l-2 border-[#B08D57]"
              : "text-[#8A8A93] hover:text-[#F2F0EB]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Blog Articles ({blogPosts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("agency")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "agency"
              ? "neu-pressed text-[#B08D57] border-l-2 border-[#B08D57]"
              : "text-[#8A8A93] hover:text-[#F2F0EB]"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Contact & Address Info</span>
        </button>

        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "services"
              ? "neu-pressed text-[#B08D57] border-l-2 border-[#B08D57]"
              : "text-[#8A8A93] hover:text-[#F2F0EB]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Services & Pricing ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("brands")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === "brands"
              ? "neu-pressed text-[#B08D57] border-l-2 border-[#B08D57]"
              : "text-[#8A8A93] hover:text-[#F2F0EB]"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Client Brands ({clientBrands.length})</span>
        </button>
      </div>

      {/* TAB 0: INBOUND DISCOVERY CALLS & LEADS */}
      {activeTab === "leads" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Inbound Discovery Calls & Client Leads</h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Live Synced
                </span>
              </div>
              <p className="text-xs text-[#8A8A93] mt-0.5">
                All "Book a Discovery Call" form submissions from the public site automatically stream into this workspace queue.
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-xl neu-pressed flex items-center space-x-2">
                <span className="text-[#8A8A93]">Total Leads:</span>
                <span className="font-bold text-[#F2F0EB]">{discoveryRequests.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl neu-pressed flex items-center space-x-2">
                <span className="text-emerald-400">New Calls:</span>
                <span className="font-bold text-emerald-400">{discoveryRequests.filter(r => r.status === "New").length}</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl neu-pressed flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#8A8A93]" />
              <input
                type="text"
                placeholder="Search leads by name, email, brand..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-[#8A8A93] shrink-0" />
              <span className="text-[10px] font-mono text-[#8A8A93] uppercase shrink-0">Filter:</span>
              {["All", "New", "Contacted", "Scheduled", "Converted", "Closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setLeadStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                    leadStatusFilter === status
                      ? "bg-[#B08D57] text-[#111115]"
                      : "neu-raised text-[#8A8A93] hover:text-[#F2F0EB]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Grid / Cards */}
          <div className="space-y-4">
            {discoveryRequests
              .filter((req) => {
                const matchesFilter = leadStatusFilter === "All" || req.status === leadStatusFilter;
                const matchesSearch = 
                  req.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                  req.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
                  req.businessName.toLowerCase().includes(leadSearch.toLowerCase()) ||
                  req.serviceTier.toLowerCase().includes(leadSearch.toLowerCase());
                return matchesFilter && matchesSearch;
              })
              .map((req) => {
                const statusColors = {
                  New: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                  Contacted: "bg-amber-500/10 text-amber-400 border-amber-500/30",
                  Scheduled: "bg-violet-500/10 text-violet-400 border-violet-500/30",
                  Converted: "bg-cyanotype/20 text-cyanotype border-cyanotype/40 font-bold",
                  Closed: "bg-white/5 text-zinc-400 border-white/10"
                }[req.status];

                const whatsappMsg = `Hello ${req.name}! Thank you for booking a Discovery Call for ${req.businessName} with NOK Social.\n\nRegarding your interest in the *${req.serviceTier}* tier...`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`;
                const mailtoUrl = `mailto:${req.email}?subject=${encodeURIComponent(`NOK Social — Discovery Call for ${req.businessName}`)}&body=${encodeURIComponent(`Hello ${req.name},\n\nThank you for booking a Discovery Call with NOK Social regarding ${req.businessName}.\n\nWhen would be the best time for our strategy team to connect?`)}`;

                return (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-2xl neu-raised space-y-4 border border-white/5 hover:border-[#B08D57]/30 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-display font-bold text-base text-[#F2F0EB]">{req.name}</h3>
                          <span className="text-xs font-mono text-[#B08D57] font-semibold">• {req.businessName}</span>
                        </div>
                        <p className="text-xs font-mono text-[#8A8A93] mt-0.5">
                          Submitted: {req.createdAt}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Status Switcher */}
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] font-mono text-[#8A8A93] uppercase">Status:</span>
                          <select
                            value={req.status}
                            onChange={(e) => updateDiscoveryRequestStatus(req.id, e.target.value as any)}
                            className={`text-xs font-mono px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${statusColors}`}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Converted">Converted</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-xl neu-pressed bg-[#111115] text-xs">
                      <div>
                        <span className="block text-[10px] font-mono text-[#8A8A93] uppercase">Interested Service Tier:</span>
                        <span className="font-semibold text-[#B08D57]">{req.serviceTier}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-[#8A8A93] uppercase">Client Email Address:</span>
                        <a href={`mailto:${req.email}`} className="text-[#F2F0EB] hover:text-[#B08D57] underline">
                          {req.email}
                        </a>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono text-[#8A8A93] uppercase">Brand / Business:</span>
                        <span className="text-[#F2F0EB]">{req.businessName}</span>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="p-3 rounded-xl neu-pressed-deep text-xs text-zinc-300">
                        <span className="block text-[10px] font-mono text-[#B08D57] uppercase font-bold mb-0.5">Primary Goals / Client Notes:</span>
                        <p className="italic leading-relaxed">{req.notes}</p>
                      </div>
                    )}

                    {/* Quick Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center space-x-2">
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[11px] font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Client</span>
                        </a>

                        <a
                          href={mailtoUrl}
                          className="px-3 py-1.5 rounded-xl neu-raised text-[#F2F0EB] hover:text-[#B08D57] font-mono text-[11px] font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
                          <span>Email Invitation</span>
                        </a>
                      </div>

                      {deletingLeadId === req.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-rose-300">Delete request?</span>
                          <button
                            onClick={() => setDeletingLeadId(null)}
                            className="px-2 py-1 rounded neu-raised text-[10px] font-mono text-zinc-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              deleteDiscoveryRequest(req.id);
                              setDeletingLeadId(null);
                            }}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-mono font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingLeadId(req.id)}
                          className="p-2 rounded-xl neu-pressed text-rose-400 hover:text-rose-300 cursor-pointer text-xs"
                          title="Delete request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {discoveryRequests.length === 0 && (
              <div className="text-center py-12 rounded-2xl neu-pressed text-[#8A8A93] space-y-2">
                <PhoneCall className="w-8 h-8 text-[#B08D57] mx-auto opacity-50" />
                <p className="text-xs font-mono">No discovery call requests received yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: BLOG ARTICLES MANAGER */}
      {activeTab === "blog" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Migrated & Published Articles</h2>
              <p className="text-xs text-[#8A8A93]">Articles appear live on the public <span className="text-[#B08D57]">/blog</span> and <span className="text-[#B08D57]">/blog/:slug</span> pages.</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 neu-raised hover:neu-pressed text-[#B08D57] border border-[#B08D57]/30 cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Import Substack / Blogger</span>
              </button>

              <button
                onClick={openNewBlogForm}
                className="neu-gold-filled px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Article</span>
              </button>
            </div>
          </div>

          {/* Substack / Blogger Migration Link Importer Modal */}
          {isImportModalOpen && (
            <div className="p-6 rounded-3xl neu-raised space-y-4 border border-[#B08D57]/40 bg-[#111115] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2 text-[#B08D57]">
                  <Sparkles className="w-4 h-4 text-[#B08D57]" />
                  <h3 className="text-sm font-bold font-display text-[#F2F0EB]">Import Blog Post from Substack or Blogger</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-lg text-[#8A8A93] hover:text-[#F2F0EB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleImportFromUrlOrText} className="space-y-4">
                <p className="text-xs text-[#8A8A93] leading-relaxed">
                  Paste your Substack or Blogger.com article link or raw text below. We will parse it and prep the rich Markdown formatting, images, and excerpt automatically!
                </p>

                <div>
                  <label className="block text-[10px] font-mono text-[#B08D57] uppercase font-bold mb-1 flex items-center space-x-1">
                    <Link2 className="w-3 h-3 text-[#B08D57]" />
                    <span>Option A: Paste Substack / Blogger Article URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="e.g. https://oseikofi.substack.com/p/sales-funnel-mastery"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                    Option B: Direct Copy & Paste Article Content (Optional)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Paste full text or raw post content from Substack or Blogger here..."
                    value={importPasteText}
                    onChange={(e) => setImportPasteText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    ✓ 100% Free Instant Migration
                  </span>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsImportModalOpen(false)}
                      className="px-4 py-2 rounded-xl neu-raised text-xs font-mono text-[#8A8A93] hover:text-[#F2F0EB]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={importing}
                      className="neu-gold-filled px-5 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{importing ? "Processing..." : "Import & Format Article"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Blog Editor Modal/Form */}
          {isAddingBlog && (
            <div className="p-6 rounded-3xl neu-raised space-y-4 border border-[#B08D57]/30 bg-[#15151A] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold font-display text-[#B08D57] flex items-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{editingBlog ? "Edit Article" : "Write & Publish New Article"}</span>
                </h3>
                <button
                  onClick={() => setIsAddingBlog(false)}
                  className="p-1 rounded-lg text-[#8A8A93] hover:text-[#F2F0EB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBlog} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Article Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales Funnel Mastery for Ghanaian Brands"
                      value={blogFormData.title}
                      onChange={(e) => setBlogFormData({ ...blogFormData, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sales Funnel Mastery, Digital Strategy"
                      value={blogFormData.category}
                      onChange={(e) => setBlogFormData({ ...blogFormData, category: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Author Name
                    </label>
                    <input
                      type="text"
                      required
                      value={blogFormData.authorName}
                      onChange={(e) => setBlogFormData({ ...blogFormData, authorName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Author Role
                    </label>
                    <input
                      type="text"
                      required
                      value={blogFormData.authorRole}
                      onChange={(e) => setBlogFormData({ ...blogFormData, authorRole: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Estimated Read Time
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 min read"
                      value={blogFormData.readTime}
                      onChange={(e) => setBlogFormData({ ...blogFormData, readTime: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>
                </div>

                {/* Cover Image & Picture Support (100% Free) */}
                <div className="p-4 rounded-2xl neu-pressed space-y-3 bg-[#111115] border border-[#B08D57]/20">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-[#B08D57] uppercase font-bold flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>Article Cover Picture (100% Free)</span>
                      </label>
                      <p className="text-[10px] text-[#8A8A93] mt-0.5">
                        Upload directly from your device (phone/laptop) OR paste a web URL link below.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      Local Files + Web URLs • Zero Cost
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Local File Upload Button */}
                    <label className="flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl neu-raised-sm hover:neu-pressed cursor-pointer border border-[#B08D57]/30 text-xs font-mono text-[#F2F0EB]">
                      <Upload className="w-4 h-4 text-[#B08D57]" />
                      <span>{uploadingImage === "cover" ? "Uploading..." : "Upload Local Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                        disabled={uploadingImage !== null}
                        className="hidden"
                      />
                    </label>

                    {/* URL Input */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Or paste web image URL..."
                        value={blogFormData.coverImage.startsWith("data:") ? "[Local Device Image Attached]" : blogFormData.coverImage}
                        onChange={(e) => setBlogFormData({ ...blogFormData, coverImage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                      />
                      {blogFormData.coverImage && (
                        <button
                          type="button"
                          onClick={() => setBlogFormData({ ...blogFormData, coverImage: "" })}
                          className="px-2.5 py-2 rounded-xl neu-raised-sm text-[10px] font-mono text-rose-400 hover:text-rose-300 shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Free Preset Photo Quick Selection */}
                  <div>
                    <span className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1.5">
                      Quick Pick Free Royalty-Free Stock Photos:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { label: "Strategy", url: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1000&q=80" },
                        { label: "Socials", url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1000&q=80" },
                        { label: "Leaders", url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1000&q=80" },
                        { label: "Accra Team", url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80" },
                        { label: "Boutique", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80" },
                        { label: "Analytics", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1000&q=80" }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setBlogFormData({ ...blogFormData, coverImage: preset.url })}
                          className={`group relative h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                            blogFormData.coverImage === preset.url
                              ? "border-[#B08D57] ring-2 ring-[#B08D57]/40"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-1">
                            <span className="text-[9px] font-mono text-white font-bold truncate">{preset.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Preview */}
                  {blogFormData.coverImage && (
                    <div className="mt-2 relative h-32 rounded-xl overflow-hidden neu-pressed">
                      <img src={blogFormData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-[#B08D57]">
                        Live Cover Preview
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                    Excerpt / Summary Hook
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Short summary displayed on post cards..."
                    value={blogFormData.excerpt}
                    onChange={(e) => setBlogFormData({ ...blogFormData, excerpt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase">
                      Article Body Content (Supports Markdown & Local Photos)
                    </label>

                    {/* Write / Live Preview Toggle */}
                    <div className="flex items-center space-x-1 p-1 rounded-xl neu-pressed bg-[#111115]">
                      <button
                        type="button"
                        onClick={() => setEditorMode("write")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          editorMode === "write"
                            ? "bg-[#B08D57] text-[#111115]"
                            : "text-[#8A8A93] hover:text-[#F2F0EB]"
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Write Editor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode("preview")}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                          editorMode === "preview"
                            ? "bg-[#B08D57] text-[#111115]"
                            : "text-[#8A8A93] hover:text-[#F2F0EB]"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Live Reader Preview</span>
                      </button>
                    </div>
                  </div>

                  {editorMode === "write" ? (
                    <div className="space-y-2">
                      {/* Rich Formatting Toolbar */}
                      <div className="p-2 rounded-xl neu-pressed bg-[#111115] flex flex-wrap items-center gap-1.5 border border-[#B08D57]/20">
                        <span className="text-[9px] font-mono text-[#8A8A93] uppercase px-1 font-bold">
                          Format:
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => insertFormatting("## ", "", "Section Heading")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Insert Section Heading"
                        >
                          <Heading1 className="w-3 h-3 text-[#B08D57]" />
                          <span>H2 Heading</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("### ", "", "Subheading Title")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Insert Subheading"
                        >
                          <Heading2 className="w-3 h-3 text-[#B08D57]" />
                          <span>H3 Subheading</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("**", "**", "bold text")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Bold Text"
                        >
                          <Bold className="w-3 h-3 text-[#B08D57]" />
                          <span>Bold</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("*", "*", "italic text")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Italic Text"
                        >
                          <Italic className="w-3 h-3 text-[#B08D57]" />
                          <span>Italic</span>
                        </button>

                        <button
                          type="button"
                          onClick={insertLink}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Insert Link"
                        >
                          <ExternalLink className="w-3 h-3 text-[#B08D57]" />
                          <span>Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("> ", "", "Important insight or quote here...")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#B08D57] flex items-center space-x-1 border border-[#B08D57]/30 bg-[#B08D57]/10"
                          title="Insert Callout / Quote Box"
                        >
                          <Quote className="w-3 h-3 text-[#B08D57]" />
                          <span>Callout Box</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("- ", "", "Bullet point item")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Bullet List"
                        >
                          <List className="w-3 h-3 text-[#B08D57]" />
                          <span>Bullet List</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => insertFormatting("1. ", "", "First step item")}
                          className="px-2 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#F2F0EB] flex items-center space-x-1 border border-white/5"
                          title="Numbered List"
                        >
                          <ListOrdered className="w-3 h-3 text-[#B08D57]" />
                          <span>Numbered List</span>
                        </button>

                        <label className="ml-auto inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg neu-raised-sm hover:neu-pressed text-[10px] font-mono text-[#B08D57] cursor-pointer border border-[#B08D57]/30 bg-[#B08D57]/10 font-bold">
                          <Upload className="w-3 h-3 text-[#B08D57]" />
                          <span>{uploadingImage === "body" ? "Uploading..." : "+ Insert Local Photo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBodyFileUpload}
                            disabled={uploadingImage !== null}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <textarea
                        rows={9}
                        required
                        placeholder="Write your article here using Markdown or toolbar controls...\n\n## Section Title\n\n**Bold highlight** or *italic emphasis*...\n\n> Key callout quote box..."
                        value={blogFormData.contentRaw}
                        onChange={(e) => setBlogFormData({ ...blogFormData, contentRaw: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57] font-sans leading-relaxed"
                      />
                      <span className="block text-[10px] font-mono text-[#8A8A93]">
                        Tip: Click any toolbar button above to quickly insert formatted Headings, Callouts, Bold text, Links, Lists, or Local Photos. Click "Live Reader Preview" to inspect!
                      </span>
                    </div>
                  ) : (
                    /* Live Preview Mode */
                    <div className="p-5 rounded-2xl neu-pressed bg-[#111115] border border-[#B08D57]/20 min-h-[250px] max-h-[400px] overflow-y-auto space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[10px] font-mono text-[#B08D57]">
                        <span className="font-bold flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Live Reader Formatting Preview</span>
                        </span>
                        <span className="text-[#8A8A93]">How readers will see this post</span>
                      </div>

                      {blogFormData.contentRaw.trim() ? (
                        <div className="text-xs sm:text-sm text-[#F2F0EB]/90 space-y-4 font-sans leading-relaxed">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => (
                                <h2 className="font-display text-lg font-bold text-[#F2F0EB] mt-4 mb-2 pb-1 border-b border-[#B08D57]/30 flex items-center gap-1.5">
                                  <span className="w-1.5 h-4 bg-[#B08D57] rounded-full inline-block" />
                                  <span>{children}</span>
                                </h2>
                              ),
                              h2: ({ children }) => (
                                <h3 className="font-display text-base font-bold text-[#F2F0EB] mt-4 mb-2 flex items-center gap-1">
                                  <span className="text-[#B08D57] font-mono">#</span>
                                  <span>{children}</span>
                                </h3>
                              ),
                              h3: ({ children }) => (
                                <h4 className="font-display text-sm font-bold text-[#B08D57] mt-3 mb-1">
                                  {children}
                                </h4>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="my-3 p-3.5 rounded-xl neu-pressed border-l-4 border-[#B08D57] bg-[#15151A] italic text-xs text-[#F2F0EB]">
                                  <div className="text-[9px] font-mono text-[#B08D57] uppercase font-bold not-italic mb-1 flex items-center space-x-1">
                                    <Quote className="w-3 h-3" />
                                    <span>Callout Box</span>
                                  </div>
                                  {children}
                                </blockquote>
                              ),
                              ul: ({ children }) => (
                                <ul className="my-2 space-y-1.5 pl-2">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="my-2 space-y-1.5 pl-2 list-decimal list-inside text-[#F2F0EB]/90">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="flex items-start space-x-2 text-xs text-[#F2F0EB]/90">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57] mt-1.5 shrink-0" />
                                  <span>{children}</span>
                                </li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-[#F2F0EB] bg-[#B08D57]/20 px-1 py-0.5 rounded text-[#B08D57]">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-[#E0D8C8]">{children}</em>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#C5A065] underline underline-offset-2 hover:text-[#F2F0EB]"
                                >
                                  {children}
                                </a>
                              ),
                              img: ({ src, alt }) => (
                                <div className="my-3 rounded-xl overflow-hidden neu-pressed border border-white/5">
                                  <img src={src} alt={alt || "Article photo"} className="w-full h-auto max-h-[300px] object-cover" />
                                </div>
                              )
                            }}
                          >
                            {blogFormData.contentRaw}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-xs font-mono text-[#8A8A93] italic py-8 text-center">
                          No content written yet. Switch to "Write Editor" to start typing!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingBlog(false)}
                    className="px-4 py-2 rounded-xl neu-raised-sm text-xs font-mono text-[#8A8A93]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="neu-gold-filled px-6 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Publish Article</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blogPosts.map((post) => (
              <div key={post.id} className="p-5 rounded-2xl neu-raised space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  {/* Article Thumbnail Preview */}
                  {post.coverImage && (
                    <div className="w-full h-28 rounded-xl overflow-hidden neu-pressed mb-2">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="px-2.5 py-0.5 rounded-full neu-pressed text-[#B08D57] font-semibold">
                      {post.category}
                    </span>
                    <span className="text-[#8A8A93]">{post.date} • {post.readTime}</span>
                  </div>

                  <h3 className="font-display font-bold text-base text-[#F2F0EB] leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#8A8A93] line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                {deletingPostId === post.id ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <p className="font-semibold font-mono text-[11px] text-rose-300">
                      Delete "{post.title}" permanently?
                    </p>
                    <div className="flex items-center space-x-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setDeletingPostId(null)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteBlogPost(post.id);
                          setDeletingPostId(null);
                          showNotification("Article deleted successfully");
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold cursor-pointer shadow-sm"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-[11px] text-[#8A8A93]">By {post.author.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditBlog(post)}
                        className="p-2 rounded-lg neu-pressed text-[#B08D57] hover:text-[#F2F0EB] cursor-pointer"
                        title="Edit article"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingPostId(post.id)}
                        className="p-2 rounded-lg neu-pressed text-rose-400 hover:text-rose-300 cursor-pointer"
                        title="Delete article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AGENCY CONTACT & ADDRESS */}
      {activeTab === "agency" && (
        <div className="p-6 sm:p-8 rounded-3xl neu-raised space-y-6 max-w-3xl">
          <div>
            <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Agency Contact & Address Information</h2>
            <p className="text-xs text-[#8A8A93]">This details appear in headers, footers, and contact links across the public agency site.</p>
          </div>

          <form onSubmit={handleSaveAgencyInfo} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                Agency Name
              </label>
              <input
                type="text"
                required
                value={agencyFormData.name}
                onChange={(e) => setAgencyFormData({ ...agencyFormData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1 flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-[#B08D57]" />
                  <span>Physical Address / Office Location</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Konongo Low cost"
                  value={agencyFormData.address}
                  onChange={(e) => setAgencyFormData({ ...agencyFormData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1 flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-[#B08D57]" />
                  <span>WhatsApp & Phone Call Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+233235337886"
                  value={agencyFormData.whatsapp}
                  onChange={(e) => setAgencyFormData({ ...agencyFormData, whatsapp: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1 flex items-center space-x-1">
                <Mail className="w-3 h-3 text-[#B08D57]" />
                <span>Primary Agency Email Address</span>
              </label>
              <input
                type="email"
                required
                placeholder="oseikofi0235@gmail.com"
                value={agencyFormData.email}
                onChange={(e) => setAgencyFormData({ ...agencyFormData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                Homepage Hero Headline
              </label>
              <input
                type="text"
                required
                value={agencyFormData.heroTitle}
                onChange={(e) => setAgencyFormData({ ...agencyFormData, heroTitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                Homepage Hero Subtitle / Pitch
              </label>
              <textarea
                rows={3}
                required
                value={agencyFormData.heroSubtitle}
                onChange={(e) => setAgencyFormData({ ...agencyFormData, heroSubtitle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>

            <button
              type="submit"
              className="neu-gold-filled px-6 py-3 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Agency Details</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING PACKAGES */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Services & Package Prices</h2>
              <p className="text-xs text-[#8A8A93]">Manage packages shown on the homepage pricing grid (Highest tier set to 5000+ GH₵).</p>
            </div>
            <button
              onClick={openNewServiceForm}
              className="neu-gold-filled px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
          </div>

          {/* Service Modal / Form */}
          {isAddingService && (
            <div className="p-6 rounded-3xl neu-raised space-y-4 border border-[#B08D57]/30 bg-[#15151A]">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-sm font-bold font-display text-[#B08D57]">
                  {editingService ? "Edit Service Package" : "Create New Package"}
                </h3>
                <button
                  onClick={() => setIsAddingService(false)}
                  className="p-1 rounded-lg text-[#8A8A93] hover:text-[#F2F0EB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Package Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Starter Ignition Package"
                      value={serviceFormData.title}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Tier Badge / Subtitle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tier 1 • Essential"
                      value={serviceFormData.tier}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, tier: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      GHS Price Amount
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="GH₵ 5,000+"
                      value={serviceFormData.ghsPrice}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, ghsPrice: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                      Billing Period
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="per month, One-time"
                      value={serviceFormData.period}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, period: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-5">
                    <input
                      type="checkbox"
                      id="featured-check"
                      checked={serviceFormData.featured}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, featured: e.target.checked })}
                      className="w-4 h-4 accent-[#B08D57] rounded cursor-pointer"
                    />
                    <label htmlFor="featured-check" className="text-xs font-mono text-[#F2F0EB] cursor-pointer">
                      Highlight as Featured
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                    Package Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={serviceFormData.desc}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, desc: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8A8A93] uppercase mb-1">
                    Bullet Features (One per line)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Feature 1\nFeature 2\nFeature 3"
                    value={serviceFormData.featuresRaw}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, featuresRaw: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] outline-none focus:ring-1 focus:ring-[#B08D57]"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingService(false)}
                    className="px-4 py-2 rounded-xl neu-raised-sm text-xs font-mono text-[#8A8A93]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="neu-gold-filled px-6 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Service Package</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Service package grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <div 
                key={svc.id} 
                className={`p-6 rounded-3xl space-y-4 flex flex-col justify-between ${
                  svc.featured ? "neu-raised border border-[#B08D57]/40 relative" : "neu-pressed"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#B08D57] font-bold">
                      {svc.tier}
                    </span>
                    {svc.featured && (
                      <span className="text-[9px] font-mono bg-[#B08D57] text-[#15151A] font-bold px-2 py-0.5 rounded-full">
                        POPULAR
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-lg text-[#F2F0EB]">
                    {svc.title}
                  </h3>

                  <div className="pt-1">
                    <span className="font-display text-2xl font-bold text-[#F2F0EB]">
                      {svc.ghsPrice}
                    </span>
                    <span className="text-xs text-[#8A8A93] font-mono ml-1.5">
                      / {svc.period}
                    </span>
                  </div>

                  <p className="text-xs text-[#8A8A93] leading-relaxed">
                    {svc.desc}
                  </p>

                  <ul className="space-y-1.5 pt-2 text-xs text-[#F2F0EB]/80">
                    {svc.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Check className="w-3.5 h-3.5 text-[#B08D57] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {deletingServiceId === svc.id ? (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs space-y-2.5 animate-in fade-in duration-150">
                    <p className="font-semibold font-mono text-[11px] text-rose-300">
                      Delete package "{svc.title}"?
                    </p>
                    <div className="flex items-center space-x-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setDeletingServiceId(null)}
                        className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#F2F0EB] font-mono text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteService(svc.id);
                          setDeletingServiceId(null);
                          showNotification("Package deleted successfully");
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold cursor-pointer shadow-sm"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => startEditService(svc)}
                      className="p-2 rounded-lg neu-raised-sm text-[#B08D57] hover:text-[#F2F0EB] cursor-pointer"
                      title="Edit package"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingServiceId(svc.id)}
                      className="p-2 rounded-lg neu-raised-sm text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Delete package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLIENT BRANDS SHOWCASE */}
      {activeTab === "brands" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold font-display text-[#F2F0EB]">Brands We've Worked With</h2>
                <span className="text-[10px] font-mono text-[#B08D57] bg-[#B08D57]/10 px-2.5 py-0.5 rounded-full border border-[#B08D57]/20">
                  Homepage Showcase
                </span>
              </div>
              <p className="text-xs text-[#8A8A93] mt-0.5">
                Manage partner logos, brand case studies, deliverables, and performance metrics displayed on the public landing page.
              </p>
            </div>

            <button
              onClick={openNewBrandForm}
              className="neu-gold-filled px-4 py-2.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 shrink-0 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Client Brand</span>
            </button>
          </div>

          {/* Add / Edit Brand Form Modal */}
          {isAddingBrand && (
            <div className="p-6 sm:p-8 rounded-3xl neu-raised-lg border border-[#B08D57]/40 space-y-6 bg-[#15151A] animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#B08D57]" />
                  <h3 className="font-display font-bold text-base text-[#F2F0EB]">
                    {editingBrand ? `Edit Brand: ${editingBrand.name}` : "Add New Client Brand"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingBrand(false)}
                  className="p-1.5 rounded-lg neu-pressed text-[#8A8A93] hover:text-[#F2F0EB] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBrand} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                      placeholder="e.g., nkabomworldd"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm focus:outline-none text-[#F2F0EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Industry / Category *</label>
                    <input
                      type="text"
                      required
                      value={brandFormData.industry}
                      onChange={(e) => setBrandFormData({ ...brandFormData, industry: e.target.value })}
                      placeholder="e.g., Streetwear & Cultural Collective"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm focus:outline-none text-[#F2F0EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Social Handle</label>
                    <input
                      type="text"
                      value={brandFormData.socialHandle}
                      onChange={(e) => setBrandFormData({ ...brandFormData, socialHandle: e.target.value })}
                      placeholder="@nkabomworldd"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm focus:outline-none text-[#F2F0EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Live Website URL</label>
                    <input
                      type="url"
                      value={brandFormData.website}
                      onChange={(e) => setBrandFormData({ ...brandFormData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm font-mono focus:outline-none text-[#F2F0EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Accent Hex Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={brandFormData.accentColor}
                        onChange={(e) => setBrandFormData({ ...brandFormData, accentColor: e.target.value })}
                        className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={brandFormData.accentColor}
                        onChange={(e) => setBrandFormData({ ...brandFormData, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl neu-pressed bg-transparent text-xs font-mono text-[#F2F0EB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Logo Asset URL</label>
                    <input
                      type="text"
                      value={brandFormData.logoUrl}
                      onChange={(e) => setBrandFormData({ ...brandFormData, logoUrl: e.target.value })}
                      placeholder="/logos/brand-name.svg"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-xs font-mono focus:outline-none text-[#F2F0EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8A8A93] mb-1">Tagline / Mission</label>
                  <input
                    type="text"
                    value={brandFormData.tagline}
                    onChange={(e) => setBrandFormData({ ...brandFormData, tagline: e.target.value })}
                    placeholder="e.g., Authentic streetwear uniting culture and community"
                    className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm focus:outline-none text-[#F2F0EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#8A8A93] mb-1">Overview / Strategic Case Study</label>
                  <textarea
                    rows={3}
                    value={brandFormData.overview}
                    onChange={(e) => setBrandFormData({ ...brandFormData, overview: e.target.value })}
                    placeholder="Comprehensive description of what NOK Social built and achieved for this brand..."
                    className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-sm focus:outline-none text-[#F2F0EB] resize-none"
                  />
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-[#8A8A93]">Key Results / Metrics (Up to 3)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl neu-pressed space-y-2">
                      <input
                        type="text"
                        value={brandFormData.metric1Val}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric1Val: e.target.value })}
                        placeholder="+140%"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-xs font-mono font-bold text-[#F2F0EB]"
                      />
                      <input
                        type="text"
                        value={brandFormData.metric1Label}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric1Label: e.target.value })}
                        placeholder="Community Growth"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-[10px] text-zinc-300"
                      />
                    </div>

                    <div className="p-3 rounded-xl neu-pressed space-y-2">
                      <input
                        type="text"
                        value={brandFormData.metric2Val}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric2Val: e.target.value })}
                        placeholder="3.4x"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-xs font-mono font-bold text-[#F2F0EB]"
                      />
                      <input
                        type="text"
                        value={brandFormData.metric2Label}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric2Label: e.target.value })}
                        placeholder="Drop ROAS"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-[10px] text-zinc-300"
                      />
                    </div>

                    <div className="p-3 rounded-xl neu-pressed space-y-2">
                      <input
                        type="text"
                        value={brandFormData.metric3Val}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric3Val: e.target.value })}
                        placeholder="100%"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-xs font-mono font-bold text-[#F2F0EB]"
                      />
                      <input
                        type="text"
                        value={brandFormData.metric3Label}
                        onChange={(e) => setBrandFormData({ ...brandFormData, metric3Label: e.target.value })}
                        placeholder="Pipeline Automation"
                        className="w-full px-2 py-1 rounded bg-[#15151A] text-[10px] text-zinc-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Core Services Provided (One per line)</label>
                    <textarea
                      rows={3}
                      value={brandFormData.servicesRaw}
                      onChange={(e) => setBrandFormData({ ...brandFormData, servicesRaw: e.target.value })}
                      placeholder="Brand Positioning&#10;Social Architecture&#10;Content Engine"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-xs font-mono focus:outline-none text-[#F2F0EB] resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#8A8A93] mb-1">Deliverables Produced (One per line)</label>
                    <textarea
                      rows={3}
                      value={brandFormData.deliverablesRaw}
                      onChange={(e) => setBrandFormData({ ...brandFormData, deliverablesRaw: e.target.value })}
                      placeholder="Streetwear Visuals&#10;Campaign Playbooks&#10;Drop Sequence"
                      className="w-full px-4 py-2.5 rounded-xl neu-pressed bg-transparent text-xs font-mono focus:outline-none text-[#F2F0EB] resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsAddingBrand(false)}
                    className="neu-raised-sm px-4 py-2 rounded-xl text-xs font-mono text-[#8A8A93] hover:text-[#F2F0EB] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="neu-gold-filled px-5 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Brand Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Client Brands Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clientBrands.map((brand) => (
              <div
                key={brand.id}
                className="p-6 rounded-2xl neu-raised flex flex-col justify-between space-y-4 relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded neu-pressed"
                      style={{ color: brand.accentColor }}
                    >
                      {brand.industry}
                    </span>
                    {brand.socialHandle && (
                      <span className="text-[10px] font-mono text-zinc-300">
                        {brand.socialHandle}
                      </span>
                    )}
                  </div>

                  {/* Logo preview */}
                  <div className="h-20 rounded-xl neu-pressed flex items-center justify-center p-3 bg-[#111115]">
                    {brand.slug.includes("nkabom") ? (
                      <img src="/logos/nkabomworldd.svg" alt="nkabomworldd" className="h-14 w-14 object-contain bg-white rounded-lg p-1" referrerPolicy="no-referrer" />
                    ) : brand.slug.includes("standout") ? (
                      <img src="/logos/standout-clothing.svg" alt="standout" className="h-12 w-36 object-contain" referrerPolicy="no-referrer" />
                    ) : brand.slug.includes("vividel") ? (
                      <img src="/logos/vividel-inc.svg" alt="vividel" className="h-12 w-36 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-8 h-8 text-[#C5A065]" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-base font-bold text-[#F2F0EB]">
                      {brand.name}
                    </h3>
                    <p className="text-xs text-[#8A8A93] mt-1 line-clamp-2">
                      {brand.tagline}
                    </p>
                    {brand.website && (
                      <div className="mt-1.5 flex items-center space-x-1.5 text-[10px] font-mono text-[#B08D57]">
                        <Globe className="w-3 h-3" />
                        <span className="truncate">{brand.website}</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics preview */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {brand.metrics.map((m, i) => (
                      <div key={i} className="p-1.5 rounded-lg neu-pressed text-center">
                        <div className="text-xs font-bold font-mono" style={{ color: brand.accentColor }}>{m.value}</div>
                        <div className="text-[8px] text-zinc-300 truncate">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {deletingBrandId === brand.id ? (
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="text-[11px] font-mono text-rose-400">Confirm removal from showcase?</div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDeletingBrandId(null)}
                        className="px-3 py-1 rounded-lg bg-white/10 text-xs text-[#F2F0EB] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteClientBrand(brand.id);
                          setDeletingBrandId(null);
                          showNotification("Brand removed from showcase");
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => startEditBrand(brand)}
                      className="p-2 rounded-lg neu-raised-sm text-[#B08D57] hover:text-[#F2F0EB] cursor-pointer"
                      title="Edit brand showcase"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingBrandId(brand.id)}
                      className="p-2 rounded-lg neu-raised-sm text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Delete brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
