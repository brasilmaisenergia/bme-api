import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint de teste para verificar variáveis de ambiente disponíveis
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Listar todas as variáveis relacionadas ao banco
    const dbVars = Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || 
      key.includes('POSTGRES') || 
      key.includes('NEON') ||
      key.includes('PG')
    );

    // Verificar quais estão disponíveis
    const available: Record<string, string> = {};
    const missing: string[] = [];

    const varsToCheck = [
      'DATABASE_URL',
      'POSTGRES_URL',
      'POSTGRES_PRISMA_URL',
      'DATABASE_URL_UNPOOLED',
      'POSTGRES_URL_NON_POOLING',
      'NEON_PROJECT_ID',
      'PGHOST',
      'POSTGRES_USER',
      'POSTGRES_PASSWORD',
      'POSTGRES_DATABASE'
    ];

    varsToCheck.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        // Mascarar senha
        available[varName] = value.replace(/:[^:@]+@/, ':****@');
      } else {
        missing.push(varName);
      }
    });

    res.status(200).json({
      success: true,
      message: 'Environment variables check',
      data: {
        allDbVars: dbVars,
        available,
        missing,
        totalEnvVars: Object.keys(process.env).length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error checking environment variables',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}
