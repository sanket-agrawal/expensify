import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import { loadEnv } from 'vite';
import createTripHandler from './api/trips/index';
import getTripHandler from './api/trips/[token]/index';
import expensesHandler from './api/trips/[token]/expenses/index';
import expenseDetailHandler from './api/trips/[token]/expenses/[id]';
import uploadSignHandler from './api/trips/[token]/uploads/sign';
import uploadLocalHandler from './api/trips/[token]/uploads/local';
import photoSignHandler from './api/trips/[token]/photos/sign';
import settlementsHandler from './api/trips/[token]/settlements/index';
import type { VercelRequest, VercelResponse } from './api/_lib/handler';

function setupApiMiddleware(server: ViteDevServer | PreviewServer) {
  // Load environment variables from .env
  const env = loadEnv('development', process.cwd(), '');
  for (const [key, val] of Object.entries(env)) {
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) {
      return next();
    }

    try {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;
      const query: Record<string, string> = Object.fromEntries(parsedUrl.searchParams.entries());

      const vReq = req as unknown as VercelRequest;
      const vRes = res as unknown as VercelResponse;
      vReq.query = query;

      // 1. POST /api/trips
      if (pathname === '/api/trips' || pathname === '/api/trips/') {
        return await createTripHandler(vReq, vRes);
      }

      // 2. /api/trips/:token/expenses/:id
      const expDetailMatch = pathname.match(/^\/api\/trips\/([^/]+)\/expenses\/([^/]+)$/);
      if (expDetailMatch) {
        vReq.query.token = expDetailMatch[1]!;
        vReq.query.id = expDetailMatch[2]!;
        return await expenseDetailHandler(vReq, vRes);
      }

      // 3. /api/trips/:token/expenses
      const expMatch = pathname.match(/^\/api\/trips\/([^/]+)\/expenses$/);
      if (expMatch) {
        vReq.query.token = expMatch[1]!;
        return await expensesHandler(vReq, vRes);
      }

      // 4. /api/trips/:token/uploads/sign
      const uploadSignMatch = pathname.match(/^\/api\/trips\/([^/]+)\/uploads\/sign$/);
      if (uploadSignMatch) {
        vReq.query.token = uploadSignMatch[1]!;
        return await uploadSignHandler(vReq, vRes);
      }

      // 4b. /api/trips/:token/uploads/local
      const uploadLocalMatch = pathname.match(/^\/api\/trips\/([^/]+)\/uploads\/local$/);
      if (uploadLocalMatch) {
        vReq.query.token = uploadLocalMatch[1]!;
        return await uploadLocalHandler(vReq, vRes);
      }

      // 5. /api/trips/:token/photos/sign
      const photoSignMatch = pathname.match(/^\/api\/trips\/([^/]+)\/photos\/sign$/);
      if (photoSignMatch) {
        vReq.query.token = photoSignMatch[1]!;
        return await photoSignHandler(vReq, vRes);
      }

      // 6. /api/trips/:token/settlements
      const setMatch = pathname.match(/^\/api\/trips\/([^/]+)\/settlements$/);
      if (setMatch) {
        vReq.query.token = setMatch[1]!;
        return await settlementsHandler(vReq, vRes);
      }

      // 7. /api/trips/:token
      const tripMatch = pathname.match(/^\/api\/trips\/([^/]+)$/);
      if (tripMatch) {
        vReq.query.token = tripMatch[1]!;
        return await getTripHandler(vReq, vRes);
      }

      next();
    } catch (err) {
      console.error('Error handling API route:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: { code: 'INTERNAL', message: (err as Error).message } }));
    }
  });
}

export function viteApiPlugin(): Plugin {
  return {
    name: 'vite-api-plugin',
    configureServer(server) {
      setupApiMiddleware(server);
    },
    configurePreviewServer(server) {
      setupApiMiddleware(server);
    },
  };
}
