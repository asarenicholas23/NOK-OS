import React from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Share2, User } from "lucide-react";
import { useCms } from "../context/CmsContext";
import type { BlogPost } from "../data/cmsData";
import { blogCategory, postTitle, sortByPublishDate, type BlogCategory } from "../content/blog";
import { blog, crumbs } from "../content/siteContent";
import { buildArticleJsonLd, SITE_URL, toCrawlableImage, toIsoDate, truncateDescription } from "../lib/seo";
import { SEO } from "./SEO";
import { Breadcrumbs, Container, PillButton, Reveal, Section, SiteShell, useBooking } from "./site";
import { Cover, useShareToast } from "./BlogPage";

/** Older posts store "NOK Social" in the author role. */
const brandFix = (s: string) => s.replace(/\bNOK Social\b/g, "N.O.K Social");

const isBareImageUrl = (s: string) =>
  s.startsWith("data:image/") ||
  (s.startsWith("http") && (s.includes("unsplash.com") || s.includes("images.") || /\.(jpg|jpeg|png|webp|gif|svg|avif)(\?.*)?$/i.test(s)));

const ArticleImage: React.FC<{ src?: string; alt?: string; caption?: string }> = ({ src, alt, caption }) => (
  <figure className="my-8">
    <img
      src={src}
      alt={alt || ""}
      width={1000}
      height={562}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className="h-auto max-h-[520px] w-full rounded-card object-cover"
    />
    {caption && <figcaption className="mt-2 text-center text-[15px] text-site-slate">{caption}</figcaption>}
  </figure>
);

const md: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => <h2 className="mb-4 mt-10 text-[28px] font-bold leading-tight text-site-ink sm:text-[32px]">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-3 mt-9 text-[24px] font-bold leading-tight text-site-ink sm:text-[26px]">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-7 text-xl font-semibold text-site-ink">{children}</h4>,
  p: ({ children }) => {
    if (typeof children === "string" && isBareImageUrl(children.trim())) return <ArticleImage src={children.trim()} />;
    return <p className="mb-5 text-lg leading-[1.8] text-site-graphite">{children}</p>;
  },
  blockquote: ({ children }) => (
    <blockquote className="my-7 rounded-card bg-[#E6EDF7] px-6 py-5 text-lg text-site-ink [&_p]:mb-0 [&_p]:text-site-ink">{children}</blockquote>
  ),
  ul: ({ children }) => <ul className="mb-5 space-y-2.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2.5 pl-6 text-lg leading-relaxed text-site-graphite marker:text-site-cyanotype">{children}</ol>,
  li: ({ children, node }) => {
    // Ordered-list items keep their numbers; bullets get a cyanotype dot.
    const ordered = (node as { parent?: { tagName?: string } } | undefined)?.parent?.tagName === "ol";
    return ordered ? (
      <li className="pl-1">{children}</li>
    ) : (
      <li className="flex items-start gap-3 text-lg leading-relaxed text-site-graphite">
        <span className="mt-[0.7em] h-2 w-2 shrink-0 rounded-full bg-site-cyanotype" aria-hidden="true" />
        <span className="flex-1">{children}</span>
      </li>
    );
  },
  strong: ({ children }) => <strong className="font-semibold text-site-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-site-cyanotype underline underline-offset-2 hover:text-site-ink">
      {children}
    </a>
  ),
  img: ({ src, alt }) => <ArticleImage src={typeof src === "string" ? src : undefined} alt={alt} caption={alt} />,
  code: ({ children }) => <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[0.9em] text-site-ink">{children}</code>,
  hr: () => <hr className="my-10 h-px border-0 bg-site-ink/10" />,
};

const CTA_FOR: Record<BlogCategory, keyof Omit<typeof blog.cta, "book">> = {
  "Social media": "marketing",
  Campaigns: "marketing",
  Websites: "websites",
  "Running your business": "business",
};

const ArticleCta: React.FC<{ category: BlogCategory }> = ({ category }) => {
  const { openBooking } = useBooking();
  const c = blog.cta[CTA_FOR[category]];
  return (
    <Section tone="ink" className="mt-14" innerClassName="text-center" aria-labelledby="article-cta">
      <h2 id="article-cta" className="text-[28px] font-bold leading-[1.1] sm:text-[36px]">
        {c.title}
      </h2>
      <p className="mx-auto mt-2.5 max-w-[540px] text-lg text-site-paper/75">{c.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <PillButton variant="primary" size="lg" to={c.to} className="focus-visible:ring-offset-site-ink">
          {c.button}
        </PillButton>
        <PillButton variant="soft" size="lg" onClick={() => openBooking()} className="focus-visible:ring-offset-site-ink">
          {blog.cta.book}
        </PillButton>
      </div>
    </Section>
  );
};

const KeepReading: React.FC<{ current: BlogPost }> = ({ current }) => {
  const { blogPosts } = useCms();
  const cat = blogCategory(current);
  const others = sortByPublishDate(blogPosts.filter((p) => p.slug !== current.slug));
  const picks = [...others.filter((p) => blogCategory(p) === cat), ...others.filter((p) => blogCategory(p) !== cat)].slice(0, 3);
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="keep-reading" className="mt-16">
      <Container>
        <h2 id="keep-reading" className="text-[28px] font-bold text-site-ink sm:text-[34px]">
          {blog.article.keepReading}
        </h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {picks.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 0.06} className="h-full">
              <Link to={`/blog/${p.slug}`} className="block h-full rounded-card bg-white p-3.5 pb-5 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype">
                <Cover post={p} />
                <p className="mt-4 px-2 font-mono text-xs text-site-cyanotype">{blogCategory(p)}</p>
                <p className="mt-1 px-2 text-lg font-semibold leading-snug text-site-ink">{postTitle(p)}</p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
};

const NotFound: React.FC<{ slug?: string }> = ({ slug }) => (
  <>
    <SEO title={`${blog.notFound.title} | N.O.K Social`} description={blog.notFound.body} path={`/blog/${slug ?? ""}`} noindex />
    <Container className="max-w-[720px] py-24 text-center">
      <h1 className="text-[36px] font-bold text-site-ink">{blog.notFound.title}</h1>
      <p className="mt-2 text-lg text-site-slate">{blog.notFound.body}</p>
      <PillButton variant="dark" size="lg" to="/blog" className="mt-6">
        {blog.notFound.back}
      </PillButton>
    </Container>
  </>
);

const Article: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, blogPostsReady } = useCms();
  const { share, toastNode } = useShareToast();
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post && !blogPostsReady) {
    // Live posts still loading: hold a quiet placeholder (no "not found", no noindex).
    return (
      <Container className="max-w-[820px] py-24" aria-busy="true">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white motion-reduce:animate-none" />
        <div className="mt-4 h-12 w-full animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
        <div className="mt-3 h-12 w-2/3 animate-pulse rounded-2xl bg-white motion-reduce:animate-none" />
        <span className="sr-only">{blog.loading}</span>
      </Container>
    );
  }
  if (!post) return <NotFound slug={slug} />;

  const title = postTitle(post);
  const category = blogCategory(post);
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = buildArticleJsonLd({
    title,
    description: post.excerpt.trim(),
    datePublished: toIsoDate(post.date),
    authorName: post.author.name,
    image: toCrawlableImage(post.coverImage),
    canonicalUrl,
  });

  return (
    <>
      <SEO title={`${title} | N.O.K Social`} description={truncateDescription(post.excerpt)} path={`/blog/${post.slug}`} image={toCrawlableImage(post.coverImage)} type="article" />
      <script type="application/ld+json">{JSON.stringify(articleJsonLd).replace(/</g, "\\u003c")}</script>
      <Breadcrumbs
        currentPath={`/blog/${post.slug}`}
        items={[{ label: crumbs.home, to: "/home" }, { label: blog.crumb, to: "/blog" }, { label: title.length > 48 ? title.slice(0, 46).trimEnd() + "…" : title }]}
      />

      <article>
        <Container className="max-w-[820px]">
          <header className="pt-6 sm:pt-10">
            <p className="font-mono text-xs text-site-cyanotype">{category}</p>
            <h1 className="mt-2 text-[34px] font-bold leading-[1.08] text-site-ink sm:text-[48px]">{title}</h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
              <span className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-site-ink" aria-hidden="true">
                  <User className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                  <span className="block font-semibold text-site-ink">
                    <span className="sr-only">{blog.article.by} </span>
                    {post.author.name}
                  </span>
                  <span className="block text-[15px] text-site-slate">{brandFix(post.author.role)}</span>
                </span>
              </span>
              <span className="text-[15px] text-site-slate">
                {post.date} · {post.readTime}
              </span>
            </div>
          </header>
        </Container>

        {post.coverImage && (
          <Container className="mt-8 max-w-[1000px]">
            <Cover post={post} priority className="rounded-card" />
          </Container>
        )}

        <Container className="mt-10 max-w-[720px]">
          <p className="mb-8 text-xl font-medium leading-relaxed text-site-ink sm:text-[22px]">{post.excerpt}</p>
          <ReactMarkdown components={md}>{post.content.join("\n\n")}</ReactMarkdown>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-card bg-white px-6 py-4">
            <span className="font-semibold text-site-ink">{blog.article.foundUseful}</span>
            <button
              type="button"
              onClick={() => share(post)}
              className="inline-flex items-center gap-2 rounded-full bg-site-ink px-5 py-2.5 font-semibold text-site-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-cyanotype focus-visible:ring-offset-2"
            >
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {blog.shareArticle}
            </button>
          </div>
        </Container>
      </article>

      <ArticleCta category={category} />
      <KeepReading current={post} />
      {toastNode}
    </>
  );
};

export const BlogPostPage: React.FC = () => (
  <SiteShell>
    <Article />
  </SiteShell>
);
