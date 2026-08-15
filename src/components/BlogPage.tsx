import React, { useState } from "react";
import { Link } from "react-router-dom";
import { PublicNavbar } from "./PublicNavbar";
import { PublicFooter } from "./PublicFooter";
import { useCms } from "../context/CmsContext";
import { Search, Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";

export const BlogPage: React.FC = () => {
  const { blogPosts } = useCms();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(blogPosts.map((p) => p.category)))];

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#15151A] text-[#F2F0EB] font-sans selection:bg-[#B08D57]/30">
      <PublicNavbar />

      <main id="main-content">
        {/* Blog Hero Header */}
        <section className="px-4 sm:px-8 py-16 sm:py-20 max-w-7xl mx-auto border-b border-[#1C1C22]">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full neu-pressed text-[#C5A065] text-xs font-mono font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>NOK Social Insights & Field Notes</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#F2F0EB] tracking-tight">
              Digital Marketing Strategy for Growing Brands
            </h1>
            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed font-normal">
              Practical guides, tactical positioning frameworks, and operational insights for small business owners, startups, artisans, and digital marketers.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 rounded-2xl neu-raised">
            {/* Categories */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "neu-pressed text-[#C5A065] font-semibold"
                      : "text-zinc-200 hover:text-[#F2F0EB]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-zinc-200 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl neu-pressed-deep text-xs text-[#F2F0EB] placeholder-zinc-300 outline-none focus:ring-1 focus:ring-[#B08D57]"
              />
            </div>
          </div>
        </section>

        {/* Blog Cards Grid */}
        <section className="px-4 sm:px-8 py-16 max-w-7xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="p-12 rounded-3xl neu-pressed text-center space-y-3">
              <p className="text-sm text-zinc-200">No articles match your search criteria.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="neu-gold-btn px-4 py-2 rounded-xl text-xs font-mono"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredPosts.map((post, idx) => (
                <article
                  key={post.slug}
                  className="p-6 sm:p-8 rounded-3xl neu-raised flex flex-col justify-between space-y-6 group hover:translate-y-[-2px] transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Article Cover Image with explicit performance loading attributes */}
                    {post.coverImage && (
                      <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden neu-pressed mb-4 relative group-hover:scale-[1.01] transition-transform">
                        <img 
                          src={post.coverImage} 
                          alt={post.title}
                          width="800"
                          height="450"
                          loading={idx === 0 ? "eager" : "lazy"}
                          decoding="async"
                          {...(idx === 0 ? { fetchPriority: "high" as const } : {})}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Category & Read Time */}
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-200">
                      <span className="px-2.5 py-1 rounded-lg neu-pressed text-[#C5A065] font-semibold">
                        {post.category}
                      </span>
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{post.date}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{post.readTime}</span>
                        </span>
                      </div>
                    </div>

                    {/* Title & Excerpt */}
                    <div>
                      <h2 className="font-display font-bold text-xl sm:text-2xl text-[#F2F0EB] group-hover:text-[#B08D57] transition-colors leading-snug">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-200 mt-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  {/* Author & Read More Action */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-[#F2F0EB]">{post.author.name}</div>
                      <div className="text-[10px] text-zinc-200 font-mono">{post.author.role}</div>
                    </div>

                    <Link
                      to={`/blog/${post.slug}`}
                      className="neu-gold-btn px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center space-x-1.5"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
};
