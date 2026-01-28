/**
 * Tipos para o sistema de notícias
 * Sistema simplificado onde Eduardo é o administrador
 */

export interface Noticia {
  id: string;
  
  // Informações da Fonte
  fonte: string;
  url_original: string;
  data_publicacao: Date;
  
  // Conteúdo (editado por Eduardo)
  titulo: string;
  resumo?: string;
  conteudo?: string;
  imagem_url?: string;
  
  // Categorização (feita por Eduardo)
  categoria: string[];
  tags: string[];
  publico_alvo: string[];
  
  // Análise (feita por Eduardo)
  relevancia: number; // 0-100
  analise_eduardo?: string; // Campo especial para análise do Eduardo
  
  // Controle
  status: 'rascunho' | 'publicada' | 'arquivada';
  visualizacoes: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface NoticiaInput {
  fonte: string;
  url_original: string;
  data_publicacao: string;
  titulo: string;
  resumo?: string;
  conteudo?: string;
  imagem_url?: string;
  categoria?: string[];
  tags?: string[];
  publico_alvo?: string[];
  relevancia?: number;
  analise_eduardo?: string;
  status?: 'rascunho' | 'publicada' | 'arquivada';
}

export interface NoticiaListResponse {
  noticias: Noticia[];
  paginacao: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
}

export interface NoticiaStats {
  total: number;
  publicadas: number;
  rascunhos: number;
  por_fonte: Record<string, number>;
  por_categoria: Record<string, number>;
}
