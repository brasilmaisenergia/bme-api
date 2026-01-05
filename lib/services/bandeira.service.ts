import { BandeiraTarifariaData } from '../types/indicators';

/**
 * Serviço para determinar bandeira tarifária
 * Baseado em dados de EAR e PLD
 */
export class BandeiraService {
  /**
   * Calcula bandeira tarifária baseado em EAR e PLD
   */
  calculateBandeira(ear: number, pldMedio: number): BandeiraTarifariaData {
    const now = new Date();
    const mes = now.toLocaleString('pt-BR', { month: 'long' });
    const ano = now.getFullYear();

    // Lógica de determinação da bandeira
    // Verde: EAR > 60% ou PLD < 100
    // Amarela: EAR 40-60% ou PLD 100-200
    // Vermelha 1: EAR 30-40% ou PLD 200-300
    // Vermelha 2: EAR < 30% ou PLD > 300

    if (ear > 60 || pldMedio < 100) {
      return {
        tipo: 'verde',
        valor: 0,
        mes,
        ano,
      };
    }

    if (ear > 40 || pldMedio < 200) {
      return {
        tipo: 'amarela',
        valor: 1.88, // R$ 1,88 por 100 kWh
        mes,
        ano,
      };
    }

    if (ear > 30 || pldMedio < 300) {
      return {
        tipo: 'vermelha-1',
        valor: 4.46, // R$ 4,46 por 100 kWh
        mes,
        ano,
      };
    }

    return {
      tipo: 'vermelha-2',
      valor: 7.87, // R$ 7,87 por 100 kWh
      mes,
      ano,
    };
  }

  /**
   * Retorna cor CSS baseada no tipo de bandeira
   */
  getBandeiraCor(tipo: BandeiraTarifariaData['tipo']): string {
    const cores: Record<BandeiraTarifariaData['tipo'], string> = {
      'verde': 'bg-green-500',
      'amarela': 'bg-yellow-500',
      'vermelha-1': 'bg-red-500',
      'vermelha-2': 'bg-red-700',
    };

    return cores[tipo];
  }
}
