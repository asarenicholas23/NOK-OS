/**
 * Shared Firestore read used by both the prerender script and the sitemap
 * generator, so the build's two crawlers of the blogPosts collection never
 * drift out of sync with each other.
 */
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

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

export async function fetchBlogPosts(): Promise<BuildTimeBlogPost[]> {
  const app = initializeApp(firebaseConfig, "build-scripts");
  const db = getFirestore(app);
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
