import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

/**
 * Endpoint de diagnóstico para testar conexão com Neon
 * Tenta múltiplas variáveis de ambiente
 * GET /api/db-test
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Listar todas as variáveis relacionadas
    const allVars = Object.keys(process.env).filter(k => 
      k.includes('POSTGRES') || k.includes('DATABASE') || k.includes('NEON')
    );
    
    // Tentar múltiplas variáveis
    const connectionString = 
      process.env.POSTGRES_URL || 
      process.env.DATABASE_URL || 
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING;
    
    if (!connectionString) {
      return res.status(500).json({
        success: false,
        error: 'No connection string found',
        availableVars: allVars,
        tried: ['POSTGRES_URL', 'DATABASE_URL', 'POSTGRES_PRISMA_URL', 'POSTGRES_URL_NON_POOLING']
      });
    }
    
    // Tentar conectar
    const sql = neon(connectionString);
    
    // Executar query simples
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    return res.status(200).json({
      success: true,
      message: 'Connection successful',
      usedVar: connectionString.includes('pooler') ? 'POSTGRES_URL (pooled)' : 'DATABASE_URL',
      data: result[0]
    });
    
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3)
    });
  }
}
