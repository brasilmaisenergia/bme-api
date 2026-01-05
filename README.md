# BME API - Brasil Mais Energia

Backend API para atualização automática de indicadores do setor elétrico brasileiro.

## 🎯 Funcionalidades

- **Atualização Automática de Indicadores**
  - ONS: Energia Armazenada (EAR), Carga, Geração
  - PLD: Preço de Liquidação das Diferenças (todas as regiões)
  - Bandeira Tarifária: Calculada automaticamente
  
- **API tRPC**
  - Type-safe endpoints
  - Validação automática com Zod
  - Integração fácil com frontend

- **Integração com n8n**
  - Workflow automático diário
  - Notificações em caso de falha
  - Logging estruturado

## 🚀 Deploy

### Vercel (Recomendado)

1. Push para GitHub
2. Conectar repositório no Vercel
3. Deploy automático

### Local

```bash
npm install
npm run dev
```

## 📡 Endpoints

### POST /api/trpc/cron.updateIndicators

Atualiza todos os indicadores.

**Request:**
```json
{
  "force": false
}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-05T10:00:00.000Z",
  "ons": {
    "success": true,
    "data": {
      "ear": 53.5,
      "carga": 67500,
      "geracao": 68200,
      "dataReferencia": "2026-01-05"
    }
  },
  "pld": {
    "success": true,
    "data": {
      "sudeste": 186.50,
      "sul": 182.30,
      "nordeste": 189.20,
      "norte": 192.10,
      "media": 187.53,
      "dataReferencia": "2026-01-05"
    }
  },
  "bandeira": {
    "success": true,
    "data": {
      "tipo": "amarela",
      "valor": 1.88,
      "mes": "janeiro",
      "ano": 2026
    }
  },
  "cleanup": {
    "success": true,
    "deletedRecords": 45
  }
}
```

### GET /api/trpc/cron.getIndicators

Retorna indicadores atuais sem atualizar.

## 🔧 Tecnologias

- **Next.js 14** - Framework React
- **tRPC 10** - Type-safe API
- **TypeScript** - Tipagem estática
- **Axios** - HTTP client
- **Cheerio** - Web scraping
- **Zod** - Validação de schemas

## 📊 Fontes de Dados

- **ONS**: https://dados.ons.org.br (API CKAN)
- **CCEE**: https://www.ccee.org.br (Web scraping)

## 🔐 Segurança

- CORS configurado
- Rate limiting (via Vercel)
- Timeout em requisições externas
- Fallback para dados indisponíveis

## 📝 Licença

MIT © Brasil Mais Energia

---

**Desenvolvido por**: Manus AI  
**Data**: Janeiro 2026  
**Versão**: 1.0.0
