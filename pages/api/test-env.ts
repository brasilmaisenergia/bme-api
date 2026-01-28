import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint de teste para verificar variáveis de ambiente
 * GET /api/test-env
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const envVars = {
    POSTGRES_URL: process.env.POSTGRES_URL ? '✅ Set' : '❌ Missing',
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '✅ Set' : '❌ Missing',
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return res.status(200).json(envVars);
}
