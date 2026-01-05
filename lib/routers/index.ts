import { router } from '../trpc';
import { cronRouter } from './cron.router';

/**
 * Router principal da aplicação
 * Agrega todos os routers específicos
 */
export const appRouter = router({
  cron: cronRouter,
});

export type AppRouter = typeof appRouter;
