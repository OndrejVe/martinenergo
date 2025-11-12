// Výpočetní engine pro spotové ceny podle TDD koeficientů
// Implementace Dušanovy logiky z Excel tabulky

import {
  type TddCode,
  getQuarterHourCoefficients,
  MOCK_HOURLY_PRICES_2023,
  MOCK_HOURLY_PRICES_2024,
  convertEurMWhToKczKWh
} from './mock-data';

/**
 * Vstupní parametry pro výpočet
 */
export interface CalculationInput {
  tddCode: TddCode;
  yearlyConsumption: number; // kWh/rok
  year: number; // 2023, 2024
  exchangeRate?: number; // EUR→CZK kurz (default 25)
}

/**
 * Výsledek výpočtu
 */
export interface CalculationResult {
  // Vstupní parametry
  input: CalculationInput;
  
  // Výsledky
  averagePricePerKWh: number; // Průměrná cena Kč/kWh za rok
  totalCostPerYear: number; // Celkové náklady Kč/rok
  
  // Měsíční rozpad (volitelné)
  monthlyBreakdown?: MonthlyResult[];
  
  // Metadata
  calculatedAt: string;
}

export interface MonthlyResult {
  month: number; // 1-12
  monthName: string;
  averagePricePerKWh: number;
  consumption: number; // kWh v měsíci
  totalCost: number; // Kč
}

/**
 * HLAVNÍ VÝPOČETNÍ FUNKCE
 * 
 * Implementuje Dušanovu logiku:
 * 
 * Krok 1: Přiřazení cen k TDD koeficientům
 * - TDD koeficienty jsou po čtvrthodinách (96/den)
 * - Ceny denního trhu jsou po hodinách (24/den)
 * - Ke každé čtvrthodině přiřadíme cenu z příslušné hodiny
 * 
 * Krok 2: Výpočet spotřeby v každé čtvrthodině
 * spotřeba_čtvrthodina = (koef_čtvrthodina / suma_koef_rok) × roční_spotřeba
 * 
 * Krok 3: Výpočet nákladů v každé čtvrthodině
 * náklad_čtvrthodina = spotřeba_čtvrthodina × cena_trhu
 * 
 * Krok 4: Průměrná cena
 * průměrná_cena = suma(náklad_čtvrthodina) / roční_spotřeba
 */
export function calculateSpotPrice(input: CalculationInput): CalculationResult {
  const exchangeRate = input.exchangeRate || 25; // Default 25 Kč/EUR
  
  // Krok 1: Načteme TDD koeficienty (96 hodnot pro jeden den)
  const dailyCoefficients = getQuarterHourCoefficients(input.tddCode);
  
  // Načteme hodinové ceny trhu (24 hodnot pro jeden den)
  const hourlyPricesEur = input.year === 2023 
    ? MOCK_HOURLY_PRICES_2023 
    : MOCK_HOURLY_PRICES_2024;
  
  // Převedeme hodinové ceny na čtvrthodinové (zopakujeme každou 4×)
  const quarterlyPricesEur: number[] = [];
  hourlyPricesEur.forEach(price => {
    quarterlyPricesEur.push(price, price, price, price);
  });
  
  // Převedeme EUR/MWh na Kč/kWh
  const quarterlyPricesKWh = quarterlyPricesEur.map(
    price => convertEurMWhToKczKWh(price, exchangeRate)
  );
  
  // Krok 2: Vytvoříme roční data (365 dní × 96 čtvrthodin = 35,040 hodnot)
  const daysInYear = 365;
  const yearlyCoefficients: number[] = [];
  const yearlyPrices: number[] = [];
  
  for (let day = 0; day < daysInYear; day++) {
    yearlyCoefficients.push(...dailyCoefficients);
    yearlyPrices.push(...quarterlyPricesKWh);
  }
  
  // Krok 3: Spočítáme sumu koeficientů za celý rok
  const totalCoefficients = yearlyCoefficients.reduce((sum, coef) => sum + coef, 0);
  
  // Krok 4: Vypočítáme spotřebu v každé čtvrthodině
  const quarterlyConsumption = yearlyCoefficients.map(coef => 
    (coef / totalCoefficients) * input.yearlyConsumption
  );
  
  // Krok 5: Vypočítáme náklady v každé čtvrthodině
  const quarterlyCosts = quarterlyConsumption.map((consumption, index) => 
    consumption * yearlyPrices[index]
  );
  
  // Krok 6: Celkové náklady = suma všech čtvrthodinových nákladů
  const totalCostPerYear = quarterlyCosts.reduce((sum, cost) => sum + cost, 0);
  
  // Krok 7: Průměrná cena = celkové náklady / celková spotřeba
  const averagePricePerKWh = totalCostPerYear / input.yearlyConsumption;
  
  return {
    input,
    averagePricePerKWh: roundToDecimals(averagePricePerKWh, 2),
    totalCostPerYear: roundToDecimals(totalCostPerYear, 0),
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Výpočet měsíčních průměrů
 * 
 * Pro každý měsíc:
 * 1. Sečteme koeficienty za daný měsíc
 * 2. Vypočítáme spotřebu v každé čtvrthodině
 * 3. Vypočítáme náklady v každé čtvrthodině
 * 4. Průměrná cena = suma nákladů / suma spotřeby
 */
export function calculateMonthlyBreakdown(input: CalculationInput): MonthlyResult[] {
  const exchangeRate = input.exchangeRate || 25;
  
  // Načteme denní data
  const dailyCoefficients = getQuarterHourCoefficients(input.tddCode);
  const hourlyPricesEur = input.year === 2023 
    ? MOCK_HOURLY_PRICES_2023 
    : MOCK_HOURLY_PRICES_2024;
  
  // Převedeme na čtvrthodinové ceny v Kč/kWh
  const quarterlyPricesEur: number[] = [];
  hourlyPricesEur.forEach(price => {
    quarterlyPricesEur.push(price, price, price, price);
  });
  
  const quarterlyPricesKWh = quarterlyPricesEur.map(
    price => convertEurMWhToKczKWh(price, exchangeRate)
  );
  
  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  
  const monthlyResults: MonthlyResult[] = [];
  
  for (let month = 0; month < 12; month++) {
    const days = daysInMonth[month];
    
    // Vytvoříme měsíční data
    const monthlyCoefficients: number[] = [];
    const monthlyPrices: number[] = [];
    
    for (let day = 0; day < days; day++) {
      monthlyCoefficients.push(...dailyCoefficients);
      monthlyPrices.push(...quarterlyPricesKWh);
    }
    
    // Suma koeficientů za měsíc
    const totalCoefficients = monthlyCoefficients.reduce((sum, coef) => sum + coef, 0);
    
    // Měsíční spotřeba (předpokládáme rovnoměrné rozložení)
    const monthlyConsumption = (input.yearlyConsumption / 12);
    
    // Vypočítáme spotřebu v každé čtvrthodině
    const quarterlyConsumption = monthlyCoefficients.map(coef => 
      (coef / totalCoefficients) * monthlyConsumption
    );
    
    // Vypočítáme náklady
    const quarterlyCosts = quarterlyConsumption.map((consumption, index) => 
      consumption * monthlyPrices[index]
    );
    
    const totalCost = quarterlyCosts.reduce((sum, cost) => sum + cost, 0);
    const averagePrice = totalCost / monthlyConsumption;
    
    monthlyResults.push({
      month: month + 1,
      monthName: monthNames[month],
      averagePricePerKWh: roundToDecimals(averagePrice, 2),
      consumption: roundToDecimals(monthlyConsumption, 0),
      totalCost: roundToDecimals(totalCost, 0)
    });
  }
  
  return monthlyResults;
}

/**
 * Porovnání fixní ceny vs. spotová cena
 */
export interface ComparisonResult {
  spotPrice: CalculationResult;
  fixedPrice: number; // Kč/kWh
  
  savingsPerKWh: number; // Kč
  savingsPerYear: number; // Kč
  savingsPercentage: number; // %
  
  isSpotCheaper: boolean;
}

export function compareFixedVsSpot(
  input: CalculationInput,
  fixedPricePerKWh: number
): ComparisonResult {
  const spotResult = calculateSpotPrice(input);
  
  const fixedTotalCost = fixedPricePerKWh * input.yearlyConsumption;
  const savingsPerYear = fixedTotalCost - spotResult.totalCostPerYear;
  const savingsPerKWh = fixedPricePerKWh - spotResult.averagePricePerKWh;
  const savingsPercentage = (savingsPerYear / fixedTotalCost) * 100;
  
  return {
    spotPrice: spotResult,
    fixedPrice: fixedPricePerKWh,
    savingsPerKWh: roundToDecimals(savingsPerKWh, 2),
    savingsPerYear: roundToDecimals(savingsPerYear, 0),
    savingsPercentage: roundToDecimals(savingsPercentage, 1),
    isSpotCheaper: spotResult.averagePricePerKWh < fixedPricePerKWh
  };
}

/**
 * Helper: zaokrouhlení na X desetinných míst
 */
function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}
