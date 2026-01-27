import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { sql } from '../db';
import type { Noticia, NoticiaListResponse, NoticiaStats } from '../types/news';

/**
 * Router de Notícias
 * Gerencia todas as operações relacionadas a notícias do setor elétrico
 */
export const newsRouter = router({
  /**
   * Listar notícias com filtros e paginação
   */
  list: publicProcedure
    .input(z.object({
      limite: z.number().min(1).max(100).default(20),
      pagina: z.number().min(1).default(1),
      fonte: z.string().optional(),
      categoria: z.string().optional(),
      publico_alvo: z.string().optional(),
      busca: z.string().optional(),
      ordenar_por: z.enum(['data', 'relevancia']).default('data'),
    }))
    .query(async ({ input }): Promise<NoticiaListResponse> => {
      const { limite, pagina, fonte, categoria, publico_alvo, busca, ordenar_por } = input;
      const offset = (pagina - 1) * limite;
      
      // Construir query base
      let whereConditions = [`status = 'publicada'`];
      let params: any[] = [];
      let paramIndex = 1;
      
      if (fonte) {
        whereConditions.push(`fonte = $${paramIndex}`);
        params.push(fonte);
        paramIndex++;
      }
      
      if (categoria) {
        whereConditions.push(`$${paramIndex} = ANY(categoria)`);
        params.push(categoria);
        paramIndex++;
      }
      
      if (publico_alvo) {
        whereConditions.push(`$${paramIndex} = ANY(publico_alvo)`);
        params.push(publico_alvo);
        paramIndex++;
      }
      
      if (busca) {
        whereConditions.push(`(titulo ILIKE $${paramIndex} OR resumo ILIKE $${paramIndex})`);
        params.push(`%${busca}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Ordenação
      const orderBy = ordenar_por === 'data' 
        ? 'data_publicacao DESC' 
        : 'relevancia DESC, data_publicacao DESC';
      
      // Buscar notícias
      const noticiasResult = await sql.query(
        `SELECT * FROM noticias 
         WHERE ${whereClause} 
         ORDER BY ${orderBy}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limite, offset]
      );
      
      // Contar total
      const countResult = await sql.query(
        `SELECT COUNT(*) as total FROM noticias WHERE ${whereClause}`,
        params
      );
      
      const total = parseInt(countResult.rows[0].total);
      
      return {
        noticias: noticiasResult.rows as Noticia[],
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
      limite: z.number().min(1).max(20).default(3),
    }))
    .query(async ({ input }): Promise<Noticia[]> => {
      const result = await sql.query(
        `SELECT * FROM noticias 
         WHERE status = 'publicada' 
         ORDER BY data_publicacao DESC 
         LIMIT $1`,
        [input.limite]
      );
      
      return result.rows as Noticia[];
    }),
  
  /**
   * Obter notícia por ID
   */
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ input }): Promise<Noticia> => {
      const result = await sql.query(
        `SELECT * FROM noticias WHERE id = $1`,
        [input.id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Notícia não encontrada');
      }
      
      const noticia = result.rows[0] as Noticia;
      
      // Incrementar visualizações
      await sql.query(
        `UPDATE noticias SET visualizacoes = visualizacoes + 1 WHERE id = $1`,
        [input.id]
      );
      
      return noticia;
    }),
  
  /**
   * Criar notícia (usado pelo workflow n8n)
   */
  create: publicProcedure
    .input(z.object({
      fonte: z.string(),
      url_original: z.string().url(),
      data_publicacao: z.union([z.date(), z.string()]),
      titulo: z.string().min(10).max(500),
      resumo: z.string().optional(),
      conteudo: z.string().optional(),
      imagem_url: z.string().url().optional(),
      categoria: z.array(z.string()).default([]),
      tags: z.array(z.string()).default([]),
      publico_alvo: z.array(z.string()).default([]),
      relevancia: z.number().min(0).max(100).default(50),
      sentimento: z.enum(['positivo', 'neutro', 'negativo']).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Verificar duplicata
        const existingResult = await sql.query(
          `SELECT id FROM noticias WHERE url_original = $1`,
          [input.url_original]
        );
        
        if (existingResult.rows.length > 0) {
          return { 
            success: false, 
            message: 'Notícia já existe', 
            id: existingResult.rows[0].id 
          };
        }
        
        // Converter data se for string
        const dataPublicacao = typeof input.data_publicacao === 'string' 
          ? new Date(input.data_publicacao) 
          : input.data_publicacao;
        
        // Inserir notícia
        const result = await sql.query(
          `INSERT INTO noticias (
            fonte, url_original, data_publicacao, titulo, resumo, conteudo,
            imagem_url, categoria, tags, publico_alvo, relevancia, sentimento, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'publicada')
          RETURNING id`,
          [
            input.fonte,
            input.url_original,
            dataPublicacao,
            input.titulo,
            input.resumo || null,
            input.conteudo || null,
            input.imagem_url || null,
            input.categoria,
            input.tags,
            input.publico_alvo,
            input.relevancia,
            input.sentimento || null,
          ]
        );
        
        return { 
          success: true, 
          message: 'Notícia criada com sucesso', 
          id: result.rows[0].id 
        };
      } catch (error: any) {
        console.error('Error creating noticia:', error);
        return { 
          success: false, 
          message: error.message || 'Erro ao criar notícia',
          error: error.message 
        };
      }
    }),
  
  /**
   * Atualizar notícia
   */
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      titulo: z.string().min(10).max(500).optional(),
      resumo: z.string().optional(),
      conteudo: z.string().optional(),
      imagem_url: z.string().url().optional(),
      categoria: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      publico_alvo: z.array(z.string()).optional(),
      relevancia: z.number().min(0).max(100).optional(),
      sentimento: z.enum(['positivo', 'neutro', 'negativo']).optional(),
      status: z.enum(['rascunho', 'publicada', 'arquivada']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      // Construir query de update dinamicamente
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });
      
      if (updateFields.length === 0) {
        return { success: false, message: 'Nenhum campo para atualizar' };
      }
      
      values.push(id);
      
      await sql.query(
        `UPDATE noticias SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
      
      return { success: true, message: 'Notícia atualizada com sucesso' };
    }),
  
  /**
   * Deletar notícia
   */
  delete: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      await sql.query(
        `DELETE FROM noticias WHERE id = $1`,
        [input.id]
      );
      
      return { success: true, message: 'Notícia deletada com sucesso' };
    }),
  
  /**
   * Obter estatísticas
   */
  getStats: publicProcedure
    .query(async (): Promise<NoticiaStats> => {
      const result = await sql.query(`
        SELECT 
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE data_publicacao >= NOW() - INTERVAL '24 hours')::int as ultimas_24h,
          COUNT(*) FILTER (WHERE data_publicacao >= NOW() - INTERVAL '7 days')::int as ultimos_7_dias,
          COALESCE(AVG(relevancia)::numeric(10,2), 0) as relevancia_media,
          COUNT(DISTINCT fonte)::int as total_fontes
        FROM noticias
        WHERE status = 'publicada'
      `);
      
      return result.rows[0] as NoticiaStats;
    }),
  
  /**
   * Buscar notícias por fonte
   */
  getBySource: publicProcedure
    .input(z.object({
      fonte: z.string(),
      limite: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }): Promise<Noticia[]> => {
      const result = await sql.query(
        `SELECT * FROM noticias 
         WHERE fonte = $1 AND status = 'publicada'
         ORDER BY data_publicacao DESC 
         LIMIT $2`,
        [input.fonte, input.limite]
      );
      
      return result.rows as Noticia[];
    }),
  
  /**
   * Buscar notícias por categoria
   */
  getByCategory: publicProcedure
    .input(z.object({
      categoria: z.string(),
      limite: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }): Promise<Noticia[]> => {
      const result = await sql.query(
        `SELECT * FROM noticias 
         WHERE $1 = ANY(categoria) AND status = 'publicada'
         ORDER BY data_publicacao DESC 
         LIMIT $2`,
        [input.categoria, input.limite]
      );
      
      return result.rows as Noticia[];
    }),
});
