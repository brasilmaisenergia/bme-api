export interface ONSData {
  ear: number; // Energia Armazenada em %
  carga: number; // Carga em MW
  geracao: number; // Geração em MW
  dataReferencia: string;
}

export interface PLDData {
  sudeste: number;
  sul: number;
  nordeste: number;
  norte: number;
  media: number;
  dataReferencia: string;
}

export interface BandeiraTarifariaData {
  tipo: 'verde' | 'amarela' | 'vermelha-1' | 'vermelha-2';
  valor: number; // Valor adicional em R$/100kWh
  mes: string;
  ano: number;
}

export interface IndicatorsUpdateResult {
  success: boolean;
  timestamp: string;
  ons?: {
    success: boolean;
    data?: ONSData;
    error?: string;
  };
  pld?: {
    success: boolean;
    data?: PLDData;
    error?: string;
  };
  bandeira?: {
    success: boolean;
    data?: BandeiraTarifariaData;
    error?: string;
  };
  cleanup?: {
    success: boolean;
    deletedRecords?: number;
    error?: string;
  };
}
