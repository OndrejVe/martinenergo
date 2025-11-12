import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

interface SavingsComparisonChartProps {
  spotPrice: number;
  fixedPrice: number;
  yearlyConsumption: number;
  title?: string;
  description?: string;
}

export function SavingsComparisonChart({
  spotPrice,
  fixedPrice,
  yearlyConsumption,
  title,
  description,
}: SavingsComparisonChartProps) {
  const chartConfig = {
    spot: {
      label: "Spotová cena",
      color: "hsl(190 85% 45%)",
    },
    fixed: {
      label: "Fixní cena",
      color: "hsl(25 95% 55%)",
    },
  } satisfies Record<string, { label: string; color: string }>;

  const spotCost = spotPrice * yearlyConsumption;
  const fixedCost = fixedPrice * yearlyConsumption;

  const data = [
    {
      name: "Roční náklady",
      spot: spotCost,
      fixed: fixedCost,
    },
  ];

  return (
    <Card className="border-primary/20" data-testid="card-savings-comparison-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">{title || "Porovnání nákladů"}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" />
            <YAxis
              tickFormatter={(value) =>
                `${(value / 1000).toFixed(0)}k Kč`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toLocaleString()} Kč`}
                />
              }
            />
            <Legend />
            <Bar dataKey="spot" fill={chartConfig.spot.color} radius={[8, 8, 0, 0]} />
            <Bar dataKey="fixed" fill={chartConfig.fixed.color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
        
        {/* Úspora zobrazena pod grafem - VELKÉ ČÍSELNÉ HODNOTY */}
        <div className="mt-6 p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border-2 border-green-500/20 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Vaše roční úspora
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-6xl md:text-7xl font-bold text-green-600 dark:text-green-400">
              {Math.abs(fixedCost - spotCost).toLocaleString()}
            </span>
            <span className="text-2xl md:text-3xl font-semibold text-muted-foreground">
              Kč
            </span>
          </div>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400 mt-2">
            ({(((fixedCost - spotCost) / fixedCost) * 100).toFixed(1)}%)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
