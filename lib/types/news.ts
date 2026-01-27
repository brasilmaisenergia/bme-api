/**
 * Tipos e interfaces para o sistema de notícias
 */

export type NoticiaFonte = 
  | 'ANEEL' 
  | 'MME' 
  | 'ONS' 
  | 'CCEE' 
  | 'EPE' 
  | 'Portal Solar' 
  | 'ABEEólica' 
  | 'ABRACE' 
  | 'InfoMoney' 
  | 'G1' 
  | 'Outros';

export type NoticiaCategoria =
  | 'Regulação'
  | 'Tarifas'
  | 'Mercado Livre'
  | 'Geração'
  | 'Transmissão'
  | 'Distribuição'
  | 'Fontes Renováveis'
  | 'Tecnologia'
  | 'ESG'
  | 'Política Energética'
  | 'Fiscalização'
  | 'Leilões'
  | 'Bandeira Tarifária'
  | 'Comercialização';

export type NoticiaPublicoAlvo =
  | 'Consumidores Residenciais'
  | 'Consumidores Empresas'
  | 'Prestadores de Serviços'
  | 'Comercializadoras'
  | 'Geradores'
  | 'Distribuidoras'
  | 'Novas Comercializadoras';

export type NoticiaSentimento = 'positivo' | 'neutro' | 'negativo';

export type NoticiaStatus = 'rascunho' | 'publicada' | 'arquivada';

export interface Noticia {
  id: string;
  fonte: NoticiaFonte;
  url_original: string;
  data_publicacao: Date;
  titulo: string;
  resumo?: string;
  conteudo?: string;
  imagem_url?: string;
  categoria: NoticiaCategoria[];
  tags: string[];
  publico_alvo: NoticiaPublicoAlvo[];
  relevancia: number; // 0-100
  sentimento?: NoticiaSentimento;
  status: NoticiaStatus;
  visualizacoes: number;
  created_at: Date;
  updated_at: Date;
}

export interface NoticiaInput {
  fonte: NoticiaFonte;
  url_original: string;
  data_publicacao: Date | string;
  titulo: string;
  resumo?: string;
  conteudo?: string;
  imagem_url?: string;
  categoria?: NoticiaCategoria[];
  tags?: string[];
  publico_alvo?: NoticiaPublicoAlvo[];
  relevancia?: number;
  sentimento?: NoticiaSentimento;
}

export interface NoticiaListParams {
  limite?: number;
  pagina?: number;
  fonte?: NoticiaFonte;
  categoria?: NoticiaCategoria;
  publico_alvo?: NoticiaPublicoAlvo;
  busca?: string;
  ordenar_por?: 'data' | 'relevancia';
}

export interface NoticiaPaginacao {
  pagina: number;
  limite: number;
  total: number;
  total_paginas: number;
}

export interface NoticiaListResponse {
  noticias: Noticia[];
  paginacao: NoticiaPaginacao;
}

export interface NoticiaStats {
  total: number;
  ultimas_24h: number;
  ultimos_7_dias: number;
  relevancia_media: number;
  total_fontes: number;
}
