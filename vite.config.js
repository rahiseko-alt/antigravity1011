import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// 1x1 transparent PNG base64
const FALLBACK_1X1_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAgenes', 'base64');

export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  plugins: [
    {
      name: 'lusion-asset-handler',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const rawUrl = req.url ? req.url.split('?')[0] : '';

          // 1. CSS handler
          if (rawUrl.startsWith('/_astro/') && rawUrl.endsWith('.css')) {
            const filePath = path.join(process.cwd(), rawUrl);
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/css');
              return fs.createReadStream(filePath).pipe(res);
            }
          }

          // 2. Assets handler (prevent SPA HTML fallback for missing textures/models)
          if (rawUrl.startsWith('/assets/')) {
            const filePath = path.join(process.cwd(), rawUrl);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              if (rawUrl.endsWith('.buf')) {
                res.setHeader('Content-Type', 'application/octet-stream');
                return fs.createReadStream(filePath).pipe(res);
              }
              if (rawUrl.endsWith('.glb')) {
                res.setHeader('Content-Type', 'model/gltf-binary');
                return fs.createReadStream(filePath).pipe(res);
              }
              return next();
            }

            // File missing: return transparent 1x1 image for image requests to prevent loader hang
            if (/\.(png|jpg|jpeg|webp)$/i.test(rawUrl)) {
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Content-Length', FALLBACK_1X1_PNG.length);
              return res.end(FALLBACK_1X1_PNG);
            }

            // Other missing assets (audios, videos, etc.): return 404 instead of SPA HTML
            res.statusCode = 404;
            return res.end('Asset not found');
          }

          next();
        });
      },
      closeBundle() {
        const distDir = path.resolve(process.cwd(), 'dist');
        const assetsSrc = path.resolve(process.cwd(), 'assets');
        const assetsDest = path.join(distDir, 'assets');
        if (fs.existsSync(assetsSrc)) {
          fs.cpSync(assetsSrc, assetsDest, { recursive: true, force: true });
          console.log('[build] Copied static assets to dist/assets');
        }
        const astroSrc = path.resolve(process.cwd(), '_astro');
        const astroDest = path.join(distDir, '_astro');
        if (fs.existsSync(astroSrc)) {
          fs.cpSync(astroSrc, astroDest, { recursive: true, force: true });
          console.log('[build] Copied _astro to dist/_astro');
        }
        // GitHub Pages ignores directories starting with _ without .nojekyll
        fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');
        console.log('[build] Created .nojekyll in dist');
      }
    }
  ]
});
