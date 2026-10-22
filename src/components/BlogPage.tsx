import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, Share2 } from "lucide-react";
import { useCms } from "../context/CmsContext";
import type { BlogPost } from "../data/cmsData";
import { BLOG_CATEGORIES, blogCategory, postTitle, sortByPublishDate } from "../content/blog";
import { blog, crumbs } from "../content/siteContent";
import { shareArticle } from "../utils/share";
import { SITE_URL, ogImage } from "../lib/seo";
import { SEO } from "./SEO";
import { Breadcrumbs, Container, FreeToolsStrip, ImageSlot, Reveal, SiteShell } from "./site";

/** Share via the device share sheet, or copy the link; reports back for a toast. */
export const useShareToast = () => {
  const [toast, setToast] = useState<string | null>(null);
  const share = async (post: BlogPost) => {
    const result = await shareArticle({ title: postTitle(post), text: post.excerpt, url: `${SITE_URL}/blog/${post.slug}` });
    if (result === "copied" || result === "failed") {
      setToast(result === "copied" ? blog.copied : blog.copyFailed);
      setTimeout(() => setToast(null), 2800);
    }
  };
  const node = toast ? (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-site-ink px-5 py-2.5 text-[15px] text-site-paper shadow-lg">
      {toast}
    </div>
  ) : null;
  return { share, toastNode: node };
};

export const Cover: React.FC<{ post: BlogPost; aspect?: string; priority?: boolean; className?: string }> = ({
  post,
  aspect = "16 / 9",
  priority = false,
  className = "",
}) =>
  post.coverImage ? (
    <div className={`relative overflow-hidden rounded-frame bg-[#E9DCC7] ${className}`} style={{ aspectRatio: aspect }}>
      <img
        src={post.coverImage}
        alt={postTitle(post)}
        width={800}
        height={450}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  ) : (
    <ImageSlot label="Cover image" aspect={aspect} className={className} />
  );

const Meta: React.FC<{ post: BlogPost; className?: string }> = ({ post, className = "" }) => (
  <p className={`text-[15px] text-site-slate ${className}`}>
    {post.date} · {post.readTime}
  </p>
);

const PostCard: React.FC<{ post: BlogPost; onShare: (p: BlogPost) => void }> = ({ post, onShare }) => (
  <article className="flex h-full flex-col rounded-card bg-white p-3.5 pb-6">
    <Link to={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
      <Cover post={post} />
    </Link>
    <div className="flex flex-1 flex-col px-3.5 pt-[18px]">
      <p className="font-mono text-xs text-site-cyanotype">{blogCategory(post)}</p>
      <h2 className="mt-1 text-[22px] font-semibold leading-tight text-site-ink">
        <Link to={`/blog/${post.slug}`} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype">
          {postTitle(post)}
        </Link>
      </h2>
      <p className="mt-2 line-clamp-3 text-base leading-normal text-site-slate">{post.excerpt}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Meta post={post} />
        <button
          type="button"
          onClick={() => onShare(post)}
          aria-label={`${blog.share}: ${postTitle(post)}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-site-paper text-site-ink cursor-pointer hover:bg-[#ece6d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
);

const Featured: React.FC<{ post: BlogPost }> = ({ post }) => (
  <Reveal>
    <article className="grid gap-6 rounded-card bg-white p-3.5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center md:gap-8 md:p-4">
      <Link to={`/blog/${post.slug}`} tabIndex={-1} aria-hidden="true">
        <Cover post={post} priority />
      </Link>
      <div className="px-3.5 pb-5 md:px-2 md:pb-0 md:pr-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-site-amber px-3 py-1 text-[13px] font-semibold text-site-ink">{blog.latest}</span>
          <span className="font-mono text-xs text-site-cyanotype">{blogCategory(post)}</span>
        </div>
        <h2 className="mt-3 text-[28px] font-bold leading-[1.1] text-site-ink sm:text-[34px]">
          <Link to={`/blog/${post.slug}`} className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype">
            {postTitle(post)}
          </Link>
        </h2>
        <p className="mt-3 text-lg leading-normal text-site-slate">{post.excerpt}</p>
        <Meta post={post} className="mt-4" />
        <Link
          to={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full font-semibold text-site-cyanotype hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
        >
          {blog.readArticle}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  </Reveal>
);

const BlogIndex: React.FC = () => {
  const { blogPosts, blogPostsReady, requestLiveData } = useCms();
  useEffect(requestLiveData, [requestLiveData]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(blog.all);
  const { share, toastNode } = useShareToast();

  const posts = useMemo(() => sortByPublishDate(blogPosts), [blogPosts]);
  const filtering = category !== blog.all || query.trim() !== "";
  const q = query.trim().toLowerCase();
  const filtered = posts.filter(
    (p) =>
      (category === blog.all || blogCategory(p) === category) &&
      (!q || postTitle(p).toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)),
  );
  const [featured, ...rest] = filtering ? [undefined, ...filtered] : filtered;

  return (
    <>
      <SEO title={blog.seo.title} description={blog.seo.description} path="/blog" image={ogImage("blog")} />
      <Breadcrumbs currentPath="/blog" items={[{ label: crumbs.home, to: "/" }, { label: blog.crumb }]} />

      <Container>
        <header className="pt-6 sm:pt-10">
          <h1 className="text-[40px] font-bold leading-tight text-site-ink sm:text-[54px]">{blog.title}</h1>
          <p className="mt-2 max-w-[640px] text-lg leading-normal text-site-slate sm:text-xl">{blog.intro}</p>
        </header>

        <FreeToolsStrip className="mt-8" />

        <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label={blog.filterLabel} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
            {[blog.all, ...BLOG_CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-[15px] font-medium cursor-pointer transition-colors duration-300 ease-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype ${
                  category === c ? "bg-site-ink text-site-paper" : "bg-white text-site-ink hover:bg-white/70"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="relative block w-full md:w-72">
            <span className="sr-only">{blog.searchLabel}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-site-slate" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={blog.searchPlaceholder}
              className="w-full rounded-full bg-white py-2.5 pl-11 pr-4 text-base text-site-graphite placeholder:text-site-slate/70 outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype"
            />
          </label>
        </div>

        <div className="mt-8" aria-busy={!blogPostsReady}>
          {!blogPostsReady ? (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label={blog.loading}>
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-[380px] animate-pulse rounded-card bg-white/70 motion-reduce:animate-none" />
              ))}
            </ul>
          ) : filtered.length === 0 ? (
            <div className="rounded-card bg-white p-10 text-center">
              <p className="text-lg text-site-slate">{blog.empty}</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory(blog.all);
                }}
                className="mt-4 rounded-full bg-site-ink px-5 py-2.5 font-semibold text-site-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2"
              >
                {blog.reset}
              </button>
            </div>
          ) : (
            <>
              {featured && <Featured post={featured} />}
              {rest.length > 0 && (
                <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${featured ? "mt-4" : ""}`}>
                  {rest.map((p, i) => (
                    <Reveal as="li" key={p.slug} delay={(i % 3) * 0.06} className="h-full">
                      <PostCard post={p} onShare={share} />
                    </Reveal>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </Container>
      {toastNode}
    </>
  );
};

export const BlogPage: React.FC = () => (
  <SiteShell>
    <BlogIndex />
  </SiteShell>
);
