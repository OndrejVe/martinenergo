// Mock data pro TDD koeficienty a spotové ceny
// Kompletní sada všech TDD sazeb používaných v České republice

/**
 * TDD (Typový Diagram Dodávky) - Distribuční sazby
 * Celkem 15 standardních sazeb podle typu odběrného místa a spotřeby
 * (3 domácnosti, 9 firemních, 3 speciální)
 */

export const TDD_CODES = [
  // DOMÁCNOSTI (D)
  'C01d', // Domácnost - malá spotřeba (do 1800 kWh/rok)
  'C02d', // Domácnost - běžná spotřeba (1800-4000 kWh/rok)
  'C03d', // Domácnost - vyšší spotřeba (nad 4000 kWh/rok)
  
  // FIRMY A PODNIKATELÉ - Malé odběry (do 50 MWh/rok)
  'C25d', // Firma - pracovní doba (8-17h, typicky kanceláře)
  'C26d', // Firma - rozšířená doba (6-20h, obchody, restaurace)
  
  // FIRMY - Střední odběry (50-630 MWh/rok)
  'C35d', // Nepřetržitý provoz 24/7 (výroba, servery)
  'C45d', // Dvousměnný provoz (6-22h)
  'C46d', // Třísměnný provoz s víkendovým provozem
  
  // FIRMY - Vysoké odběry (nad 630 MWh/rok)
  'C55d', // Velká výroba - dvousměnný provoz
  'C56d', // Velká výroba - třísměnný provoz
  'C62d', // Průmysl - nepřetržitý provoz s nižší spotřebou v noci
  'C63d', // Průmysl - rovnoměrný nepřetržitý provoz
  
  // SPECIÁLNÍ TARIFY
  'C01e', // Akumulační ohřev - noční proud (NT)
  'C02e', // Přímotopy - dvojtarif (VT/NT)
  'C03e', // Tepelné čerpadlo - trojí tarif (VT/NT/špička)
] as const;

export type TddCode = typeof TDD_CODES[number];

/**
 * TDD koeficienty - hodinové průběhy spotřeby pro různé typy odběrů
 * Hodnoty jsou normalizované - vyšší číslo = vyšší spotřeba v danou hodinu
 */

export const TDD_HOURLY_COEFFICIENTS: Record<TddCode, number[]> = {
  // ===== DOMÁCNOSTI =====
  
  // C01d - Domácnost malá (bytové domy, malé byty)
  C01d: [
    0.8, 0.7, 0.6, 0.6, 0.6, 0.7,  // 0-5h (noc)
    1.0, 1.2, 1.1, 0.9, 0.8, 0.9,  // 6-11h (ráno, oběd)
    0.9, 0.8, 0.8, 0.9, 1.1, 1.3,  // 12-17h (odpoledne)
    1.4, 1.3, 1.2, 1.1, 1.0, 0.9   // 18-23h (večer)
  ],
  
  // C02d - Domácnost běžná (rodinné domy, průměrná spotřeba)
  C02d: [
    0.7, 0.6, 0.5, 0.5, 0.6, 0.8,  // 0-5h
    1.2, 1.4, 1.2, 1.0, 0.9, 1.0,  // 6-11h (ranní špička)
    1.0, 0.9, 0.9, 1.0, 1.2, 1.5,  // 12-17h
    1.6, 1.5, 1.3, 1.2, 1.0, 0.8   // 18-23h (večerní špička)
  ],
  
  // C03d - Domácnost vyšší spotřeba (velké domy, elektrické topení)
  C03d: [
    0.6, 0.5, 0.5, 0.5, 0.6, 0.9,  // 0-5h
    1.3, 1.5, 1.3, 1.1, 1.0, 1.1,  // 6-11h
    1.1, 1.0, 1.0, 1.1, 1.3, 1.6,  // 12-17h
    1.7, 1.6, 1.4, 1.3, 1.1, 0.9   // 18-23h
  ],
  
  // ===== FIRMY - MALÉ ODBĚRY =====
  
  // C25d - Firma pracovní doba (8-17h, kanceláře)
  C25d: [
    0.3, 0.2, 0.2, 0.2, 0.3, 0.5,  // 0-5h (noc - minimum)
    0.8, 1.3, 1.5, 1.5, 1.4, 1.3,  // 6-11h (ranní nástup)
    1.2, 1.4, 1.5, 1.4, 1.2, 0.8,  // 12-17h (oběd, konec prac. doby)
    0.6, 0.5, 0.4, 0.4, 0.3, 0.3   // 18-23h (večer - minimum)
  ],
  
  // C26d - Firma rozšířená doba (6-20h, obchody, restaurace)
  C26d: [
    0.3, 0.2, 0.2, 0.2, 0.3, 0.6,  // 0-5h
    1.0, 1.2, 1.3, 1.3, 1.2, 1.3,  // 6-11h (otevírací doba)
    1.4, 1.5, 1.5, 1.4, 1.3, 1.2,  // 12-17h (odpolední špička)
    1.1, 1.0, 0.9, 0.8, 0.5, 0.4   // 18-23h (zavírání)
  ],
  
  // ===== FIRMY - STŘEDNÍ ODBĚRY =====
  
  // C35d - Nepřetržitý provoz 24/7 (výroba, servery, IT)
  C35d: [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // 0-5h (noční směna)
    1.1, 1.2, 1.2, 1.2, 1.2, 1.1,  // 6-11h (ranní směna)
    1.1, 1.2, 1.2, 1.2, 1.2, 1.1,  // 12-17h (odpolední směna)
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0   // 18-23h (noční směna)
  ],
  
  // C45d - Dvousměnný provoz (6-22h)
  C45d: [
    0.4, 0.3, 0.3, 0.3, 0.4, 0.7,  // 0-5h (mimo provoz)
    1.2, 1.4, 1.5, 1.5, 1.4, 1.3,  // 6-11h (ranní směna)
    1.3, 1.4, 1.5, 1.5, 1.4, 1.3,  // 12-17h (odpolední směna)
    1.2, 1.1, 1.0, 0.9, 0.7, 0.5   // 18-23h (konec odpolední směny)
  ],
  
  // C46d - Třísměnný provoz s víkendem
  C46d: [
    0.9, 0.9, 0.9, 0.9, 0.9, 1.0,  // 0-5h (noční směna)
    1.2, 1.3, 1.3, 1.3, 1.2, 1.2,  // 6-11h
    1.2, 1.3, 1.3, 1.3, 1.2, 1.1,  // 12-17h
    1.0, 1.0, 1.0, 0.9, 0.9, 0.9   // 18-23h
  ],
  
  // ===== FIRMY - VYSOKÉ ODBĚRY =====
  
  // C55d - Velká výroba - dvousměnný provoz
  C55d: [
    0.5, 0.4, 0.4, 0.4, 0.5, 0.8,  // 0-5h
    1.3, 1.5, 1.6, 1.6, 1.5, 1.4,  // 6-11h (vysoká spotřeba)
    1.4, 1.5, 1.6, 1.6, 1.5, 1.4,  // 12-17h
    1.3, 1.2, 1.0, 0.8, 0.6, 0.5   // 18-23h
  ],
  
  // C56d - Velká výroba - třísměnný provoz
  C56d: [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.1,  // 0-5h
    1.3, 1.4, 1.4, 1.4, 1.3, 1.3,  // 6-11h
    1.3, 1.4, 1.4, 1.4, 1.3, 1.2,  // 12-17h
    1.1, 1.1, 1.0, 1.0, 1.0, 1.0   // 18-23h
  ],
  
  // C62d - Průmysl - nepřetržitý s nižší noční spotřebou
  C62d: [
    0.8, 0.8, 0.8, 0.8, 0.8, 0.9,  // 0-5h (noční minimum)
    1.2, 1.3, 1.4, 1.4, 1.3, 1.2,  // 6-11h (denní maxima)
    1.2, 1.3, 1.4, 1.4, 1.3, 1.2,  // 12-17h
    1.1, 1.0, 0.9, 0.9, 0.8, 0.8   // 18-23h (večerní pokles)
  ],
  
  // C63d - Průmysl - rovnoměrný nepřetržitý provoz
  C63d: [
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // 0-5h
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // 6-11h (konstantní spotřeba)
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0,  // 12-17h
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0   // 18-23h
  ],
  
  // ===== SPECIÁLNÍ TARIFY =====
  
  // C01e - Akumulační ohřev (noční proud)
  C01e: [
    2.0, 2.0, 2.0, 2.0, 2.0, 2.0,  // 0-5h (noční nabíjení)
    1.0, 0.5, 0.3, 0.3, 0.3, 0.3,  // 6-11h
    0.3, 0.3, 0.3, 0.3, 0.3, 0.5,  // 12-17h
    0.8, 1.0, 1.2, 1.5, 1.8, 2.0   // 18-23h (příprava na noční nabíjení)
  ],
  
  // C02e - Přímotopy - dvojtarif (VT/NT)
  C02e: [
    1.5, 1.5, 1.5, 1.5, 1.5, 1.2,  // 0-5h (NT - topení)
    1.0, 1.2, 1.1, 0.9, 0.8, 0.9,  // 6-11h (VT)
    0.9, 0.8, 0.8, 0.9, 1.1, 1.3,  // 12-17h (VT)
    1.4, 1.5, 1.5, 1.5, 1.5, 1.5   // 18-23h (NT začíná 20h)
  ],
  
  // C03e - Tepelné čerpadlo - trojí tarif
  C03e: [
    1.8, 1.8, 1.8, 1.8, 1.8, 1.5,  // 0-5h (NT - vysoká spotřeba)
    1.2, 1.0, 0.8, 0.7, 0.7, 0.8,  // 6-11h (VT - nízká spotřeba)
    0.8, 0.7, 0.7, 0.8, 1.0, 1.2,  // 12-17h (VT)
    1.5, 1.6, 1.7, 1.7, 1.8, 1.8   // 18-23h (NT od 20h)
  ]
};

/**
 * Převod hodinových koeficientů na čtvrthodinové
 */
export function getQuarterHourCoefficients(tddCode: TddCode): number[] {
  const hourly = TDD_HOURLY_COEFFICIENTS[tddCode];
  
  // Defensive check - pokud TDD kód neexistuje, použij C02d jako fallback
  if (!hourly) {
    console.warn(`TDD code ${tddCode} not found in mock data, using C02d as fallback`);
    return getQuarterHourCoefficients('C02d' as TddCode);
  }
  
  const quarterly: number[] = [];
  
  hourly.forEach(hourValue => {
    quarterly.push(hourValue, hourValue, hourValue, hourValue);
  });
  
  return quarterly; // 96 hodnot
}

/**
 * Spotové ceny - mock data (hodinové průměry v EUR/MWh)
 */
export const MOCK_HOURLY_PRICES_2023: number[] = [
  45, 40, 38, 37, 40, 55,   // 0-5h (noc - levné)
  85, 110, 105, 90, 80, 75,  // 6-11h (ranní špička)
  70, 72, 75, 80, 95, 115,   // 12-17h (odpoledne)
  120, 115, 100, 85, 70, 55  // 18-23h (večerní špička)
];

export const MOCK_HOURLY_PRICES_2024: number[] = [
  50, 45, 42, 40, 45, 60,   // 0-5h
  90, 115, 110, 95, 85, 80,  // 6-11h
  75, 77, 80, 85, 100, 120,  // 12-17h
  125, 120, 105, 90, 75, 60  // 18-23h
];

/**
 * Převod EUR/MWh na Kč/kWh
 */
export function convertEurMWhToKczKWh(eurPerMWh: number, exchangeRate: number = 25): number {
  return (eurPerMWh / 1000) * exchangeRate;
}

/**
 * Metadata o TDD sazbách
 */
export const TDD_METADATA: Record<TddCode, { 
  name: string; 
  description: string;
  category: 'household' | 'business' | 'special';
  typicalConsumption: string;
}> = {
  // DOMÁCNOSTI
  C01d: {
    name: 'C01d - Domácnost malá',
    description: 'Byty, malé domácnosti',
    category: 'household',
    typicalConsumption: 'do 1 800 kWh/rok'
  },
  C02d: {
    name: 'C02d - Domácnost běžná',
    description: 'Rodinné domy, průměrná spotřeba',
    category: 'household',
    typicalConsumption: '1 800 - 4 000 kWh/rok'
  },
  C03d: {
    name: 'C03d - Domácnost vysoká spotřeba',
    description: 'Větší domy, elektrické topení',
    category: 'household',
    typicalConsumption: 'nad 4 000 kWh/rok'
  },
  
  // FIRMY - MALÉ
  C25d: {
    name: 'C25d - Firma pracovní doba',
    description: 'Kanceláře, provoz 8-17h',
    category: 'business',
    typicalConsumption: 'do 50 MWh/rok'
  },
  C26d: {
    name: 'C26d - Firma rozšířená doba',
    description: 'Obchody, restaurace, 6-20h',
    category: 'business',
    typicalConsumption: 'do 50 MWh/rok'
  },
  
  // FIRMY - STŘEDNÍ
  C35d: {
    name: 'C35d - Nepřetržitý provoz 24/7',
    description: 'Výroba, servery, IT infrastruktura',
    category: 'business',
    typicalConsumption: '50 - 630 MWh/rok'
  },
  C45d: {
    name: 'C45d - Dvousměnný provoz',
    description: 'Výroba 6-22h',
    category: 'business',
    typicalConsumption: '50 - 630 MWh/rok'
  },
  C46d: {
    name: 'C46d - Třísměnný provoz',
    description: 'Průmysl s víkendovým provozem',
    category: 'business',
    typicalConsumption: '50 - 630 MWh/rok'
  },
  
  // FIRMY - VYSOKÉ
  C55d: {
    name: 'C55d - Velká výroba 2směnná',
    description: 'Průmyslová výroba, dvousměnný provoz',
    category: 'business',
    typicalConsumption: 'nad 630 MWh/rok'
  },
  C56d: {
    name: 'C56d - Velká výroba 3směnná',
    description: 'Průmyslová výroba, třísměnný provoz',
    category: 'business',
    typicalConsumption: 'nad 630 MWh/rok'
  },
  C62d: {
    name: 'C62d - Průmysl nepřetržitý',
    description: 'Nepřetržitý provoz s nižší noční spotřebou',
    category: 'business',
    typicalConsumption: 'nad 630 MWh/rok'
  },
  C63d: {
    name: 'C63d - Průmysl rovnoměrný',
    description: 'Konstantní spotřeba 24/7',
    category: 'business',
    typicalConsumption: 'nad 630 MWh/rok'
  },
  
  // SPECIÁLNÍ
  C01e: {
    name: 'C01e - Akumulační ohřev',
    description: 'Akumulační kamna, noční proud',
    category: 'special',
    typicalConsumption: 'variabilní'
  },
  C02e: {
    name: 'C02e - Přímotopy',
    description: 'Elektrické topení, dvojtarif VT/NT',
    category: 'special',
    typicalConsumption: 'variabilní'
  },
  C03e: {
    name: 'C03e - Tepelné čerpadlo',
    description: 'Tepelná čerpadla, trojí tarif',
    category: 'special',
    typicalConsumption: 'variabilní'
  }
};

/**
 * Mock historická data - průměrné roční ceny
 */
export const MOCK_HISTORICAL_AVERAGES: Record<number, Record<TddCode, number>> = {
  2023: {
    C01d: 2.15, C02d: 2.05, C03d: 2.00,
    C25d: 1.95, C26d: 1.98, C35d: 2.10,
    C45d: 2.02, C46d: 2.08, C55d: 2.00,
    C56d: 2.05, C62d: 2.07, C63d: 2.10,
    C01e: 1.80, C02e: 1.95, C03e: 1.85
  },
  2024: {
    C01d: 2.25, C02d: 2.15, C03d: 2.10,
    C25d: 2.05, C26d: 2.08, C35d: 2.20,
    C45d: 2.12, C46d: 2.18, C55d: 2.10,
    C56d: 2.15, C62d: 2.17, C63d: 2.20,
    C01e: 1.90, C02e: 2.05, C03e: 1.95
  }
};
