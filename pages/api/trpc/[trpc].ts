import { createNextApiHandler } from '@trpc/server/adapters/next';
import { appRouter } from '../../../lib/routers';

/**
 * Handler da API tRPC para Next.js
 * Expõe todos os endpoints em /api/trpc/*
 */
export default createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
  onError({ error, type, path }) {
    console.error(`[tRPC Error] ${type} at ${path}:`, error);
  },
  batching: {
    enabled: true,
  },
});
