/**
 * Shared Firestore read used by both the prerender script and the sitemap
 * generator, so the build's two crawlers of the blogPosts collection never
 * drift out of sync with each other.
 */
import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query } from "firebase/firestore";

// Same public (non-secret) config the browser bundle ships with — reading
// blogPosts is allowed for anyone per firestore.rules, so no service
// account / admin credentials are needed just to discover posts at build time.
const firebaseConfig = {
  apiKey: "AIzaSyDBiyLPMt7n0MZsEkLbbqIYbSxURQgdiL0",
  authDomain: "nok-os-prod.firebaseapp.com",
  projectId: "nok-os-prod",
  storageBucket: "nok-os-prod.firebasestorage.app",
  messagingSenderId: "288873586116",
  appId: "1:288873586116:web:cc3186e62ecaf45e185891",
};

export interface BuildTimeBlogPost {
  slug: string;
  title: string;
  date: string;
}

let buildDb: ReturnType<typeof getFirestore> | null = null;
const getBuildDb = () => (buildDb ??= getFirestore(initializeApp(firebaseConfig, "build-scripts")));

export async function fetchBlogPosts(): Promise<BuildTimeBlogPost[]> {
  const db = getBuildDb();
  const snapshot = await getDocs(collection(db, "blogPosts"));
  const posts: BuildTimeBlogPost[] = [];
  snapshot.forEach((d) => {
    const data = d.data() as { slug?: string; title?: string; date?: string };
    if (data.slug && data.title && data.date) {
      posts.push({ slug: data.slug, title: data.title, date: data.date });
    }
  });
  return posts;
}

/**
 * The public CMS data the site reads at runtime (blog posts, client brands,
 * call settings), in the same shape the app's live subscriptions produce.
 * The prerender hands it to each page, so pages render real content without
 * opening their own database connection during the build. Every field here
 * is publicly readable per firestore.rules.
 */
export interface CmsSnapshot {
  blogPosts: Record<string, unknown>[];
  clientBrands: Record<string, unknown>[];
  callAvailability: Record<string, unknown> | null;
}

export async function fetchCmsSnapshot(): Promise<CmsSnapshot> {
  const db = getBuildDb();
  const [posts, brands, call] = await Promise.all([
    getDocs(query(collection(db, "blogPosts"), orderBy("createdAt", "desc"))),
    getDocs(collection(db, "clientBrands")),
    getDoc(doc(db, "cms", "callAvailability")),
  ]);
  return {
    blogPosts: posts.docs.map((d) => ({ ...d.data(), id: d.id })),
    clientBrands: brands.docs.map((d) => ({ ...d.data(), id: d.id })),
    callAvailability: call.exists() ? (call.data() as Record<string, unknown>) : null,
  };
}
