import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Calculator() {
  const { t } = useLanguage();
  const [currentPrice, setCurrentPrice] = useState<string>("6.5");
  const [consumption, setConsumption] = useState<string>("3000");
  const [savings, setSavings] = useState<number | null>(null);

  // Average wholesale price (simplified - in reality this would come from API)
  const wholesalePrice = 3.2; // Kč per kWh

  const calculateSavings = () => {
    const current = parseFloat(currentPrice);
    const usage = parseFloat(consumption);
    
    if (isNaN(current) || isNaN(usage) || current <= 0 || usage <= 0) {
      return;
    }

    const currentCost = current * usage;
    const wholesaleCost = wholesalePrice * usage;
    const potentialSavings = currentCost - wholesaleCost;
    
    setSavings(Math.max(0, potentialSavings));
  };

  const scrollToChat = () => {
    const element = document.getElementById("chat");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="calculator" className="py-20 md:py-24 bg-card/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingDown className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl md:text-4xl">{t.calculator.title}</CardTitle>
              <CardDescription className="text-base md:text-lg">
                {t.calculator.subtitle}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPrice" className="text-base">
                    {t.calculator.currentPriceLabel}
                  </Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.1"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    placeholder="6.5"
                    className="text-lg h-12"
                    data-testid="input-current-price"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consumption" className="text-base">
                    {t.calculator.consumptionLabel}
                  </Label>
                  <Input
                    id="consumption"
                    type="number"
                    step="100"
                    value={consumption}
                    onChange={(e) => setConsumption(e.target.value)}
                    placeholder="3000"
                    className="text-lg h-12"
                    data-testid="input-consumption"
                  />
                </div>
              </div>

              <Button
                onClick={calculateSavings}
                className="w-full h-12 text-lg"
                size="lg"
                data-testid="button-calculate"
              >
                {t.calculator.calculate}
              </Button>

              {savings !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-br from-chart-2/10 to-primary/5 rounded-lg p-6 text-center border border-chart-2/20"
                >
                  <p className="text-sm text-muted-foreground mb-2">
                    {t.calculator.savingsPrefix}
                  </p>
                  <p className="text-5xl md:text-6xl font-bold text-chart-2 font-mono mb-2" data-testid="text-savings-amount">
                    {savings.toLocaleString("cs-CZ", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    {t.calculator.savingsSuffix}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.calculator.compareText}
                  </p>

                  <Button
                    onClick={scrollToChat}
                    className="mt-6"
                    variant="outline"
                    data-testid="button-ask-martin"
                  >
                    {t.calculator.askMartin}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                * Výpočet je orientační a vychází z průměrné velkoobchodní ceny {wholesalePrice} Kč/kWh.
                Skutečné úspory se mohou lišit podle konkrétního tarifu a spotřeby.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
