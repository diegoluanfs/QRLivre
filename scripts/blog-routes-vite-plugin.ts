import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Em desenvolvimento, os arquivos em public/blog/ nao sao automaticamente
 * encontrados pelo Vite ao acessar URLs de diretorio como /blog/.
 * Este middleware preserva URLs canonicas e serve o index.html existente.
 * Em producao, a Cloudflare deve servir dist/blog/(artigo)/index.html normalmente.
 */
function blogIndexMiddleware(baseDir: string) {
  return (req: { url?: string }, _res: unknown, next: () => void) => {
    let url: URL;
    try {
      url = new URL(req.url ?? '/', 'http://localhost');
    } catch {
      next();
      return;
    }
    const match = /^\/blog(?:\/([a-z0-9-]+))?\/?$/.exec(url.pathname);
    if (match) {
      const slug = match[1];
      const folder = slug ? resolve(baseDir, 'blog', slug) : resolve(baseDir, 'blog');
      if (existsSync(resolve(folder, 'index.html'))) {
        req.url = `/blog/${slug ? `${slug}/` : ''}index.html${url.search}`;
      }
    }
    next();
  };
}

export function blogRoutesPlugin(): Plugin {
  return {
    name: 'qrlivre-blog-routes',
    configureServer(server) {
      server.middlewares.use(blogIndexMiddleware(server.config.publicDir));
    },
    configurePreviewServer(server) {
      server.middlewares.use(blogIndexMiddleware(resolve(server.config.root, server.config.build.outDir)));
    },
  };
}
