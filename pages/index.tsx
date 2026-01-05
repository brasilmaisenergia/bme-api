import React from 'react';

export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '20px',
      lineHeight: '1.6'
    }}>
      <h1>🔌 BME API - Brasil Mais Energia</h1>
      <p>Backend API para atualização automática de indicadores do setor elétrico.</p>
      
      <h2>📊 Endpoints Disponíveis</h2>
      <ul>
        <li>
          <strong>POST /api/trpc/cron.updateIndicators</strong>
          <br />
          Atualiza todos os indicadores (ONS, PLD, Bandeira Tarifária)
        </li>
        <li>
          <strong>GET /api/trpc/cron.getIndicators</strong>
          <br />
          Retorna indicadores atuais sem atualizar
        </li>
      </ul>

      <h2>🔍 Indicadores Monitorados</h2>
      <ul>
        <li><strong>ONS</strong>: Energia Armazenada (EAR), Carga, Geração</li>
        <li><strong>PLD</strong>: Preço de Liquidação das Diferenças (todas as regiões)</li>
        <li><strong>Bandeira Tarifária</strong>: Calculada automaticamente</li>
      </ul>

      <h2>🚀 Status</h2>
      <p style={{ 
        background: '#10b981', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '5px',
        display: 'inline-block'
      }}>
        ✅ API Online e Funcional
      </p>

      <h2>📝 Documentação</h2>
      <p>
        Esta API é consumida automaticamente pelo workflow n8n configurado para 
        executar diariamente às 02:00 UTC (23:00 Brasília).
      </p>

      <hr style={{ margin: '30px 0' }} />
      
      <p style={{ color: '#666', fontSize: '14px' }}>
        <strong>Brasil Mais Energia</strong> - Transformando o setor elétrico brasileiro
        <br />
        Desenvolvido por Manus AI • {new Date().getFullYear()}
      </p>
    </div>
  );
}
