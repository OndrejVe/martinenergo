import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";

interface TddBandsChartProps {
  tddCode: string;
  title?: string;
  description?: string;
}

// TDD pásma (simplified visualization)
const TDD_BANDS = {
  C01d: { VT: 0.2, NT: 0.5, VolT: 0.3 },
  C02d: { VT: 0.25, NT: 0.5, VolT: 0.25 },
  C03d: { VT: 0.3, NT: 0.5, VolT: 0.2 },
  C11d: { VT: 0.4, NT: 0.4, VolT: 0.2 },
  C12d: { VT: 0.45, NT: 0.35, VolT: 0.2 },
  C13d: { VT: 0.5, NT: 0.3, VolT: 0.2 },
};

export function TddBandsChart({ tddCode, title, description }: TddBandsChartProps) {
  const chartConfig = {
    VT: {
      label: "Vysoký tarif (VT)",
      color: "hsl(var(--chart-1))",
    },
    NT: {
      label: "Nízký tarif (NT)",
      color: "hsl(var(--chart-2))",
    },
    VolT: {
      label: "Volný tarif (VolT)",
      color: "hsl(var(--chart-3))",
    },
  };

  const bands = TDD_BANDS[tddCode as keyof typeof TDD_BANDS] || TDD_BANDS.C02d;

  const data = [
    {
      name: "Rozdělení spotřeby",
      VT: bands.VT * 100,
      NT: bands.NT * 100,
      VolT: bands.VolT * 100,
    },
  ];

  return (
    <Card className="border-primary/20" data-testid="card-tdd-bands-chart">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">{title || `TDD pásma - ${tddCode}`}</span>
        </CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" tickFormatter={(value) => `${value}%`} />
            <YAxis type="category" dataKey="name" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => `${Number(value).toFixed(1)}%`}
                />
              }
            />
            <Legend />
            <Bar dataKey="VT" stackId="a" fill="var(--color-VT)" />
            <Bar dataKey="NT" stackId="a" fill="var(--color-NT)" />
            <Bar dataKey="VolT" stackId="a" fill="var(--color-VolT)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
