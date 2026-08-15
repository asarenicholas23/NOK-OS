import React, { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Copy, 
  Check, 
  Palette, 
  Sparkles, 
  Layout, 
  Mail, 
  Video, 
  Smartphone, 
  Monitor, 
  FileText, 
  Presentation, 
  Send, 
  Eye, 
  Inbox, 
  AlertCircle, 
  Clipboard,
  Sliders
} from "lucide-react";

interface ParsedItem {
  number: number;
  title: string;
  copy: string;
  design: string;
  instagramVersion?: string;
  linkedinVersion?: string;
  subjectLine?: string;
  previewText?: string;
  imageUrl?: string;
  imageSeed: string;
}

interface SlideDeckPreviewProps {
  brief: {
    title: string;
    objective: string;
    targetAudience: string;
    keyMessage: string;
    deliverables?: string;
    campaignId?: string;
    date?: string;
    sequencePosition?: string;
    proofPoint?: string;
    formatSpec?: string;
    contentOutline?: string;
    cta?: string;
    toneVisualRef?: string;
    successMetric?: string;
  };
  brandName?: string;
  brandColor?: string;
}

export const SlideDeckPreview: React.FC<SlideDeckPreviewProps> = ({ 
  brief, 
  brandName = "N.O.K Client", 
  brandColor = "violet" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideTheme, setSlideTheme] = useState<"dark-mesh" | "neon-fluid" | "tech-grid" | "editorial">("dark-mesh");
  const [slideLayout, setSlideLayout] = useState<"split" | "centered" | "split-reverse">("split");
  const [copiedItemIndex, setCopiedItemIndex] = useState<number | null>(null);
  const [activePlatformTab, setActivePlatformTab] = useState<"instagram" | "linkedin">("instagram");

  // Parse or dynamically infer the visual content format and details
  const parsedData = useMemo(() => {
    const outline = brief.contentOutline || "";
    const list: ParsedItem[] = [];
    
    // Categorize format based on format specification and title keywords
    const spec = (brief.formatSpec || "").toLowerCase();
    const titleLower = (brief.title || "").toLowerCase();
    const outlineLower = outline.toLowerCase();
    
    let formatType: "carousel" | "video" | "flier" | "email" = "carousel";
    if (spec.includes("carousel") || spec.includes("slide") || spec.includes("deck") || titleLower.includes("carousel") || outlineLower.includes("slide ")) {
      formatType = "carousel";
    } else if (spec.includes("video") || spec.includes("reel") || spec.includes("tiktok") || spec.includes("short") || spec.includes("youtube") || outlineLower.includes("scene ")) {
      formatType = "video";
    } else if (spec.includes("flier") || spec.includes("flyer") || spec.includes("poster") || spec.includes("print") || spec.includes("banner") || outlineLower.includes("section ") || outlineLower.includes("layout ")) {
      formatType = "flier";
    } else if (spec.includes("email") || spec.includes("newsletter") || spec.includes("mailer") || outlineLower.includes("subject line") || outlineLower.includes("preview text")) {
      formatType = "email";
    }

    // Try robust multi-line parser that parses slides/sections/scenes with markdown headers
    // Examples: "## Slide 1 — Hook", "Slide 2 — The Relatable Chaos", "## Scene 1 - Hook", "## Section 1 -"
    const sectionRegex = /(?:##\s+)?(?:Slide|Scene|Section|Card|Page|Frame)\s*(\d+)\s*(?:[-—–:|])?\s*([^\n]+)/gi;
    let match;
    const matches: any[] = [];
    
    sectionRegex.lastIndex = 0;
    while ((match = sectionRegex.exec(outline)) !== null) {
      matches.push({
        index: match.index,
        number: parseInt(match[1]),
        title: match[2].trim(),
        length: match[0].length
      });
    }

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const current = matches[i];
        const startPos = current.index + current.length;
        const endPos = (i + 1 < matches.length) ? matches[i + 1].index : outline.length;
        const rawContent = outline.substring(startPos, endPos).trim();

        // Sub-key extraction
        const copyRegex = /(?:\*\*Copy:\*\*|Copy:|\*\*Audio:\*\*|Audio:|\*\*Audio\s*\(Voiceover\/Narration\):\*\*)\s*([\s\S]*?)(?=(?:\*\*Design:\*\*|Design:|\*\*Visual\s*Direction|\*\*Instagram|\*\*LinkedIn|\*\*Subject|\*\*Preview|$))/i;
        const designRegex = /(?:\*\*Design:\*\*|Design:|\*\*Visual\s*Direction(?:\s*\(Design\))?:\*\*|Visual Direction:|\*\*Visual\s*Direction:\*\*)\s*([\s\S]*?)(?=(?:\*\*Copy:\*\*|Copy:|\*\*Audio|\*\*Instagram|\*\*LinkedIn|\*\*Subject|\*\*Preview|$))/i;
        const instagramRegex = /(?:\*\*Instagram\s*(?:version)?:\*\*|Instagram\s*(?:version)?:)\s*([\s\S]*?)(?=(?:\*\*Copy:\*\*|Copy:|\*\*Design:\*\*|Design:|\*\*LinkedIn|\*\*Audio|\*\*Visual|$))/i;
        const linkedinRegex = /(?:\*\*LinkedIn\s*(?:version)?(?:\s*\(static\s*swap\))?:\*\*|LinkedIn\s*(?:version)?:)\s*([\s\S]*?)(?=(?:\*\*Copy:\*\*|Copy:|\*\*Design:\*\*|Design:|\*\*Instagram|\*\*Audio|\*\*Visual|$))/i;
        const subjectRegex = /(?:\*\*Subject\s*Line:\*\*|Subject Line:|\*\*Subject:\*\*)\s*([\s\S]*?)(?=(?:\*\*Copy:\*\*|Copy:|\*\*Design:\*\*|Design:|\*\*Preview|$))/i;
        const previewRegex = /(?:\*\*Preview\s*Text:\*\*|Preview Text:|\*\*Preview:\*\*)\s*([\s\S]*?)(?=(?:\*\*Copy:\*\*|Copy:|\*\*Design:\*\*|Design:|\*\*Subject|$))/i;

        const copyM = rawContent.match(copyRegex);
        const designM = rawContent.match(designRegex);
        const instaM = rawContent.match(instagramRegex);
        const linkM = rawContent.match(linkedinRegex);
        const subM = rawContent.match(subjectRegex);
        const prevM = rawContent.match(previewRegex);

        const cleanText = (txt: string) => {
          if (!txt) return "";
          return txt
            .trim()
            .replace(/^>\s*/gm, "") // remove blockquote angle brackets
            .replace(/^"|"$/g, "") // remove outer quote marks
            .replace(/^\*'|\'\*$/g, "")
            .trim();
        };

        const copy = copyM ? cleanText(copyM[1]) : "";
        const design = designM ? cleanText(designM[1]) : "";
        const instagramVersion = instaM ? cleanText(instaM[1]) : "";
        const linkedinVersion = linkM ? cleanText(linkM[1]) : "";
        const subjectLine = subM ? cleanText(subM[1]) : "";
        const previewText = prevM ? cleanText(prevM[1]) : "";

        let finalCopy = copy;
        let finalDesign = design;
        if (!copy && !design && rawContent) {
          // If unstructured, parse by simple splitting
          const splitted = rawContent.split(/\n\s*\n/);
          if (splitted.length >= 2) {
            finalCopy = cleanText(splitted[0]);
            finalDesign = cleanText(splitted.slice(1).join("\n\n"));
          } else {
            finalCopy = cleanText(rawContent);
            finalDesign = "Follow active brand guides and design aesthetic standard rules.";
          }
        }

        list.push({
          number: current.number,
          title: current.title,
          copy: finalCopy,
          design: finalDesign || "Follow standard visual structure outlines.",
          instagramVersion: instagramVersion || undefined,
          linkedinVersion: linkedinVersion || undefined,
          subjectLine: subjectLine || undefined,
          previewText: previewText || undefined,
          imageSeed: `${brief.campaignId || "nok"}-item-${current.number}`
        });
      }
    }

    // Default High-Fidelity Fallbacks if parsing returned empty or outline was generic
    if (list.length === 0) {
      if (formatType === "video") {
        list.push(
          {
            number: 1,
            title: "Hook",
            copy: "Founder. Marketer. Analyst. Support team. All by 9am.",
            design: "Bold, oversized headline text, centered, on a solid brand-color background (no imagery yet — let the words carry it). Small subhead underneath in lighter weight: 'Sound familiar?' keep it text-only and punchy.",
            instagramVersion: "Native video slide (screen-recorded MP4) showing clean automation flow in NOK OS.",
            linkedinVersion: "Clean high-contrast screenshot of the NOK OS Brief dashboard state with annotated callout arrow.",
            imageSeed: "video-1"
          },
          {
            number: 2,
            title: "The Relatable Chaos",
            copy: "Between replying to DMs, tracking sales, posting content, and actually doing the work you started this for — something always slips.",
            design: "Break the single big-text pattern — use 4 small icons in a loose scattered/cluttered arrangement (chat bubble, chart, calendar, checklist) representing overwhelm.",
            imageSeed: "video-2"
          },
          {
            number: 3,
            title: "The Reframe & Resolve",
            copy: "What if the marketing and data side just... ran itself? Tell us the one thing eating your week, we will show you automation.",
            design: "Hard visual reset — lots of negative space, single centered line of text. Solid tranquil transition to brand tones.",
            imageSeed: "video-3"
          }
        );
      } else if (formatType === "flier") {
        list.push(
          {
            number: 1,
            title: "Header Brand Anchor",
            copy: `${brandName.toUpperCase()} — Core Solutions`,
            design: "Clean minimalist border layout. High-contrast typography with modern tracking space, making the logo pop in the upper left corner.",
            imageSeed: "flier-header"
          },
          {
            number: 2,
            title: "Core Strategic Reframe",
            copy: brief.keyMessage || "What if the marketing and data side just... ran itself?",
            design: "Hero upper middle section. Clean solid canvas with soft ambient radial neon glow behind typography. Spacious margins.",
            imageSeed: "flier-hero"
          },
          {
            number: 3,
            title: "The CTA Playback",
            copy: brief.cta || "Scan the QR code to automate your workspace workflow sandbox.",
            design: "Solid high-contrast visual rectangular card at the bottom. Simulated wireframe QR box on the right and literal CTA text on the left.",
            imageSeed: "flier-cta"
          }
        );
      } else if (formatType === "email") {
        list.push(
          {
            number: 1,
            title: "Inbox Header",
            copy: `Subject: Let's automate the relatable chaos\nPreview: Between replying to DMs, tracking sales, and actual work...`,
            design: "Render premium clean headers. Custom dark-mode eye-safe email container blocks.",
            subjectLine: "Let's automate the relatable chaos",
            previewText: "Between replying to DMs, tracking sales, and actual work...",
            imageSeed: "email-meta"
          },
          {
            number: 2,
            title: "Editorial Narrative",
            copy: `Hi [Founder],\n\nBetween replying to DMs, tracking sales, posting content, and actually doing the work you started this for — something always slips.\n\nWhat if it just... ran itself?`,
            design: "Editorial spacing. Left-aligned serif typography with soft cream background canvas, establishing a calm feeling.",
            imageSeed: "email-body"
          },
          {
            number: 3,
            title: "Action Card CTA",
            copy: brief.cta || "Click here to share the one task eating your week, and we'll build its automated system.",
            design: "Shaded background block inside email thread. High-contrast centered button in brand color.",
            imageSeed: "email-action"
          }
        );
      } else {
        // Carousel Slides (Standard spec format)
        list.push(
          {
            number: 1,
            title: "Hook",
            copy: "Founder. Marketer. Analyst. Support team. All by 9am.",
            design: "Bold, oversized headline text, centered, on a solid brand-color background (no imagery yet — let the words carry it). Small subhead underneath in lighter weight: 'Sound familiar?' keep it text-only and punchy.",
            imageSeed: "slide-1"
          },
          {
            number: 2,
            title: "The Relatable Chaos",
            copy: "Between replying to DMs, tracking sales, posting content, and actually doing the work you started this for — something always slips.",
            design: "Break the single big-text pattern — use 4 small icons in a loose scattered/cluttered arrangement (chat bubble, chart, calendar, checklist) representing overwhelm.",
            imageSeed: "slide-2"
          },
          {
            number: 3,
            title: "The Reframe",
            copy: "What if the marketing and data side just... ran itself?",
            design: "Hard visual reset — lots of white/negative space, single centered line of text.",
            imageSeed: "slide-3"
          },
          {
            number: 4,
            title: "The Demo",
            copy: "This is NOK OS — the system running our own marketing right now.",
            design: "Real product screenshot, un-cropped and legible — resist the urge to over-stylize this one; authenticity is the point.",
            instagramVersion: "Native video slide (your screen-recorded MP4) showing one clean flow in NOK OS.",
            linkedinVersion: "A clean screenshot of the same moment. Add a small annotated callout arrow reading 'AI-generated, human-approved'.",
            imageSeed: "slide-4"
          },
          {
            number: 5,
            title: "The Payoff",
            copy: "That's hours back — for the actual work only you can do.",
            design: "Bright focus-point highlighting per your brand tone — one striking visual anchor (bold '10 HOURS' as oversized type) with everything else minimal.",
            imageSeed: "slide-5"
          },
          {
            number: 6,
            title: "The Bridge",
            copy: "This is the same kind of system we build — for founders like you.",
            design: "Introduce your logo/wordmark more prominently here for the first time. Elegant editorial alignment.",
            imageSeed: "slide-6"
          },
          {
            number: 7,
            title: "CTA",
            copy: "Tell us the one thing eating your week. We'll show you what automating it could look like.",
            design: "Clear, simple closing card — logo, one-line CTA. Single call-to-action button only.",
            imageSeed: "slide-7"
          }
        );
      }
    }

    // Attach premium illustrations with dynamic image signature keys
    const finalItems = list.map((item, idx) => {
      const imagesList = [
        "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=500&q=80", // premium glass neon geometry
        "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=500&q=80", // moody fog
        "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=500&q=80", // cyber matrix structure
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80", // glass dashboard UI elements
        "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=500&q=80", // glowing neon arrow
        "https://images.unsplash.com/photo-1618005158179-023f9ec367eb?auto=format&fit=crop&w=500&q=80", // minimal mesh lines
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=500&q=80"  // abstract paint splash
      ];
      
      const imageUrl = imagesList[idx % imagesList.length];
      return {
        ...item,
        imageUrl
      };
    });

    return {
      formatType,
      items: finalItems
    };
  }, [brief, brandName]);

  const { formatType, items } = parsedData;
  const activeItem = items[currentIndex] || items[0];

  // Theme configuration for rendering slides
  const themeClasses = useMemo(() => {
    switch (slideTheme) {
      case "neon-fluid":
        return {
          wrapper: "bg-gradient-to-tr from-[#0c051a] via-[#160b2a] to-[#04020a] text-white border-violet-800/30",
          accentBadge: "bg-violet-500/10 text-violet-300 border-violet-500/20 font-mono",
          titleText: "text-violet-100 font-black tracking-tight",
          bodyText: "text-slate-200 font-sans",
          footerText: "text-slate-400 border-t border-violet-950 font-mono",
          gridLine: "border-violet-950/20"
        };
      case "tech-grid":
        return {
          wrapper: "bg-[#090a0f] text-emerald-400 border-emerald-950",
          accentBadge: "bg-emerald-500/5 text-emerald-400 border-emerald-500/20 font-mono uppercase tracking-widest",
          titleText: "text-slate-100 font-bold tracking-wider font-mono uppercase",
          bodyText: "text-slate-350 font-mono text-[11px] leading-relaxed",
          footerText: "text-slate-500 border-t border-emerald-950/40 font-mono",
          gridLine: "border-emerald-950/20"
        };
      case "editorial":
        return {
          wrapper: "bg-[#faf9f5] text-[#1e1e1c] border-stone-200",
          accentBadge: "bg-stone-100 text-stone-800 border-stone-200/60 font-serif italic",
          titleText: "text-stone-900 font-normal font-serif tracking-tight leading-snug",
          bodyText: "text-stone-700 leading-relaxed font-serif text-sm",
          footerText: "text-stone-500 border-t border-stone-200 font-serif italic",
          gridLine: "border-stone-200"
        };
      default: // dark-mesh
        return {
          wrapper: "bg-[#111113] text-slate-100 border-border",
          accentBadge: `bg-violet-500/10 text-violet-400 border-violet-500/15 font-mono`,
          titleText: "text-slate-100 font-bold tracking-tight",
          bodyText: "text-slate-300 font-sans",
          footerText: "text-slate-500 border-t border-slate-900 font-mono",
          gridLine: "border-slate-900/40"
        };
    }
  }, [slideTheme]);

  // Brand brand color theme mappings for rendering dynamic circles
  const getBrandGradientClass = () => {
    if (brandColor === "emerald") return "from-emerald-500/20 to-teal-500/0";
    if (brandColor === "rose") return "from-rose-500/20 to-pink-500/0";
    if (brandColor === "amber") return "from-amber-500/20 to-orange-500/0";
    return "from-violet-500/20 to-indigo-500/0";
  };

  const handleCopyClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedItemIndex(index);
    setTimeout(() => setCopiedItemIndex(null), 2000);
  };

  // Render Carousel Slide Deck Mode
  const renderCarouselMode = () => {
    if (!activeItem) return null;
    return (
      <div className="space-y-4">
        {/* Style Controllers */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-border">
          <div className="flex items-center space-x-2">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Theme Style:</span>
            
            <div className="flex bg-slate-950 p-0.5 rounded border border-border">
              {(["dark-mesh", "neon-fluid", "tech-grid", "editorial"] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSlideTheme(theme)}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded capitalize transition-all cursor-pointer ${
                    slideTheme === theme 
                      ? "bg-slate-850 text-slate-100 shadow-sm" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {theme.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <Layout className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold mr-1">Layout:</span>
            <div className="flex bg-slate-950 p-0.5 rounded border border-border">
              <button
                onClick={() => setSlideLayout("split")}
                className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded cursor-pointer ${
                  slideLayout === "split" ? "bg-slate-850 text-slate-200" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Split
              </button>
              <button
                onClick={() => setSlideLayout("centered")}
                className={`px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded cursor-pointer ${
                  slideLayout === "centered" ? "bg-slate-850 text-slate-200" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Center
              </button>
            </div>
          </div>
        </div>

        {/* Live Presentation Slide Card Frame */}
        <div className={`relative border rounded-xl overflow-hidden aspect-square flex flex-col justify-between p-6 md:p-8 transition-all duration-300 ${themeClasses.wrapper}`}>
          {/* Ambient Glowing spot */}
          {(slideTheme === "dark-mesh" || slideTheme === "neon-fluid") && (
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full filter blur-[60px] opacity-60 bg-gradient-to-b ${getBrandGradientClass()}`} />
          )}

          {/* Background grid lines */}
          {slideTheme === "tech-grid" && (
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1314_1px,transparent_1px),linear-gradient(to_bottom,#0c1314_1px,transparent_1px)] bg-[size:24px_24px] opacity-35 pointer-events-none" />
          )}

          {/* Header */}
          <div className="flex justify-between items-center z-10 border-b border-dashed border-border/10 pb-2">
            <span className={`text-[8px] md:text-[9px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full border ${themeClasses.accentBadge}`}>
              Slide {activeItem.number} — {activeItem.title}
            </span>

            <div className="text-[9px] font-mono opacity-60 flex items-center gap-1.5">
              <span>{brandName}</span>
              <span className="w-1 h-1 rounded-full bg-violet-400"></span>
              <span>{brief.campaignId || "NOK-CAR"}</span>
            </div>
          </div>

          {/* Slide Text Content Layout Canvas */}
          <div className="my-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-center z-10 w-full">
            <div className={`${
              slideLayout === "centered" 
                ? "md:col-span-12 text-center max-w-lg mx-auto" 
                : "md:col-span-7 text-left"
            } space-y-4`}>
              <h3 className={`text-base md:text-xl font-bold tracking-tight leading-tight ${themeClasses.titleText}`}>
                {activeItem.title}
              </h3>
              
              <div className={`text-xs md:text-sm font-medium leading-relaxed border-l-2 pl-3 py-1 border-violet-500/20 italic ${themeClasses.bodyText}`}>
                "{activeItem.copy}"
              </div>
            </div>

            {slideLayout !== "centered" && (
              <div className="md:col-span-5 flex justify-center">
                <div className="relative group/slide-img w-full max-w-[180px] aspect-square rounded-xl overflow-hidden border border-border/20 bg-slate-900 shadow-md transform hover:scale-[1.02] transition-transform">
                  <img 
                    src={activeItem.imageUrl} 
                    alt={activeItem.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover grayscale-[20%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[8px] font-mono text-slate-300 tracking-wider flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                      Slide asset #{activeItem.number}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer info bar */}
          <div className={`pt-4 flex justify-between items-center text-[9px] z-10 opacity-70 ${themeClasses.footerText}`}>
            <span>N.O.K Creative Partner</span>
            <span className="font-extrabold font-mono text-[10px]">SLIDE {activeItem.number} / {items.length}</span>
          </div>
        </div>

        {/* Copywriting & Technical Design Specs Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                Copywriting Text
              </span>
              <button
                onClick={() => handleCopyClipboard(activeItem.copy, currentIndex)}
                className="text-[9px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer bg-slate-950/40 border border-border/40 px-2 py-0.5 rounded"
              >
                {copiedItemIndex === currentIndex ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-200 bg-slate-950/60 p-3 rounded-lg border border-slate-900 font-sans leading-relaxed select-all">
              "{activeItem.copy}"
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layout className="w-3.5 h-3.5 text-violet-400" />
              Designer Visual Guidelines
            </span>
            <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-900 font-mono leading-normal text-[11px] h-[calc(100%-24px)] overflow-y-auto">
              {activeItem.design}
            </div>
          </div>
        </div>

        {/* Platform Swaps & Platform Versions if defined */}
        {(activeItem.instagramVersion || activeItem.linkedinVersion) && (
          <div className="bg-violet-950/5 border border-violet-850/20 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-violet-850/10 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase text-violet-400">
                Channel Asset Deliverable Variants
              </span>
              <div className="flex bg-slate-950 p-0.5 rounded border border-border">
                <button
                  onClick={() => setActivePlatformTab("instagram")}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer font-bold ${
                    activePlatformTab === "instagram" ? "bg-violet-600/20 text-violet-300" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Instagram (Video / Motion)
                </button>
                <button
                  onClick={() => setActivePlatformTab("linkedin")}
                  className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer font-bold ${
                    activePlatformTab === "linkedin" ? "bg-violet-600/20 text-violet-300" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  LinkedIn (Static Swap)
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-slate-950/30 p-2.5 rounded border border-slate-900">
              {activePlatformTab === "instagram" 
                ? (activeItem.instagramVersion || "Utilize direct high-fidelity MP4 animated flow preview based on the design mockup description.")
                : (activeItem.linkedinVersion || "Leverage clean direct screenshot framing of the Nok OS brief generation screen with focus annotation pointer.")
              }
            </p>
          </div>
        )}
      </div>
    );
  };

  // Render Video Scene Storyboard Mode
  const renderVideoMode = () => {
    return (
      <div className="space-y-4">
        {/* Storyboard Header Summary */}
        <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-border text-xs">
          <span className="font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Video className="w-4 h-4 text-rose-400" />
            Video Scene Timeline ({items.length} Scenes)
          </span>
          <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
            Aspect Ratio: {brief.formatSpec || "9:16 vertical video"}
          </span>
        </div>

        {/* Smartphone Playback Screen Mockup */}
        <div className="relative max-w-[280px] mx-auto aspect-[9/16] rounded-[36px] border-4 border-border bg-black overflow-hidden shadow-2xl flex flex-col justify-between p-4 pt-10 pb-6">
          {/* Phone Ear Piece bar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
            <div className="w-12 h-1 bg-slate-900 rounded-full" />
          </div>

          <div className="absolute inset-0 opacity-70 pointer-events-none">
            <img 
              src={activeItem?.imageUrl} 
              alt="Video Scene Background" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover blur-[2px] scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/90" />
          </div>

          {/* Upper Info */}
          <div className="flex justify-between items-center z-10 text-[9px] font-mono text-slate-400 px-2">
            <span>NOK VIDEO STUDIO</span>
            <span>0:05 / 0:15</span>
          </div>

          {/* Central Overlay Copy (Caption) */}
          <div className="my-auto z-10 text-center px-4 space-y-2">
            <span className="text-[10px] font-mono uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold shadow">
              Scene {activeItem?.number} — {activeItem?.title}
            </span>
            <p className="text-sm font-extrabold text-white leading-tight drop-shadow-md select-none">
              "{activeItem?.copy}"
            </p>
          </div>

          {/* Bottom Director Specs */}
          <div className="z-10 bg-black/70 border border-border/40 p-2.5 rounded-xl text-[10px] space-y-1 backdrop-blur-md">
            <span className="block font-mono text-[8px] uppercase text-rose-400 font-bold">📷 CAMERA & DESIGN DIRECTIVE:</span>
            <p className="text-slate-300 font-sans leading-tight leading-relaxed max-h-16 overflow-y-auto scrollbar-thin">
              {activeItem?.design}
            </p>
          </div>
        </div>

        {/* Script & Voiceover Panel */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
            Scene Script & Storyboard Actions
          </span>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <div 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#181116] border-rose-500/40 shadow-md" 
                      : "bg-slate-950/40 border-slate-900 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2">
                    <span className="text-xs font-mono font-bold text-rose-400">
                      SCENE #{item.number} — {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Duration: ~5s
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block mb-1">🎤 Audio / Voiceover Copy</span>
                      <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-900 leading-relaxed italic">
                        "{item.copy}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block mb-1">🎬 Visual Scene Direction</span>
                      <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-900 font-mono text-[11px] leading-relaxed">
                        {item.design}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Print / Digital Flier Blueprint Mode
  const renderFlierMode = () => {
    return (
      <div className="space-y-4">
        {/* Flier Summary */}
        <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-border text-xs">
          <span className="font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-400" />
            Flier Layout Architecture ({items.length} Blueprint Sections)
          </span>
          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
            Aspect Ratio: 4:5 Portrait Flier
          </span>
        </div>

        {/* Flier Vector Canvas Frame */}
        <div className="relative max-w-[340px] mx-auto aspect-[4/5] rounded-xl border border-border bg-[#faf9f5] overflow-hidden shadow-2xl p-6 flex flex-col justify-between text-slate-950 select-none">
          {/* Grid blueprint guidelines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e4de_1px,transparent_1px),linear-gradient(to_bottom,#e5e4de_1px,transparent_1px)] bg-[size:16px_16px] opacity-60 pointer-events-none" />
          
          {/* Printer Crop Trim Ticks */}
          <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-emerald-500/40" />
          <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-emerald-500/40" />
          <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-emerald-500/40" />
          <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-emerald-500/40" />

          {/* Section 1: Top Bar */}
          <div className={`p-2 border border-slate-200 rounded text-[9px] bg-slate-100/75 z-10 transition-all ${
            currentIndex === 0 ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200"
          }`} onClick={() => setCurrentIndex(0)}>
            <div className="flex justify-between items-center font-mono font-bold text-slate-600">
              <span>{brandName.toUpperCase()} — FLIER BLUEPRINT</span>
              <span>EST. 2026</span>
            </div>
          </div>

          {/* Section 2: Middle Hero Section */}
          <div className={`p-4 border rounded bg-slate-100/75 z-10 my-4 text-center space-y-2 transition-all ${
            currentIndex === 1 ? "border-emerald-500 ring-2 ring-emerald-500/15" : "border-slate-200"
          }`} onClick={() => setCurrentIndex(1)}>
            <span className="text-[8px] font-mono text-emerald-600 font-bold tracking-widest block uppercase">
              CAMPAIGN COOP MESSAGE
            </span>
            <h1 className="text-sm font-serif font-black tracking-tight text-slate-900 leading-snug">
              {items[1]?.copy || brief.keyMessage}
            </h1>
          </div>

          {/* Section 3: Bottom CTA Block */}
          <div className={`p-3 border rounded bg-emerald-600 text-white z-10 transition-all ${
            currentIndex === 2 ? "border-slate-950 ring-2 ring-emerald-500/25" : "border-emerald-700"
          }`} onClick={() => setCurrentIndex(2)}>
            <div className="grid grid-cols-4 gap-2 items-center">
              <div className="col-span-3 space-y-1">
                <span className="block text-[8px] font-mono uppercase text-emerald-100 font-bold">LAUNCH TO ACTION:</span>
                <p className="text-[10px] font-serif leading-tight">
                  {items[2]?.copy || brief.cta}
                </p>
              </div>
              <div className="col-span-1 aspect-square border border-emerald-400 bg-white rounded p-1 flex items-center justify-center">
                {/* Simulated QR Code */}
                <div className="w-full h-full bg-slate-900 rounded-sm flex items-center justify-center">
                  <span className="text-[8px] font-mono font-black text-white">QR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flier Section Details List */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
            Blueprint Architecture Directives
          </span>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <div 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#101513] border-emerald-500/40 shadow-md" 
                      : "bg-slate-950/40 border-slate-900 hover:border-border"
                  }`}
                >
                  <span className="block text-xs font-mono font-bold text-emerald-400 border-b border-slate-900 pb-1.5 mb-2">
                    SECTION {item.number} — {item.title}
                  </span>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">📝 Section Copy Text</span>
                      <p className="text-slate-200 mt-1 select-all font-sans bg-slate-950 p-2 rounded border border-slate-900 leading-relaxed italic">
                        "{item.copy}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">🎨 Section Design Spec</span>
                      <p className="text-slate-350 mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-900 leading-relaxed">
                        {item.design}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render Email Campaign / Newsletter Mockup Mode
  const renderEmailMode = () => {
    return (
      <div className="space-y-4">
        {/* Email Header */}
        <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-lg border border-border text-xs">
          <span className="font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-violet-400" />
            Email Newsletter Blueprint ({items.length} Modular Blocks)
          </span>
          <span className="bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
            HTML Campaign
          </span>
        </div>

        {/* Desktop Web Email Client Mockup */}
        <div className="relative max-w-[420px] mx-auto rounded-xl border border-border bg-[#faf9f5] overflow-hidden shadow-2xl text-slate-950 select-none">
          {/* Header Bar of Mail client */}
          <div className="bg-[#f0ede6] border-b border-slate-200 p-3 flex items-center space-x-2">
            <div className="flex space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-500 truncate ml-4">
              partner@nok.agency — HTML Mail Sandbox
            </span>
          </div>

          {/* Inbox Fields */}
          <div className="p-3.5 border-b border-slate-200 text-xs space-y-2 bg-slate-50">
            <div className="flex">
              <span className="font-mono font-bold text-slate-400 w-16">Subject:</span>
              <span className="font-serif font-bold text-slate-900 truncate">
                {items[0]?.subjectLine || "Let's automate the relatable chaos..."}
              </span>
            </div>
            <div className="flex">
              <span className="font-mono font-bold text-slate-400 w-16">Preview:</span>
              <span className="text-slate-600 truncate italic">
                {items[0]?.previewText || "Between replying to DMs, tracking sales..."}
              </span>
            </div>
          </div>

          {/* Newsletter Canvas */}
          <div className="p-6 space-y-6 font-serif max-h-[260px] overflow-y-auto scrollbar-thin bg-white">
            {/* Logo bar */}
            <div className="text-center border-b border-slate-100 pb-3">
              <span className="font-mono text-[10px] font-black tracking-widest text-slate-400">
                {brandName.toUpperCase()} — DIGEST
              </span>
            </div>

            {/* Content blocks */}
            <div className="space-y-4">
              {items.map((item, idx) => {
                if (idx === 0) return null; // skip the inbox metadata slide
                const isSelected = idx === currentIndex;
                
                return (
                  <div 
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-3 rounded border transition-all cursor-pointer ${
                      isSelected 
                        ? "border-violet-500 bg-violet-50/40" 
                        : "border-transparent hover:bg-slate-50"
                    }`}
                  >
                    {idx === 2 ? (
                      // Render a styled button or CTA box for block 2 / CTA block
                      <div className="space-y-3">
                        <p className="text-xs leading-relaxed text-slate-700 font-sans">
                          {item.copy}
                        </p>
                        <div className="text-center">
                          <button className="bg-violet-600 hover:bg-violet-700 text-white font-sans text-[11px] font-bold py-2 px-4 rounded-lg shadow-sm">
                            Run My Workspace Sandbox
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                        {item.copy}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email Block specs */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block tracking-wider">
            Email Newsletter Block Details
          </span>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <div 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#121117] border-violet-500/40 shadow-md" 
                      : "bg-slate-950/40 border-slate-900 hover:border-border"
                  }`}
                >
                  <span className="block text-xs font-mono font-bold text-violet-400 border-b border-slate-900 pb-1.5 mb-2">
                    BLOCK {item.number} — {item.title}
                  </span>
                  
                  <div className="space-y-2 text-xs">
                    {item.subjectLine && (
                      <div className="grid grid-cols-2 gap-2 mb-2 bg-slate-950/40 p-2 rounded border border-slate-900 font-mono text-[10px]">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase block">Inbox Subject Line</span>
                          <span className="text-violet-300 font-bold">"{item.subjectLine}"</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase block">Inbox Preview snippet</span>
                          <span className="text-slate-400">"{item.previewText}"</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">📝 Block Copy Content</span>
                      <p className="text-slate-200 mt-1 select-all font-sans bg-slate-950 p-2 rounded border border-slate-900 leading-relaxed whitespace-pre-wrap italic">
                        "{item.copy}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-500 block">🎨 Section Design Spec</span>
                      <p className="text-slate-350 mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-900 leading-relaxed">
                        {item.design}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Selector Header based on format category */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center space-x-2">
          <Presentation className="w-4 h-4 text-violet-400" />
          <h4 className="text-xs font-mono font-black uppercase tracking-widest text-slate-300">
            {formatType === "carousel" && "Social Carousel Playback"}
            {formatType === "video" && "Scene-by-Scene Script Storyboard"}
            {formatType === "flier" && "Vector Flier Canvas & Crop Blueprint"}
            {formatType === "email" && "Inbox Newsletter Client Mockup"}
          </h4>
        </div>

        <span className="text-[9px] font-mono uppercase bg-slate-950 px-2 py-0.5 rounded text-slate-400 border border-border">
          Format: {brief.formatSpec || "Standard Output"}
        </span>
      </div>

      {/* Primary Layout Switcher */}
      {formatType === "carousel" && renderCarouselMode()}
      {formatType === "video" && renderVideoMode()}
      {formatType === "flier" && renderFlierMode()}
      {formatType === "email" && renderEmailMode()}

      {/* Picture Thumbnail Ribbon (Only for Carousel Mode navigation) */}
      {formatType === "carousel" && items.length > 1 && (
        <div className="space-y-2 pt-2 border-t border-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-violet-400" />
              Carousel Deck Ribbon ({items.length} Slides)
            </span>
            <span className="text-[8px] font-mono text-slate-500">
              Click thumbnails to jump
            </span>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin snap-x">
            {items.map((slide, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-none w-14 aspect-square rounded-lg overflow-hidden border relative snap-start cursor-pointer transition-all ${
                    isSelected 
                      ? "border-violet-500 ring-2 ring-violet-500/20 scale-105" 
                      : "border-border hover:border-slate-700 opacity-60 hover:opacity-90"
                  }`}
                >
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center font-mono font-black text-[10px] ${
                    isSelected ? "bg-violet-950/70 text-violet-300" : "bg-slate-950/60 text-slate-400"
                  }`}>
                    #{slide.number}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
