import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface SpotPriceChartProps {
  data: Array<{
    hour: number;
    price: number;
  }>;
  title?: string;
  description?: string;
}

export function SpotPriceChart({ data, title, description }: SpotPriceChartProps) {
  const chartConfig = {
    price: {
      label: "Cena",
      color: "hsl(var(--primary))",
    },
  };

  const formattedData = data.map(d => ({
    hour: `${d.hour}:00`,
    price: d.price,
  }));

  return (
    <Card className="border-primary/20" data-testid="card-spot-price-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">{title || "Spotové ceny během dne"}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              className="text-xs"
              interval={3}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              className="text-xs"
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toFixed(2)} Kč/kWh`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              fill="url(#priceGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
