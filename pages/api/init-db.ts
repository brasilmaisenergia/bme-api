import type { NextApiRequest, NextApiResponse } from 'next';
import { initDatabase } from '../../lib/db';

/**
 * Endpoint para inicializar o schema do banco de dados
 * GET /api/init-db
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const result = await initDatabase();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Database initialized successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to initialize database',
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error in init-db endpoint:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: {
        message: error.message,
        name: error.name,
      },
    });
  }
}
