import { router } from '../trpc';
import { cronRouter } from './cron.router';
import { newsRouter } from './news.router';

/**
 * Router principal da aplicação
 * Agrega todos os routers específicos
 */
export const appRouter = router({
  cron: cronRouter,
  news: newsRouter,
});

export type AppRouter = typeof appRouter;
