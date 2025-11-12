# Upřesnění Požadavků - Martin AI

## ✅ CO JE JASNÉ (podle Dušana)

### UI/UX
- ❌ **ŽÁDNÉ grafy** (zbytečně složité)
- ✅ **Velká čísla** s nadpisy - např. "Vaše průměrná cena: 2,50 Kč/kWh za rok 2023"
- ✅ **Ukázková faktura** - PDF s označením kde najít distribuční sazbu
- ✅ **Různé zobrazení** podle období (1 rok vs. více let)

### Výpočetní Logika
```
1. TDD koeficienty (čtvrthodiny) × Ceny denního trhu (hodiny)
2. Výpočet spotřeby: (koef / suma_koef_rok) × roční_spotřeba
3. Náklady: spotřeba × cena_trhu
4. Průměr: suma_nákladů / spotřeba
```

### Konverzační Flow
```
Martin → Představení (fixní vs. spot)
      → Nabídka ukázat historické ceny
      → Dotaz na distribuční sazbu (TDD)
      → Zobrazení ukázkové faktury
      → Výběr TDD (např. C02d)
      → VÝPOČET
      → Zobrazení velkého čísla s výsledkem
```

---

## ❓ CO POTŘEBUJI VĚDĚT

### 1. TDD Koeficienty a Historické Ceny

**Máte data?**
- [ ] **TDD koeficienty** - 20 sazeb (C01d, C02d, ...) × 35 040 hodnot/rok?
- [ ] **Historické ceny denního trhu** - hodinové ceny za 2-3 roky zpátky?

**Pokud ANO:**
- Kde jsou? (Excel, CSV, API?)
- Mohu je dostat?

**Pokud NE:**
- Mám vytvořit **mock data** pro prototyp?
- Později připojíme real data z OTE API?

---

### 2. HeyGen Video Avatar

**Pořád chcete HeyGen integraci?**
- [ ] **ANO** - Martin bude video avatar (pošlete mi HeyGen API key)
- [ ] **NE** - Pouze text chat bez videa
- [ ] **POZDĚJI** - Nejprve funkční výpočty, pak avatar

---

### 3. Ukázková Faktura (PDF)

**Máte ukázkovou fakturu za elektřinu?**
- [ ] **ANO** - Pošlete mi PDF, nahraju ho do aplikace
- [ ] **NE** - Najdu veřejnou ukázku nebo vytvoříme mock fakturu

Potřebuji PDF kde je **viditelné:**
- Distribuční sazba (např. "C02d")
- Název pole kde ji najít
- Případně zvýraznění/šipka

---

### 4. Implementační Strategie

**Jak máme postupovat?**

**Varianta A: MOCK Prototyp (doporučuji)**
```
✅ Rychlý start (2-3 hodiny)
✅ Mock TDD koeficienty (5 nejběžnějších sazeb)
✅ Mock historické ceny (2 roky zpátky)
✅ Funkční kalkulace
✅ Ukázková faktura (mock nebo veřejná)
✅ UI s velkými čísly
✅ Můžete okamžitě testovat UX

Později: Připojíme real data + AWS
```

**Varianta B: Rovnou AWS + Real Data**
```
⏱️ Delší setup (1-2 dny)
✅ Real TDD koeficienty
✅ Real OTE API integrace
✅ AWS Lambda + DynamoDB
✅ Production-ready

Potřeba: AWS credentials + real data
```

---

## 🎯 Moje Doporučení

**Fáze 1: Mock Prototyp (RYCHLE)**
1. Vytvořím mock TDD data (5 sazeb: C01d, C02d, C03d, C25d, C35d)
2. Mock historické ceny z OTE (2022-2024)
3. Implementuji výpočetní engine podle Dušanovy logiky
4. UI s velkými čísly místo grafů
5. Mock PDF faktury
6. ✅ **Můžete testovat za 3 hodiny**

**Fáze 2: Real Data (PO ODSOUHLASENÍ)**
1. Integrace real TDD koeficientů
2. OTE API pro real ceny
3. Případně HeyGen avatar

**Fáze 3: AWS Deployment**
1. Lambda functions
2. DynamoDB
3. S3 + CloudFront

---

## 📋 CO POTŘEBUJI OD VÁS TEĎ

Prosím odpovězte:

1. **TDD koeficienty a ceny:**
   - [ ] Máme real data → pošlete mi
   - [ ] Nemáme → začnu s mock daty

2. **HeyGen avatar:**
   - [ ] Ano, chceme → pošlete API key
   - [ ] Ne, jen text chat
   - [ ] Později

3. **PDF faktury:**
   - [ ] Máme ukázku → pošlete mi
   - [ ] Nemáme → použiju veřejnou/mock

4. **Strategie:**
   - [ ] Varianta A (mock prototyp) ← doporučuji
   - [ ] Varianta B (rovnou AWS + real data)

---

## ⏱️ Časový Odhad

**Mock Prototyp:**
- Backend (výpočty): 2 hodiny
- Frontend (velká čísla, PDF viewer): 1 hodina
- ✅ **Celkem: 3 hodiny → HOTOVO DNES**

**AWS + Real Data:**
- Infrastruktura: 4 hodiny
- Data ingestion: 3 hodiny
- Testování: 2 hodiny
- ✅ **Celkem: 1-2 dny**

---

Dejte mi vědět a můžu začít! 🚀
