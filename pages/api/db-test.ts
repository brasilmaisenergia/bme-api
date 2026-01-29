import type { NextApiRequest, NextApiResponse } from 'next';
import { neon } from '@neondatabase/serverless';

/**
 * Endpoint de diagnóstico para testar conexão com Neon
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
    // Verificar variável de ambiente
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      return res.status(500).json({
        success: false,
        error: 'POSTGRES_URL not found',
        availableVars: Object.keys(process.env).filter(k => k.includes('POSTGRES') || k.includes('DATABASE'))
      });
    }
    
    // Tentar conectar
    const sql = neon(connectionString);
    
    // Executar query simples
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    return res.status(200).json({
      success: true,
      message: 'Connection successful',
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
