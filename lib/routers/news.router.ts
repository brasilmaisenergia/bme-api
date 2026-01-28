import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { sql } from '../db';
import type { Noticia, NoticiaListResponse, NoticiaStats } from '../types/news';

/**
 * Router de Notícias
 * Sistema simplificado onde Eduardo gerencia as notícias
 * Versão simplificada com queries básicas compatíveis com Neon
 */
export const newsRouter = router({
  /**
   * Listar notícias publicadas (versão simplificada)
   */
  list: publicProcedure
    .input(z.object({
      limite: z.number().min(1).max(100).default(20),
      pagina: z.number().min(1).default(1),
    }))
    .query(async ({ input }): Promise<NoticiaListResponse> => {
      const { limite, pagina } = input;
      const offset = (pagina - 1) * limite;
      
      // Buscar notícias publicadas
      const noticias = await sql`
        SELECT * FROM noticias 
        WHERE status = 'publicada'
        ORDER BY data_publicacao DESC
        LIMIT ${limite}
        OFFSET ${offset}
      `;
      
      // Contar total
      const countResult = await sql`
        SELECT COUNT(*) as total FROM noticias 
        WHERE status = 'publicada'
      `;
      
      const total = parseInt(String(countResult[0].total));
      
      return {
        noticias: noticias as Noticia[],
        paginacao: {
          pagina,
          limite,
          total,
          total_paginas: Math.ceil(total / limite),
        },
      };
    }),

  /**
   * Listar todas as notícias (para painel admin)
   */
  listAll: publicProcedure
    .input(z.object({
      limite: z.number().min(1).max(100).default(20),
      pagina: z.number().min(1).default(1),
    }))
    .query(async ({ input }): Promise<NoticiaListResponse> => {
      const { limite, pagina } = input;
      const offset = (pagina - 1) * limite;
      
      const noticias = await sql`
        SELECT * FROM noticias 
        ORDER BY created_at DESC
        LIMIT ${limite}
        OFFSET ${offset}
      `;
      
      const countResult = await sql`
        SELECT COUNT(*) as total FROM noticias
      `;
      
      const total = parseInt(String(countResult[0].total));
      
      return {
        noticias: noticias as Noticia[],
        paginacao: {
          pagina,
          limite,
          total,
          total_paginas: Math.ceil(total / limite),
        },
      };
    }),

  /**
   * Obter últimas notícias (para home)
   */
  getLatest: publicProcedure
    .input(z.object({
      limite: z.number().min(1).max(10).default(3),
    }))
    .query(async ({ input }) => {
      const noticias = await sql`
        SELECT * FROM noticias 
        WHERE status = 'publicada'
        ORDER BY data_publicacao DESC
        LIMIT ${input.limite}
      `;
      
      return noticias as Noticia[];
    }),

  /**
   * Obter notícia por ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const result = await sql`
        SELECT * FROM noticias 
        WHERE id = ${input.id}
      `;
      
      if (result.length === 0) {
        throw new Error('Notícia não encontrada');
      }
      
      // Incrementar visualizações
      await sql`
        UPDATE noticias 
        SET visualizacoes = visualizacoes + 1
        WHERE id = ${input.id}
      `;
      
      return result[0] as Noticia;
    }),

  /**
   * Criar nova notícia (para Eduardo via painel admin)
   */
  create: publicProcedure
    .input(z.object({
      fonte: z.string(),
      url_original: z.string().url(),
      data_publicacao: z.string(),
      titulo: z.string(),
      resumo: z.string().optional(),
      conteudo: z.string().optional(),
      imagem_url: z.string().url().optional(),
      categoria: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      publico_alvo: z.array(z.string()).default([]),
      relevancia: z.number().min(0).max(100).default(50),
      analise_eduardo: z.string().optional(),
      status: z.enum(['rascunho', 'publicada', 'arquivada']).default('rascunho'),
    }))
    .mutation(async ({ input }) => {
      const result = await sql`
        INSERT INTO noticias (
          fonte, url_original, data_publicacao, titulo, resumo, conteudo,
          imagem_url, categoria, tags, publico_alvo, relevancia,
          analise_eduardo, status
        ) VALUES (
          ${input.fonte},
          ${input.url_original},
          ${input.data_publicacao},
          ${input.titulo},
          ${input.resumo || null},
          ${input.conteudo || null},
          ${input.imagem_url || null},
          ${input.categoria},
          ${input.tags},
          ${input.publico_alvo},
          ${input.relevancia},
          ${input.analise_eduardo || null},
          ${input.status}
        )
        RETURNING *
      `;
      
      return result[0] as Noticia;
    }),

  /**
   * Atualizar notícia (para Eduardo editar)
   * Versão simplificada: atualiza todos os campos
   */
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      titulo: z.string(),
      resumo: z.string().nullable(),
      conteudo: z.string().nullable(),
      imagem_url: z.string().url().nullable(),
      categoria: z.array(z.string()),
      tags: z.array(z.string()),
      publico_alvo: z.array(z.string()),
      relevancia: z.number().min(0).max(100),
      analise_eduardo: z.string().nullable(),
      status: z.enum(['rascunho', 'publicada', 'arquivada']),
    }))
    .mutation(async ({ input }) => {
      const result = await sql`
        UPDATE noticias 
        SET 
          titulo = ${input.titulo},
          resumo = ${input.resumo},
          conteudo = ${input.conteudo},
          imagem_url = ${input.imagem_url},
          categoria = ${input.categoria},
          tags = ${input.tags},
          publico_alvo = ${input.publico_alvo},
          relevancia = ${input.relevancia},
          analise_eduardo = ${input.analise_eduardo},
          status = ${input.status}
        WHERE id = ${input.id}
        RETURNING *
      `;
      
      if (result.length === 0) {
        throw new Error('Notícia não encontrada');
      }
      
      return result[0] as Noticia;
    }),

  /**
   * Deletar notícia
   */
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const result = await sql`
        DELETE FROM noticias 
        WHERE id = ${input.id}
        RETURNING id
      `;
      
      if (result.length === 0) {
        throw new Error('Notícia não encontrada');
      }
      
      return { success: true, id: result[0].id };
    }),

  /**
   * Obter estatísticas
   */
  getStats: publicProcedure
    .query(async (): Promise<NoticiaStats> => {
      const totalResult = await sql`SELECT COUNT(*) as count FROM noticias`;
      const publicadasResult = await sql`SELECT COUNT(*) as count FROM noticias WHERE status = 'publicada'`;
      const rascunhosResult = await sql`SELECT COUNT(*) as count FROM noticias WHERE status = 'rascunho'`;
      
      const porFonteResult = await sql`
        SELECT fonte, COUNT(*) as count 
        FROM noticias 
        GROUP BY fonte
      `;
      
      const porCategoriaResult = await sql`
        SELECT UNNEST(categoria) as cat, COUNT(*) as count 
        FROM noticias 
        WHERE array_length(categoria, 1) > 0
        GROUP BY cat
      `;
      
      const por_fonte: Record<string, number> = {};
      porFonteResult.forEach((row: any) => {
        por_fonte[row.fonte] = parseInt(String(row.count));
      });
      
      const por_categoria: Record<string, number> = {};
      porCategoriaResult.forEach((row: any) => {
        por_categoria[row.cat] = parseInt(String(row.count));
      });
      
      return {
        total: parseInt(String(totalResult[0].count)),
        publicadas: parseInt(String(publicadasResult[0].count)),
        rascunhos: parseInt(String(rascunhosResult[0].count)),
        por_fonte,
        por_categoria,
      };
    }),
});
