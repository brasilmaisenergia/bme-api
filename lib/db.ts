import { neon } from '@neondatabase/serverless';

/**
 * Cliente de banco de dados Neon
 * Utiliza DATABASE_URL ou POSTGRES_URL do ambiente
 */
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

export const sql = neon(connectionString);

/**
 * Inicializa o schema do banco de dados
 * Cria a tabela de notícias se não existir
 */
export async function initDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS noticias (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Informações da Fonte
        fonte VARCHAR(50) NOT NULL,
        url_original TEXT NOT NULL UNIQUE,
        data_publicacao TIMESTAMP NOT NULL,
        
        -- Conteúdo
        titulo TEXT NOT NULL,
        resumo TEXT,
        conteudo TEXT,
        imagem_url TEXT,
        
        -- Categorização
        categoria TEXT[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        publico_alvo TEXT[] DEFAULT '{}',
        
        -- Análise
        relevancia INTEGER DEFAULT 0 CHECK (relevancia >= 0 AND relevancia <= 100),
        sentimento VARCHAR(20),
        
        -- Controle
        status VARCHAR(20) DEFAULT 'publicada' CHECK (status IN ('rascunho', 'publicada', 'arquivada')),
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
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return { success: false, error };
  }
}
