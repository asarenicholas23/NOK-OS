import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      minify: 'esbuild' as const,
      cssMinify: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // jsPDF is only ever reached via already-lazy /os routes
              // (CalendarPage, brief/PDF export modals). Forcing it into its
              // own named vendor chunk backfired: Vite also places its shared
              // dynamic-import() runtime helper inside whichever chunk a
              // manualChunks rule creates, and every React.lazy() call in the
              // app — including on the public homepage — needs that helper,
              // so the whole ~94KB chunk ended up in the main entry's static
              // import graph regardless of route. Returning undefined here
              // lets Rollup's automatic splitting keep jsPDF inside the async
              // chunk(s) that actually import it, with no name of its own for
              // an unrelated shared helper to be co-located in.
              if (id.includes('jspdf')) {
                return undefined;
              }
              // Match exact package folders, not substrings: "motion/react"
              // and "lucide-react" both contain "react", and splitting one
              // library across two chunks that import each other breaks
              // start-up order (React undefined when motion initialises).
              if (/node_modules\/(lucide-react|motion|framer-motion|motion-dom|motion-utils)\//.test(id)) {
                return 'ui-vendor';
              }
              if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) {
                return 'react-vendor';
              }
              // Firebase isn't grouped: the database, auth and analytics each
              // load only where they're used (see src/lib/loadFirebase.ts).
              if (id.includes('react-markdown')) {
                return 'markdown-vendor';
              }
              if (id.includes('@google/genai')) {
                return 'genai-vendor';
              }
              // Everything else: let Rollup split by where it's used, so
              // libraries only the /os admin needs stay out of the public
              // pages' start-up download. (A catch-all 'vendor' chunk put
              // ~1.6MB of them on every page.)
              return undefined;
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
