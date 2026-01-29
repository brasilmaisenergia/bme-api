import { neon } from '@neondatabase/serverless';

/**
 * Cliente de banco de dados Neon
 * Tenta múltiplas variáveis de ambiente como fallback
 */

// Tentar múltiplas variáveis (Neon pode criar com nomes diferentes)
const connectionString = 
  process.env.POSTGRES_URL || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!connectionString) {
  const availableVars = Object.keys(process.env)
    .filter(k => k.includes('POSTGRES') || k.includes('DATABASE'))
    .join(', ');
    
  const error = new Error(
    `No database connection string found. ` +
    `Tried: POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING. ` +
    `Available vars: ${availableVars || 'none'}`
  );
  console.error('❌', error.message);
  throw error;
}

console.log('✅ Database connection string found');
export const sql = neon(connectionString);

/**
 * Inicializa o schema do banco de dados
 * Cria a tabela de notícias se não existir
 */
export async function initDatabase() {
  try {
    console.log('📊 Initializing database schema...');
    
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
        name: error.name
      }
    };
  }
}
