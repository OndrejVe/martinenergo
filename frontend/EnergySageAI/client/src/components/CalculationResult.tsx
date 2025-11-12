import { motion } from "framer-motion";
import { TrendingDown, Zap, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CalculationResultProps {
  result: {
    averagePricePerKWh: number;
    totalCostPerYear: number;
    input: {
      tddCode: string;
      yearlyConsumption: number;
      year: number;
    };
  };
  comparison?: {
    fixedPrice: number;
    savingsPerYear: number;
    savingsPercentage: number;
    isSpotCheaper: boolean;
  } | null;
}

export function CalculationResult({ result, comparison }: CalculationResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* HLAVNÍ VÝSLEDEK - VELKÉ ČÍSLO */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <CardHeader className="text-center pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Vaše průměrná cena
          </CardTitle>
          <p className="text-xs text-muted-foreground/70">
            za období {result.input.year} (TDD {result.input.tddCode})
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mb-4"
          >
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-6xl md:text-7xl font-bold gradient-text-animated">
                {result.averagePricePerKWh.toFixed(2)}
              </span>
              <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                Kč/kWh
              </span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Roční spotřeba
                </p>
              </div>
              <p className="text-lg font-semibold">
                {result.input.yearlyConsumption.toLocaleString()} kWh
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Roční náklad
                </p>
              </div>
              <p className="text-lg font-semibold">
                {result.totalCostPerYear.toLocaleString()} Kč
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POROVNÁNÍ S FIXNÍ CENOU (pokud zadáno) */}
      {comparison && (
        <Card className={`border-2 ${
          comparison.isSpotCheaper 
            ? 'border-green-500/30 bg-gradient-to-br from-green-500/10 via-background to-green-500/5' 
            : 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-background to-orange-500/5'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {comparison.isSpotCheaper ? (
                <>
                  <TrendingDown className="w-5 h-5 text-green-500" />
                  <span>Ušetříte při spotovém tarifu!</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span>Fixní tarif by byl levnější</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Porovnání cen */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Fixní cena</p>
                  <p className="text-2xl font-bold">
                    {comparison.fixedPrice.toFixed(2)} Kč/kWh
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                  <p className="text-xs text-muted-foreground mb-1">Spotová cena</p>
                  <p className="text-2xl font-bold text-primary">
                    {result.averagePricePerKWh.toFixed(2)} Kč/kWh
                  </p>
                </div>
              </div>

              {/* Úspora */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-2">
                  {comparison.isSpotCheaper ? 'Vaše roční úspora' : 'Roční rozdíl'}
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-5xl font-bold ${
                    comparison.isSpotCheaper ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {Math.abs(comparison.savingsPerYear).toLocaleString()}
                  </span>
                  <span className="text-xl font-semibold text-muted-foreground">Kč</span>
                </div>
                <p className={`text-lg font-semibold mt-2 ${
                  comparison.isSpotCheaper ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                }`}>
                  ({Math.abs(comparison.savingsPercentage).toFixed(1)}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
