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
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'react-vendor';
              }
              if (id.includes('firebase')) {
                return 'firebase-vendor';
              }
              if (id.includes('lucide-react') || id.includes('motion')) {
                return 'ui-vendor';
              }
              if (id.includes('react-markdown')) {
                return 'markdown-vendor';
              }
              if (id.includes('@google/genai')) {
                return 'genai-vendor';
              }
              return 'vendor';
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
