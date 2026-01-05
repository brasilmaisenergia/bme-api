import { initTRPC } from '@trpc/server';
import { z } from 'zod';

/**
 * Inicialização do tRPC
 */
const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;
