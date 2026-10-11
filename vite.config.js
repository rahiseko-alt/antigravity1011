import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  plugins: [
    {
      name: 'serve-raw-static-css',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/_astro/') && req.url.endsWith('.css')) {
            const filePath = path.join(process.cwd(), req.url.split('?')[0]);
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'text/css');
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          next();
        });
      }
    }
  ]
});
