# Cloudflare Pages + Workers Deployment Guide

## 📋 Přehled

Tato aplikace je připravená pro deployment na **Cloudflare Pages** s **Pages Functions** (serverless API) a **D1 Database** (SQLite).

## 🚀 Rychlý Start

### 1. Příprava Cloudflare účtu

1. Vytvořte si účet na [Cloudflare](https://dash.cloudflare.com/)
2. Nainstalujte Wrangler CLI (již nainstalováno):
   ```bash
   npm install -g wrangler
   ```
3. Přihlaste se:
   ```bash
   wrangler login
   ```

### 2. Vytvoření D1 Databáze

```bash
# Vytvořte D1 databázi
wrangler d1 create martin-db

# Výstup bude obsahovat database_id, zkopírujte ho
# Database created with ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Aktualizujte `wrangler.toml` s vaším `database_id`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "martin-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Zde vložte vaše ID
```

### 3. Spuštění Migrací

```bash
# Aplikujte databázové migrace
wrangler d1 migrations apply martin-db --local  # Pro lokální testování
wrangler d1 migrations apply martin-db          # Pro produkci
```

### 4. Nastavení Secrets (API Klíče)

```bash
# Nastavte vaše API klíče jako secrets
wrangler secret put AI_API_URL
wrangler secret put AI_API_KEY
wrangler secret put AVATAR_API_URL
wrangler secret put AVATAR_API_KEY
```

### 5. Build & Deploy

```bash
# Build projektu
npm run build

# Deploy na Cloudflare Pages
wrangler pages deploy dist/public --project-name=martin-ai-advisor
```

## 🛠️ Lokální Vývoj

### Vite Dev Server (doporučeno pro vývoj frontend)
```bash
npm run dev
```

### Cloudflare Pages Dev (testování s Workers & D1)
```bash
# Nejprve build
npm run build

# Pak spusťte Pages dev server
wrangler pages dev dist/public --compatibility-date=2024-10-21 --d1=DB --live-reload
```

## 📁 Struktura Projektu

```
.
├── client/              # React frontend
├── functions/           # Cloudflare Pages Functions (API handlers)
│   └── api/
│       ├── contacts.ts  # POST /api/contacts
│       ├── messages.ts  # POST /api/messages, GET /api/messages
│       └── chat.ts      # POST /api/chat (AI proxy)
├── migrations/          # D1 SQL migrace
├── shared/              # Sdílené typy a schéma
├── wrangler.toml        # Cloudflare konfigurace
└── vite.config.ts       # Vite build konfigurace
```

## 🔧 Užitečné Příkazy

### Databázové operace
```bash
# Zobrazit data v lokální D1 databázi
wrangler d1 execute martin-db --local --command="SELECT * FROM contacts LIMIT 10"

# Zobrazit data v produkční D1 databázi
wrangler d1 execute martin-db --command="SELECT * FROM contacts LIMIT 10"

# Vytvořit novou migraci
wrangler d1 migrations create martin-db <migration-name>
```

### Pages Deploy
```bash
# Deploy s preview URL
wrangler pages deploy dist/public

# Deploy na produkci
wrangler pages deploy dist/public --branch=main
```

### Logy a Monitoring
```bash
# Sledovat logy Pages Functions
wrangler pages deployment tail

# Zobrazit seznam deploymentů
wrangler pages deployments list --project-name=martin-ai-advisor
```

## 🌐 Custom Doména

1. V Cloudflare Dashboard → Pages → martin-ai-advisor → Custom domains
2. Klikněte "Set up a custom domain"
3. Zadejte vaši doménu (např. `martin.example.cz`)
4. Následujte instrukce pro DNS nastavení

## 📊 Environment Variables

### Secrets (citlivé údaje)
- `AI_API_URL` - URL vašeho AI API
- `AI_API_KEY` - API klíč pro AI službu
- `AVATAR_API_URL` - URL vašeho video avatar API
- `AVATAR_API_KEY` - API klíč pro avatar službu

### Public Variables (nekritické)
- `NODE_ENV` - Nastaveno v `wrangler.toml`

## 🐛 Troubleshooting

### "Database not found"
- Zkontrolujte že `database_id` v `wrangler.toml` odpovídá ID z `wrangler d1 create`
- Ověřte že migrace byly aplikovány: `wrangler d1 migrations list martin-db`

### CORS chyby
- Pages Functions běží na stejné doméně jako frontend, takže CORS by neměl být problém
- Pokud ano, zkontrolujte že API cesty jsou relativní (`/api/*` ne `https://...`)

### Build chyby
- Spusťte `npm run build` a zkontrolujte chyby
- Ověřte že všechny závislosti jsou nainstalovány: `npm install`

## 📚 Další Zdroje

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

## 🎯 Checklist před Deployem

- [ ] D1 databáze vytvořena a ID aktualizováno v `wrangler.toml`
- [ ] Migrace aplikovány (`wrangler d1 migrations apply`)
- [ ] Secrets nastaveny (`wrangler secret put`)
- [ ] Build úspěšný (`npm run build`)
- [ ] Lokální test prošel (`wrangler pages dev`)
- [ ] Deploy na Cloudflare (`wrangler pages deploy`)

---

**Hotovo!** 🎉 Vaše aplikace běží na Cloudflare Pages s globálním CDN a serverless API.
