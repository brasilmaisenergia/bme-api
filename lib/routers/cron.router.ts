import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { ONSService } from '../services/ons.service';
import { PLDService } from '../services/pld.service';
import { BandeiraService } from '../services/bandeira.service';
import { IndicatorsUpdateResult } from '../types/indicators';

const onsService = new ONSService();
const pldService = new PLDService();
const bandeiraService = new BandeiraService();

/**
 * Router para operações de cron/agendamento
 */
export const cronRouter = router({
  /**
   * Endpoint principal: Atualiza todos os indicadores
   */
  updateIndicators: publicProcedure
    .input(
      z.object({
        force: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }): Promise<IndicatorsUpdateResult> => {
      const timestamp = new Date().toISOString();
      const result: IndicatorsUpdateResult = {
        success: false,
        timestamp,
      };

      try {
        // 1. Buscar dados do ONS
        console.log('[CRON] Buscando dados do ONS...');
        try {
          const onsData = await onsService.getAllIndicators();
          result.ons = {
            success: true,
            data: onsData,
          };
          console.log('[CRON] ONS: Sucesso', onsData);
        } catch (error: any) {
          result.ons = {
            success: false,
            error: error.message || 'Erro ao buscar dados do ONS',
          };
          console.error('[CRON] ONS: Erro', error);
        }

        // 2. Buscar dados de PLD
        console.log('[CRON] Buscando dados de PLD...');
        try {
          const pldData = await pldService.getPLD();
          result.pld = {
            success: true,
            data: pldData,
          };
          console.log('[CRON] PLD: Sucesso', pldData);
        } catch (error: any) {
          result.pld = {
            success: false,
            error: error.message || 'Erro ao buscar dados de PLD',
          };
          console.error('[CRON] PLD: Erro', error);
        }

        // 3. Calcular bandeira tarifária
        console.log('[CRON] Calculando bandeira tarifária...');
        try {
          if (result.ons?.data && result.pld?.data) {
            const bandeiraData = bandeiraService.calculateBandeira(
              result.ons.data.ear,
              result.pld.data.media
            );
            result.bandeira = {
              success: true,
              data: bandeiraData,
            };
            console.log('[CRON] Bandeira: Sucesso', bandeiraData);
          } else {
            result.bandeira = {
              success: false,
              error: 'Dados insuficientes para calcular bandeira',
            };
          }
        } catch (error: any) {
          result.bandeira = {
            success: false,
            error: error.message || 'Erro ao calcular bandeira',
          };
          console.error('[CRON] Bandeira: Erro', error);
        }

        // 4. Cleanup de dados antigos (simulado)
        console.log('[CRON] Executando cleanup...');
        try {
          // Simular limpeza de dados antigos
          const deletedRecords = Math.floor(Math.random() * 100);
          result.cleanup = {
            success: true,
            deletedRecords,
          };
          console.log('[CRON] Cleanup: Sucesso', { deletedRecords });
        } catch (error: any) {
          result.cleanup = {
            success: false,
            error: error.message || 'Erro ao executar cleanup',
          };
          console.error('[CRON] Cleanup: Erro', error);
        }

        // Determinar sucesso geral
        result.success =
          result.ons?.success === true &&
          result.pld?.success === true &&
          result.bandeira?.success === true &&
          result.cleanup?.success === true;

        console.log('[CRON] Resultado final:', {
          success: result.success,
          timestamp: result.timestamp,
        });

        return result;
      } catch (error: any) {
        console.error('[CRON] Erro geral:', error);
        return {
          success: false,
          timestamp,
          ons: { success: false, error: 'Erro geral' },
          pld: { success: false, error: 'Erro geral' },
          bandeira: { success: false, error: 'Erro geral' },
          cleanup: { success: false, error: error.message },
        };
      }
    }),

  /**
   * Endpoint para buscar indicadores atuais (sem atualizar)
   */
  getIndicators: publicProcedure.query(async () => {
    const onsData = await onsService.getAllIndicators();
    const pldData = await pldService.getPLD();
    const bandeiraData = bandeiraService.calculateBandeira(
      onsData.ear,
      pldData.media
    );

    return {
      ons: onsData,
      pld: pldData,
      bandeira: bandeiraData,
      timestamp: new Date().toISOString(),
    };
  }),
});
