# Backend Architektura - Martin AI s Kalkulacemi a Vizualizacemi

## 🎯 Cíl

Backend pro AI agenta Martina s:
- ✅ **HeyGen video avatar** - vizuální reprezentace
- ✅ **Kalkulace úspor** - spotové ceny elektřiny
- ✅ **Grafy a vizualizace** - interaktivní charts
- ✅ **Persistentní data** - historie, predikce

---

## 🏗️ AWS Serverless Architektura

```
┌─────────────────────────────────────────────────────┐
│              API Gateway (REST API)                  │
│  /api/chat          - AI konverzace + kalkulace     │
│  /api/avatar        - HeyGen session management     │
│  /api/prices        - Spotové ceny                  │
│  /api/calculations  - Historie kalkulací            │
│  /api/charts        - Graf data                     │
└────────────┬────────────────────────────────────────┘
             │
    ┌────────┴────────────────────┐
    │                             │
┌───▼──────────┐          ┌──────▼────────┐
│ Lambda       │          │ Lambda        │
│ Conversation │          │ Analytics     │
│ (Chat + AI)  │          │ (Kalkulace)   │
└───┬──────────┘          └──────┬────────┘
    │                             │
    │         ┌──────▼────────┐   │
    │         │ Lambda Media  │   │
    │         │ (HeyGen)      │   │
    │         └──────┬────────┘   │
    │                │            │
    └────────────────┼────────────┘
                     │
         ┌───────────▼────────────┐
         │      DynamoDB          │
         │  - SpotPrices         │
         │  - Calculations       │
         │  - ChatSessions       │
         │  - AvatarSessions     │
         └───────────────────────┘
```

---

## 📊 DynamoDB Schema

### 1. SpotPrices Table - Spotové ceny elektřiny

```typescript
{
  // Partition Key
  date: string              // "2025-01-20" (YYYY-MM-DD)
  
  // Sort Key  
  hour: number              // 0-23
  
  // Attributes
  region: string            // "CZ", "SK"
  pricePerMWh: number       // Cena v EUR/MWh
  pricePerKWh: number       // Cena v EUR/kWh (automaticky vypočteno)
  source: string            // "OTE", "EPEX"
  
  // GSI pro query podle regionu
  GSI_Region: string        // region#date
  
  // TTL (automatické mazání starých dat po 2 letech)
  ttl: number               // Unix timestamp
}
```

### 2. Calculations Table - Uživatelské kalkulace

```typescript
{
  // Partition Key
  sessionId: string         // Browser session ID
  
  // Sort Key
  calculationId: string     // UUID
  
  // Input data
  monthlyConsumption: number    // kWh/měsíc
  currentTariff: number         // EUR/kWh (fixní cena)
  region: string                // "CZ" nebo "SK"
  
  // Output data
  averageSpotPrice: number      // Průměrná spotová cena
  estimatedSavings: number      // Odhad úspory v EUR/měsíc
  savingsPercentage: number     // Úspora v %
  
  // Metadata
  createdAt: string         // ISO 8601
  chartData: object         // Uložená data pro graf
  
  // TTL (smazání po 30 dnech)
  ttl: number
}
```

### 3. ChatSessions Table - Chat konverzace

```typescript
{
  // Partition Key
  sessionId: string         // Browser session ID
  
  // Sort Key
  messageId: string         // UUID
  
  // Message data
  role: "user" | "assistant"
  content: string
  
  // Structured data (pokud AI vrátí kalkulaci/graf)
  structuredData?: {
    type: "calculation" | "chart" | "text"
    calculationId?: string      // Odkaz na Calculations table
    chartConfig?: ChartConfig   // Konfigurace grafu
    savingsSummary?: {
      monthlySavings: number
      yearlySavings: number
      percentage: number
    }
  }
  
  // HeyGen synchronizace
  heygenVideoId?: string    // ID video odpovědi z HeyGen
  
  createdAt: string
}
```

### 4. AvatarSessions Table - HeyGen sessions

```typescript
{
  // Partition Key
  sessionId: string         // Browser session ID
  
  // HeyGen data
  heygenSessionId: string   // HeyGen API session
  streamingUrl?: string     // WebRTC/streaming URL
  status: "active" | "inactive" | "error"
  
  // Metadata
  createdAt: string
  lastActiveAt: string
  
  // TTL (smazání po 1 hodině neaktivity)
  ttl: number
}
```

---

## 🔌 API Endpoints

### 1. POST /api/chat - AI Konverzace s kalkulacemi

**Request:**
```json
{
  "message": "Kolik ušetřím pokud spotřebuji 500 kWh měsíčně?",
  "sessionId": "user-session-123",
  "context": {
    "region": "CZ",
    "currentTariff": 0.15  // EUR/kWh (volitelné)
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "role": "assistant",
        "content": "Při spotřebě 500 kWh měsíčně a průměrné spotové ceně 0.12 EUR/kWh můžete ušetřit až 15 EUR měsíčně oproti fixní ceně 0.15 EUR/kWh.",
        "heygenVideoId": "video-abc123"  // ID pro video odpověď
      }
    ],
    
    // Structured data pro frontend
    "charts": [
      {
        "id": "savings-comparison",
        "type": "bar",
        "title": "Porovnání Fixní vs. Spotová Cena",
        "series": [
          {
            "name": "Fixní cena",
            "data": [75, 75, 75, 75, 75, 75]  // EUR/měsíc
          },
          {
            "name": "Spotová cena",
            "data": [60, 58, 62, 59, 61, 60]  // EUR/měsíc
          }
        ],
        "xAxis": ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen"],
        "meta": {
          "unit": "EUR",
          "period": "monthly"
        }
      },
      {
        "id": "spot-price-trend",
        "type": "line",
        "title": "Vývoj Spotové Ceny (Poslední 7 Dní)",
        "series": [
          {
            "name": "EUR/kWh",
            "data": [0.12, 0.11, 0.13, 0.12, 0.10, 0.11, 0.12]
          }
        ],
        "xAxis": ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]
      }
    ],
    
    "savingsSummary": {
      "monthlySavings": 15,      // EUR
      "yearlySavings": 180,      // EUR
      "percentage": 20,          // %
      "calculationId": "calc-xyz789"  // Pro historii
    }
  }
}
```

---

### 2. POST /api/avatar/session - Vytvoření HeyGen session

**Request:**
```json
{
  "sessionId": "user-session-123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "heygenSessionId": "hg-session-abc",
    "streamingUrl": "wss://streaming.heygen.com/...",
    "avatarId": "martin-avatar-v1",
    "status": "active"
  }
}
```

---

### 3. POST /api/avatar/speak - HeyGen promluví text

**Request:**
```json
{
  "sessionId": "user-session-123",
  "text": "Při spotřebě 500 kWh můžete ušetřit až 15 EUR měsíčně.",
  "messageId": "msg-123"  // Propojení s chat zprávou
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "videoId": "video-abc123",
    "status": "generating",
    "estimatedDuration": 5  // sekund
  }
}
```

---

### 4. GET /api/prices/current - Aktuální spotové ceny

**Query params:** `?region=CZ&hours=24`

**Response:**
```json
{
  "success": true,
  "data": {
    "region": "CZ",
    "currentHour": {
      "hour": 14,
      "pricePerKWh": 0.12,
      "pricePerMWh": 120
    },
    "hourly": [
      { "hour": 0, "price": 0.08 },
      { "hour": 1, "price": 0.07 },
      // ... 24 hodin
    ],
    "average24h": 0.11,
    "updatedAt": "2025-01-20T14:00:00Z"
  }
}
```

---

### 5. GET /api/calculations/history - Historie kalkulací

**Query params:** `?sessionId=user-session-123&limit=10`

**Response:**
```json
{
  "success": true,
  "data": {
    "calculations": [
      {
        "calculationId": "calc-xyz789",
        "monthlyConsumption": 500,
        "estimatedSavings": 15,
        "savingsPercentage": 20,
        "createdAt": "2025-01-20T14:30:00Z"
      }
    ]
  }
}
```

---

## 🤖 AI Response Format (Structured)

AI musí vracet **strukturovaná data** v JSON formátu:

```typescript
interface AIResponse {
  // Textová odpověď
  content: string;
  
  // Kalkulace (pokud uživatel žádá výpočet)
  calculation?: {
    input: {
      monthlyConsumption: number;
      currentTariff?: number;
      region: string;
    };
    output: {
      averageSpotPrice: number;
      monthlySavings: number;
      yearlySavings: number;
      percentage: number;
    };
  };
  
  // Grafy (pokud má smysl zobrazit vizualizaci)
  charts?: ChartConfig[];
  
  // HeyGen video (volitelné)
  generateVideo?: boolean;
}

interface ChartConfig {
  id: string;
  type: "line" | "bar" | "area" | "pie";
  title: string;
  series: Array<{
    name: string;
    data: number[];
  }>;
  xAxis?: string[];
  meta?: {
    unit: string;
    period: "hourly" | "daily" | "monthly" | "yearly";
  };
}
```

---

## 🎬 HeyGen Integration Flow

### Async Flow (Doporučeno pro nízkou latenci)

```
1. User pošle zprávu → POST /api/chat
2. Backend:
   a) Zavolá AI API (bez čekání na HeyGen)
   b) Vrátí textovou odpověď OKAMŽITĚ
   c) Asynchronně zavolá HeyGen API
3. Frontend zobrazí text
4. HeyGen vygeneruje video (3-10s)
5. WebSocket update → frontend zobrazí video
```

### Real-time Flow (Pro live streaming)

```
1. User otevře chat → POST /api/avatar/session
2. Backend vytvoří HeyGen streaming session
3. Frontend otevře WebRTC/WebSocket stream
4. User pošle zprávu
5. Backend pošle text do HeyGen
6. Avatar "mluví" live přes stream
```

---

## 📥 External Data Sources - Spotové Ceny

### OTE (Operator trhu s elektřinou) - ČR

**API Endpoint:**
```
https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh/@@chart-data
```

**Frekvence:** Hodinově  
**Data:** Spotové ceny pro český trh

### EPEX SPOT - EU trhy

**API Endpoint:**
```
https://transparency.entsoe.eu/api (vyžaduje registraci)
```

**Alternativa:** Můžeme začít s **mock daty** a později připojit real API.

### Data Ingestion (AWS EventBridge)

```
EventBridge Schedule (každou hodinu)
  → Lambda IngestPrices
    → Stáhne data z OTE/EPEX
    → Uloží do DynamoDB SpotPrices
    → Aktualizuje predikce
```

---

## 🔐 Secrets Management (AWS Secrets Manager)

```json
{
  "HEYGEN_API_KEY": "your-heygen-api-key",
  "AI_API_URL": "https://your-ai-api.com/chat",
  "AI_API_KEY": "your-ai-api-key",
  "OTE_API_KEY": "optional-if-needed",
  "EPEX_API_TOKEN": "optional-if-needed"
}
```

---

## 📦 Lambda Functions

### 1. ConversationLambda (`functions/conversation.ts`)

**Odpovědnost:**
- Přijme user message
- Zavolá AI API
- Parse strukturovanou odpověď
- Pokud obsahuje kalkulaci → zavolá AnalyticsLambda
- Pokud má generovat video → zavolá MediaLambda  
- Uloží do ChatSessions
- Vrátí response

### 2. AnalyticsLambda (`functions/analytics.ts`)

**Odpovědnost:**
- Načte spotové ceny z DynamoDB
- Vypočte úspory
- Vygeneruje chart data
- Uloží kalkulaci do Calculations table
- Vrátí strukturovaná data

### 3. MediaLambda (`functions/media.ts`)

**Odpovědnost:**
- Integrace s HeyGen API
- Vytvoření/správa sessions
- Generování video odpovědí
- Streaming management
- Uloží do AvatarSessions

### 4. IngestPricesLambda (`functions/ingest-prices.ts`)

**Odpovědnost:**
- Scheduled job (EventBridge)
- Stáhne data z OTE/EPEX
- Parsuje a normalizuje
- Uloží do SpotPrices table
- Update predikce

---

## 🎨 Frontend Integrace

### ChatInterface.tsx - Zobrazení grafů

```tsx
// AI vrátí charts array
const { data } = useQuery({
  queryKey: ['/api/chat'],
  // ...
});

// Render charts
{data.charts?.map(chart => (
  <ChartComponent
    key={chart.id}
    type={chart.type}
    data={chart.series}
    xAxis={chart.xAxis}
    title={chart.title}
  />
))}

// Render savings summary
{data.savingsSummary && (
  <SavingsCard
    monthly={data.savingsSummary.monthlySavings}
    yearly={data.savingsSummary.yearlySavings}
    percentage={data.savingsSummary.percentage}
  />
)}
```

### VideoAvatar.tsx - HeyGen stream

```tsx
const { data: session } = useQuery({
  queryKey: ['/api/avatar/session'],
  queryFn: () => apiRequest('/api/avatar/session', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  })
});

// WebRTC/WebSocket connection
useEffect(() => {
  if (session?.streamingUrl) {
    connectToHeyGen(session.streamingUrl);
  }
}, [session]);
```

---

## 💰 Odhad AWS Nákladů (měsíčně)

| Služba | Použití | Cena |
|--------|---------|------|
| Lambda | 100k requestů | $0.20 |
| API Gateway | 100k requestů | $0.35 |
| DynamoDB | On-demand (10 GB) | $2.50 |
| S3 + CloudFront | 50 GB transfer | $5.00 |
| Secrets Manager | 4 secrets | $1.60 |
| EventBridge | 720 events/měsíc | $0.00 (free tier) |
| **CELKEM** | | **~$10/měsíc** |

**+ HeyGen API:** Podle jejich pricing (obvykle $0.10-0.50 per minute video)

---

## ✅ Implementační Plán

### Fáze 1: Core Backend (1-2 dny)
1. ✅ DynamoDB tables + schema
2. ✅ Lambda ConversationLambda + AnalyticsLambda
3. ✅ API Gateway endpoints
4. ✅ Mock data pro spotové ceny

### Fáze 2: HeyGen Integrace (1 den)
1. ✅ MediaLambda + HeyGen API
2. ✅ Session management
3. ✅ Frontend VideoAvatar update

### Fáze 3: Data Ingestion (1 den)
1. ✅ IngestPricesLambda
2. ✅ OTE/EPEX API integrace
3. ✅ EventBridge scheduler

### Fáze 4: Frontend Charts (1 den)
1. ✅ ChartComponent (Recharts)
2. ✅ SavingsCard komponenta
3. ✅ Integrace s ChatInterface

---

**Připraven začít s implementací?** Řekněte mi a začneme! 🚀
