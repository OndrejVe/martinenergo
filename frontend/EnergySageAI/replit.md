# Martin - Interaktivní AI Poradce pro Spotové Ceny Elektřiny

## Přehled Projektu

Martin je energetický microsite s AI poradcem, který pomáhá uživatelům pochopit spotové ceny elektřiny a ušetřit na energiích. Aplikace kombinuje **vlastního animovaného AI avatara s OpenAI TTS**, moderní chat interface napojeného na RAG znalostní bázi, s živými energetickými barvami a dynamickými animacemi.

**🎯 KLÍČOVÁ ZMĚNA:** Nahrazeno HeyGen Streaming Avatar vlastním TTS řešením s OpenAI API - plná kontrola nad znalostní bází!

## Klíčové Funkce (MVP)

### ✅ DOKONČENÉ FUNKCE (Production-Ready)

#### Frontend
1. **DOMINANTNÍ Video Avatar** - 66% šířky na desktopu, LiveKit WebRTC s HeyGen API
2. **Energetické Barvy** - Elektrická cyan (190 85% 45%), oranžová (25 95% 55%), žlutá (45 95% 58%)
3. **Dynamické Animace** - Gradient flow, pulse glow, border animations, floating efekty
4. **Moderní Chat Interface** - Glass morphism, podpora textu, obrázků, odkazů, hlasového vstupu
5. **Chat-to-TTS Pipeline** - Automatická aktivace avatara při první zprávě
6. **Interaktivní Landing** - Fullscreen hero s animovanými gradienty a energetickými efekty
7. **"Proč Spotové Ceny"** - Feature karty s gradient ikonami a animacemi při scrollu
8. **Kontaktní Formulář** - Gradient tlačítka, glass morphism, GDPR compliance, rate limiting
9. **Jazyková Lokalizace** - CZ/SK přepínání
10. **Dark Mode** - Plně funkční s energetickými barvami
11. **Responzivní Design** - Avatar first approach na všech zařízeních

#### Backend (Production-Ready s D1 Database)
1. **HeyGen Streaming Avatar API** - `/api/avatar/new`, `/api/avatar/speak`, `/api/avatar/stop`
2. **AI Chat API** - `/api/chat` s persistencí do D1 database
3. **Contacts API** - `/api/contacts` pro lead collection s rate limiting
4. **Messages API** - `/api/messages` (GET/POST) pro chat historii
5. **Cloudflare Workers** - Serverless API functions v `./functions/api/`
6. **D1 Database** - SQLite schema s migrations pro contacts & messages

### ✅ KONFIGURACE A TESTING DOKONČENY
1. **HeyGen Interactive Avatar ID** - ✅ OVĚŘENO A PLNĚ FUNKČNÍ!
   - Avatar ID: `20f4880bcb874abb87d85a7b1da8a875` (is_paid: true)
   - ✅ Session creation tested and working
   - ✅ LiveKit WebRTC connection successful
   - ✅ Video + Audio tracks subscribing correctly
   - ✅ TTS ready and greeting functional
   - HeyGen API v2 nevrací ice_servers (používá LiveKit defaults)
2. **Avatar Video Display** - ✅ OPRAVENO!
   - Fix: Video element nyní vždy v DOM (opacity-based visibility)
   - Řeší chicken-and-egg problém s videoRef
3. **Cloudflare D1 Database** - Připraveno pro deployment (viz CLOUDFLARE_DEPLOYMENT.md)
4. **Secrets** - Nastaveny v Replit: HEYGEN_API_KEY, HEYGEN_AVATAR_ID

## Technický Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Framer Motion** - Animations
- **Wouter** - Routing
- **React Hook Form** - Form handling
- **Zod** - Validation

### Backend (Cloudflare)
- **Cloudflare Pages** - Static hosting
- **Cloudflare Workers** - Serverless API (Pages Functions)
- **Cloudflare D1** - SQLite database
- **Drizzle ORM** - Database ORM (drizzle-orm/d1)
- **Zod** - Schema validation

### Legacy (Lokální Development)
- **Express.js** - Dev server (pouze pro lokální vývoj)
- **PostgreSQL** - Původní databáze (nahrazeno D1)

## Struktura Projektu

```
client/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx - Top navigation s jazykovým přepínačem
│   │   ├── HeroSection.tsx - Landing hero s CTA
│   │   ├── WhySpotSection.tsx - Výhody spotových cen
│   │   ├── VideoAvatar.tsx - Velký video avatar komponenta
│   │   ├── ChatInterface.tsx - Chat s podporou hlasu, obrázků, odkazů
│   │   ├── ChatSection.tsx - Kombinace avatar + chat (50/50 split)
│   │   ├── ContactForm.tsx - Lead generation formulář
│   │   └── Footer.tsx - Footer s GDPR odkazy
│   ├── contexts/
│   │   ├── LanguageContext.tsx - CZ/SK přepínání
│   │   └── ThemeContext.tsx - Light/Dark mode
│   ├── lib/
│   │   └── translations.ts - Všechny překlady CZ/SK
│   └── pages/
│       └── Home.tsx - Hlavní stránka

functions/
├── api/
│   ├── contacts.ts - POST /api/contacts (Cloudflare Worker)
│   ├── messages.ts - POST/GET /api/messages (Cloudflare Worker)
│   └── chat.ts - POST /api/chat - AI proxy (Cloudflare Worker)
├── _types.ts - Shared types a helpers
└── env.d.ts - TypeScript definitions pro Workers

migrations/
└── 0001_initial_schema.sql - D1 database schema

shared/
└── schema.ts - Data modely pro D1/SQLite (contacts, chatMessages)

server/ (Legacy - pouze pro lokální dev)
├── db.ts - PostgreSQL připojení (pro dev)
├── routes.ts - Express routes (nahrazeno Cloudflare Workers)
└── storage.ts - Storage interface (nahrazeno D1)

wrangler.toml - Cloudflare Pages konfigurace
CLOUDFLARE_DEPLOYMENT.md - Deployment guide
```

## Datové Modely

### Contacts (Lead Generation)
```typescript
{
  id: UUID (auto-generated)
  name: string
  email: string
  phone?: string
  message?: string
  language: 'cs' | 'sk'
  gdprConsent: boolean
  createdAt: timestamp
}
```

### Chat Messages
```typescript
{
  id: UUID (auto-generated)
  sessionId: string (browser fingerprint)
  role: 'user' | 'assistant'
  content: string
  hasImage: boolean
  hasLink: boolean
  createdAt: timestamp
}
```

## Design System (Energetický Redesign)

Aplikace používá energetické design tokeny definované v `design_guidelines.md`:
- **Primary Color**: Elektrická cyan (190 85% 45%) - energie, elektřina, modernost
- **Secondary Color**: Energetická oranžová (25 95% 55%) - teplo, dynamika, akce
- **Accent Color**: Elektrická žlutá (45 95% 58%) - světlo, energie, pozornost
- **Success Color**: Zelená (142 76% 45%) - úspory, ekologie
- **Typography**: Inter (primární), Poppins/Montserrat (display), JetBrains Mono (čísla)
- **Spacing**: Generous - py-16 md:py-24 lg:py-32 pro sekce
- **Animations**: 
  - CSS @keyframes: gradient-flow, pulse-glow, pulse-border, float
  - Framer Motion: scroll animace, fade-in-up, scale efekty
  - Utility classes: gradient-text-animated, avatar-glow, border-animated, float-animation

## API Integrace (TODO)

### Vlastní REST API Endpointy
Aplikace očekává následující endpointy od uživatele:

1. **Video Avatar API**
   - Endpoint pro načtení video streamu avatara
   - Placeholder v `VideoAvatar.tsx` čeká na konfiguraci

2. **AI Conversation API**
   - Endpoint pro posílání zpráv a přijímání odpovědí
   - Placeholder v `ChatInterface.tsx` čeká na konfiguraci

## Dokončené Implementace

### ✅ HeyGen Streaming Avatar Integration (Production-Ready)
1. ✅ **Backend API Endpoints:**
   - `/api/avatar/new` - Creates HeyGen session, forwards LiveKit credentials + ICE servers
   - `/api/avatar/speak` - Sends TTS text to avatar, returns task_id
   - `/api/avatar/stop` - Stops avatar session
2. ✅ **Frontend VideoAvatar Component:**
   - LiveKit WebRTC integration with ICE server configuration
   - Video + audio track handling (separate elements)
   - Session lifecycle management (stays active during TTS playback)
   - 15-second loading timeout with graceful error handling
3. ✅ **Chat-to-TTS Pipeline:**
   - Automatic avatar activation on first message
   - Retry logic (10 attempts × 300ms) for session readiness
   - Ref-based session tracking (avatarSessionIdRef) prevents race conditions
   - Message persistence to D1 database
4. ✅ **Bug Fixes (All Critical Issues Resolved):**
   - HeyGen response parsing: `heygenData.data.session_id`
   - ICE server forwarding to LiveKit Room config
   - JSON parsing in chatMutation: `await response.json()`
   - Message rendering: setMessages() with parsed AI responses
   - Closure staleness: avatarSessionIdRef tracks live session value
   - Avatar lifecycle: No premature deactivation during TTS

### ✅ Cloudflare Deployment Ready (Kompletní)
1. ✅ Cloudflare Pages Functions - API handlers v `./functions/api/`
2. ✅ D1 Database - SQLite schema a migrace
3. ✅ `/api/contacts` - ukládání leadů do D1 s rate limiting (3/min/IP)
4. ✅ `/api/messages` - chat historie (GET/POST)
5. ✅ `/api/chat` - AI proxy s persistencí odpovědí do D1
6. ✅ Build konfigurace - statický export do `dist/public`
7. ✅ Same-origin deployment - žádné CORS problémy
8. ✅ Security - role validation, input sanitization, secrets management

### ✅ Frontend (Kompletní)
1. ✅ Video Avatar s HeyGen API (LiveKit WebRTC, ICE servers, video+audio)
2. ✅ Chat Interface s message rendering a persistence
3. ✅ Chat-to-TTS pipeline s retry logikou
4. ✅ Kontaktní formulář připojen k `/api/contacts`
5. ✅ Energetický redesign s živými barvami a dynamickými animacemi
6. ✅ Relativní API cesty - ready pro same-origin deployment
7. ✅ Client-side session management (sessionStorage)

### 🔄 Zbývá Nakonfigurovat
1. **HeyGen Interactive Avatar ID** - Získat platný ID z https://app.heygen.com/streaming-avatars
   - Aktuální placeholder `20f4880bcb874abb87d85a7b1da8a875` není platný
   - Změnit v: `server/routes.ts` → `/api/avatar/new` endpoint
2. **Cloudflare D1 Database** - Vytvořit databázi a aplikovat migrace (viz CLOUDFLARE_DEPLOYMENT.md)
3. **Secrets** - Nastavit v Cloudflare:
   - `HEYGEN_API_KEY` - Pro avatar API (již nastaven v Replit Secrets)
   - `AI_API_URL` - URL vašeho AI API
   - `AI_API_KEY` - API key pro AI konverzaci

## Spuštění Projektu

```bash
npm run dev
```

Aplikace běží na http://localhost:5000

## Poznámky k Implementaci

- **Smooth Scroll**: Implementováno pro navigaci mezi sekcemi
- **Voice Input**: Používá Web Speech API (pouze Chrome/Edge)
- **Animations**: Fade-in animace při scrollu s Intersection Observer
- **Dark Mode**: Persistence v localStorage
- **Language**: Persistence v localStorage, default CZ
- **GDPR**: Checkbox validace před odesláním formuláře
- **Responzivní**: Mobile-first approach, sticky avatar na desktopu
- **Progressive Disclosure**: Kontaktní formulář schovaný za tlačítkem "Chci lepší cenu"
- **Marketing Copy**: Žádná zmínka o "spot" nebo "spotových cenách", focus na AI Martina jako poradce

## Poslední Změny (20.10.2025)

### Marketing Copy Redesign
- ✅ Hero sekce přepsána - nový úderný text o AI Martinovi bez zmínky "spot"
- ✅ Tlačítko "Chci lepší cenu" přidáno do Hero sekce
- ✅ "Proč spotové ceny?" → "Co vám Martin přináší?"
- ✅ Feature boxy aktualizovány podle screenshotu
- ✅ Kontaktní formulář schován za progressive disclosure tlačítkem
- ✅ Všechny texty v CZ a SK aktualizovány

## Kontakt s Uživatelem

Pro dokončení integrace potřebujeme:
1. URL vašeho REST API pro video avatar
2. URL vašeho AI API pro konverzaci
3. API klíče nebo autentizační tokeny (budou uloženy jako secrets)
