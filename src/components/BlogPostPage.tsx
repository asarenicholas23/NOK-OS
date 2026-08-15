import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { useCms } from "../context/CmsContext";
import { ArrowLeft, Calendar, Clock, User, Sparkles, Quote } from "lucide-react";

export const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { blogPosts } = useCms();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans">
        <PublicNavbar />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center space-y-4">
          <h1 className="font-display text-3xl font-bold">Article Not Found</h1>
          <p className="text-sm text-zinc-200">The post you are looking for does not exist or has been moved.</p>
          <Link to="/blog" className="neu-gold-btn px-6 py-2.5 rounded-xl text-xs font-mono inline-block">
            Back to Articles
          </Link>
        </main>
      </div>
    );
  }

  // Combine post content array into single markdown string
  const markdownContent = post.content.join("\n\n");

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <PublicNavbar />

      <main id="main-content" className="px-4 sm:px-8 py-12 max-w-4xl mx-auto">
        {/* Navigation back */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/blog")}
            className="neu-raised-sm px-4 py-2 rounded-xl text-xs font-mono text-zinc-200 hover:text-[#F2F0EB] inline-flex items-center space-x-2 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Articles</span>
          </button>
        </div>

        {/* Post Header */}
        <header className="space-y-6 pb-8 border-b border-[#1C1C22]">
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="px-3 py-1 rounded-full neu-pressed text-[#C5A065] font-semibold">
              {post.category}
            </span>
            <span className="text-zinc-200">•</span>
            <span className="flex items-center space-x-1 text-zinc-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>{post.date}</span>
            </span>
            <span className="text-zinc-200">•</span>
            <span className="flex items-center space-x-1 text-zinc-200">
              <Clock className="w-3.5 h-3.5" />
              <span>{post.readTime}</span>
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F2F0EB] tracking-tight leading-tight">
            {post.title}
          </h1>

          {/* Cover Image Banner with Preload & High Priority */}
          {post.coverImage && (
            <div className="w-full h-64 sm:h-96 rounded-3xl overflow-hidden neu-pressed my-6 relative">
              <img 
                src={post.coverImage} 
                alt={post.title}
                width="1200"
                height="675"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Author Card */}
          <div className="flex items-center space-x-3 pt-2">
            <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center text-[#B08D57]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#F2F0EB]">{post.author.name}</div>
              <div className="text-xs text-zinc-200">{post.author.role}</div>
            </div>
          </div>
        </header>

        {/* Clean, breathable article body with full Markdown styling */}
        <article className="py-10 max-w-3xl mx-auto space-y-6 text-base sm:text-lg text-[#F2F0EB]/90 leading-relaxed font-sans font-normal">
          {/* Summary Excerpt Callout */}
          <p className="text-lg sm:text-xl font-medium text-[#F2F0EB] p-5 sm:p-6 rounded-2xl neu-pressed leading-relaxed border-l-4 border-[#B08D57]">
            {post.excerpt}
          </p>

          <div className="space-y-6 pt-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F2F0EB] mt-8 mb-4 pb-2 border-b border-[#B08D57]/30 flex items-center gap-2">
                    <span className="w-2 h-6 rounded-full bg-[#B08D57] inline-block" />
                    <span>{children}</span>
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F2F0EB] mt-8 mb-3 flex items-center gap-2">
                    <span className="text-[#C5A065] font-mono">#</span>
                    <span>{children}</span>
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="font-display text-lg font-bold text-[#C5A065] mt-6 mb-2">
                    {children}
                  </h4>
                ),
                p: ({ children }) => {
                  if (typeof children === "string") {
                    const trimmed = children.trim();
                    const isImg = trimmed.startsWith("data:image/") ||
                      (trimmed.startsWith("http") && (
                        trimmed.includes("unsplash.com") ||
                        trimmed.includes("images.") ||
                        trimmed.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i)
                      ));
                    if (isImg) {
                      return (
                        <div className="my-6 rounded-2xl overflow-hidden neu-pressed border border-white/5">
                          <img 
                            src={trimmed} 
                            alt="Article visual content" 
                            width="1000"
                            height="562"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-auto max-h-[500px] object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      );
                    }
                  }
                  return (
                    <p className="text-[#F2F0EB]/90 text-base sm:text-lg leading-[1.8] tracking-normal mb-4">
                      {children}
                    </p>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="my-6 p-5 sm:p-6 rounded-2xl neu-pressed border-l-4 border-[#B08D57] bg-[#111115] text-[#F2F0EB] italic text-base sm:text-lg relative">
                    <div className="text-xs font-mono text-[#C5A065] uppercase font-bold not-italic mb-2 flex items-center space-x-1.5">
                      <Quote className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>Key Callout & Insight</span>
                    </div>
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="my-4 space-y-2.5 pl-2">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-4 space-y-2.5 pl-2 list-decimal list-inside text-[#F2F0EB]/90">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start space-x-3 text-base sm:text-lg text-[#F2F0EB]/90 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-[#B08D57] mt-2.5 shrink-0" />
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold bg-[#B08D57]/20 px-1.5 py-0.5 rounded text-[#C5A065]">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-[#E0D8C8]">{children}</em>
                ),
                img: ({ src, alt }) => (
                  <div className="my-6 rounded-2xl overflow-hidden neu-pressed border border-white/5">
                    <img 
                      src={src} 
                      alt={alt || "Article illustration"} 
                      width="1000"
                      height="562"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-auto max-h-[500px] object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    {alt && <div className="p-2.5 text-center text-xs font-mono text-zinc-200 bg-[#111115]">{alt}</div>}
                  </div>
                ),
                code: ({ children }) => (
                  <code className="px-2 py-0.5 rounded-md neu-pressed font-mono text-xs text-[#C5A065]">
                    {children}
                  </code>
                )
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </article>

        {/* Footer Author & CTA Banner */}
        <div className="mt-12 p-8 rounded-3xl neu-raised space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 text-[#C5A065]">
            <Sparkles className="w-5 h-5" />
            <span className="font-mono text-xs uppercase font-bold tracking-wider">NOK Social Agency</span>
          </div>
          <h2 className="font-display text-xl font-bold text-[#F2F0EB]">
            Want a custom social media engine built for your brand?
          </h2>
          <p className="text-xs text-zinc-200 leading-relaxed">
            NOK Social provides end-to-end digital marketing infrastructure, creative briefs, and campaign execution for growing businesses in Ghana.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link to="/home#services" className="neu-gold-filled px-5 py-2.5 rounded-xl text-xs font-bold">
              Explore Our Services
            </Link>
            <Link to="/ighealthcheck" className="neu-raised px-5 py-2.5 rounded-xl text-xs font-mono text-[#F2F0EB] hover:text-[#B08D57]">
              Instagram Audit
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
