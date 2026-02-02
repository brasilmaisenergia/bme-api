import { neon } from '@neondatabase/serverless';

/**
 * Cliente de banco de dados Neon
 * Usa DATABASE_URL ou POSTGRES_URL (variáveis da integração Neon via Vercel)
 */

// Tentar múltiplas variáveis que o Neon pode criar
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED;

if (!connectionString) {
  // Não lançar exceção, apenas logar para debug
  console.error('❌ No database connection string found');
  console.error('Tried: DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL_UNPOOLED');
  console.error('Available env vars:', Object.keys(process.env).filter(k => 
    k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('NEON') || k.includes('PG')
  ));
}

// Exportar sql mesmo se não houver connection string (para não quebrar imports)
export const sql = connectionString ? neon(connectionString) : null as any;

/**
 * Inicializa o schema do banco de dados
 * Cria a tabela de notícias se não existir
 */
export async function initDatabase() {
  try {
    if (!sql) {
      return {
        success: false,
        error: {
          message: 'Database connection not configured. No valid connection string found in environment variables.',
          code: 'NO_CONNECTION_STRING',
          name: 'ConfigurationError',
          details: 'Tried: DATABASE_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL_UNPOOLED'
        }
      };
    }

    console.log('📊 Initializing database schema...');
    console.log('✅ Connection string found, attempting to connect...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS noticias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Informações da Fonte
        fonte VARCHAR(50) NOT NULL,
        url_original TEXT NOT NULL UNIQUE,
        data_publicacao TIMESTAMP NOT NULL,
        
        -- Conteúdo (editado por Eduardo)
        titulo TEXT NOT NULL,
        resumo TEXT,
        conteudo TEXT,
        imagem_url TEXT,
        
        -- Categorização (feita por Eduardo)
        categoria TEXT[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        publico_alvo TEXT[] DEFAULT '{}',
        
        -- Análise (feita por Eduardo)
        relevancia INTEGER DEFAULT 50 CHECK (relevancia >= 0 AND relevancia <= 100),
        analise_eduardo TEXT,
        
        -- Controle
        status VARCHAR(20) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicada', 'arquivada')),
        visualizacoes INTEGER DEFAULT 0,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Criar índices para performance
    await sql`CREATE INDEX IF NOT EXISTS idx_noticias_data ON noticias(data_publicacao DESC);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_noticias_fonte ON noticias(fonte);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_noticias_status ON noticias(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_noticias_relevancia ON noticias(relevancia DESC);`;

    // Criar trigger para updated_at
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = NOW();
         RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    await sql`
      DROP TRIGGER IF EXISTS update_noticias_updated_at ON noticias;
    `;

    await sql`
      CREATE TRIGGER update_noticias_updated_at 
      BEFORE UPDATE ON noticias
      FOR EACH ROW 
      EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('✅ Database schema initialized successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error initializing database:', error);
    return { 
      success: false, 
      error: {
        message: error.message,
        code: error.code,
        name: error.name,
        stack: error.stack
      }
    };
  }
}
