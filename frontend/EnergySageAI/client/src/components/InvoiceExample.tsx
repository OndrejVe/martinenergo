import { motion } from "framer-motion";
import { AlertCircle, FileText, Search, Home, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InvoiceExampleProps {
  onClose?: () => void;
  defaultTab?: "household" | "business";
}

export function InvoiceExample({ onClose, defaultTab = "household" }: InvoiceExampleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Alert className="border-primary/30 bg-primary/5">
        <Search className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <strong>Jak najít váš TDD kód:</strong> Hledejte na faktuře označení{" "}
          <span className="font-mono font-bold text-primary">C01d, C02d, C25d, C35d</span> nebo podobné.
          Většinou v sekci "Distribuční služby" nebo "Druh sazby".
        </AlertDescription>
      </Alert>

      <Card className="border-2 border-border">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Vzorová faktura za elektřinu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="household" data-testid="tab-household">
                <Home className="w-4 h-4 mr-2" />
                Domácnost
              </TabsTrigger>
              <TabsTrigger value="business" data-testid="tab-business">
                <Building2 className="w-4 h-4 mr-2" />
                Firma
              </TabsTrigger>
            </TabsList>

            {/* DOMÁCNOST */}
            <TabsContent value="household">
              <InvoiceTemplate
                clientName="Jan Novák"
                clientAddress={["Dlouhá 123", "110 00 Praha 1"]}
                tddCode="C02d"
                tddLabel="Běžná domácnost"
                consumption="300 kWh"
                period="1.8. - 31.8.2024"
                electricityPrice={1245}
                distributionPrice={890}
                totalPrice={2350}
              />
            </TabsContent>

            {/* FIRMA */}
            <TabsContent value="business">
              <InvoiceTemplate
                clientName="ABC s.r.o."
                clientAddress={["Průmyslová 456", "140 00 Praha 4", "IČO: 12345678"]}
                tddCode="C25d"
                tddLabel="Firma pracovní doba 8-17h"
                consumption="1 250 kWh"
                period="1.8. - 31.8.2024"
                electricityPrice={4980}
                distributionPrice={3560}
                totalPrice={9150}
              />
            </TabsContent>
          </Tabs>

          {/* TDD KÓDY - KOMPLETNÍ SEZNAM */}
          <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/30">
            <h5 className="font-semibold text-sm mb-3 text-accent">
              Všechny TDD kódy v ČR:
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Domácnosti:</p>
                <div><span className="font-mono font-bold text-primary">C01d</span> - Malá spotřeba (do 1800 kWh/rok)</div>
                <div><span className="font-mono font-bold text-primary">C02d</span> - Běžná spotřeba (1800-4000 kWh/rok)</div>
                <div><span className="font-mono font-bold text-primary">C03d</span> - Vysoká spotřeba (nad 4000 kWh/rok)</div>
              </div>
              
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Firmy malé (do 50 MWh/rok):</p>
                <div><span className="font-mono font-bold text-primary">C25d</span> - Pracovní doba 8-17h</div>
                <div><span className="font-mono font-bold text-primary">C26d</span> - Rozšířená doba 6-20h</div>
              </div>
              
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Firmy střední (50-630 MWh/rok):</p>
                <div><span className="font-mono font-bold text-primary">C35d</span> - Nepřetržitý 24/7</div>
                <div><span className="font-mono font-bold text-primary">C45d</span> - Dvousměnný 6-22h</div>
                <div><span className="font-mono font-bold text-primary">C46d</span> - Třísměnný s víkendem</div>
              </div>
              
              <div className="space-y-1">
                <p className="font-semibold text-foreground mb-2">Firmy velké (nad 630 MWh/rok):</p>
                <div><span className="font-mono font-bold text-primary">C55d</span> - Výroba 2směnná</div>
                <div><span className="font-mono font-bold text-primary">C56d</span> - Výroba 3směnná</div>
                <div><span className="font-mono font-bold text-primary">C62d</span> - Průmysl nepřetržitý</div>
                <div><span className="font-mono font-bold text-primary">C63d</span> - Průmysl rovnoměrný</div>
              </div>
              
              <div className="space-y-1 md:col-span-2">
                <p className="font-semibold text-foreground mb-2">Speciální tarify:</p>
                <div><span className="font-mono font-bold text-primary">C01e</span> - Akumulační ohřev (noční proud)</div>
                <div><span className="font-mono font-bold text-primary">C02e</span> - Přímotopy (dvojtarif VT/NT)</div>
                <div><span className="font-mono font-bold text-primary">C03e</span> - Tepelné čerpadlo (trojí tarif)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Pomocná komponenta pro šablonu faktury
interface InvoiceTemplateProps {
  clientName: string;
  clientAddress: string[];
  tddCode: string;
  tddLabel: string;
  consumption: string;
  period: string;
  electricityPrice: number;
  distributionPrice: number;
  totalPrice: number;
}

function InvoiceTemplate({
  clientName,
  clientAddress,
  tddCode,
  tddLabel,
  consumption,
  period,
  electricityPrice,
  distributionPrice,
  totalPrice
}: InvoiceTemplateProps) {
  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 bg-background space-y-6">
      {/* HLAVIČKA */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-bold text-primary">ČEZ Prodej</h3>
            <p className="text-sm text-muted-foreground">Duhová 2/1444, 140 00 Praha 4</p>
            <p className="text-sm text-muted-foreground">IČO: 27232433, DIČ: CZ27232433</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">Daňový doklad - Faktura</p>
            <p className="text-sm text-muted-foreground">č. 2024123456789</p>
            <p className="text-sm text-muted-foreground">Datum vystavení: 15.09.2024</p>
            <p className="text-sm text-muted-foreground">Datum splatnosti: 30.09.2024</p>
          </div>
        </div>
      </div>

      {/* ODBĚRATEL */}
      <div className="border-b pb-4">
        <h4 className="font-semibold mb-2">Odběratel:</h4>
        <p className="text-sm font-semibold">{clientName}</p>
        {clientAddress.map((line, i) => (
          <p key={i} className="text-sm text-muted-foreground">{line}</p>
        ))}
        <p className="text-sm text-muted-foreground mt-2">
          <strong>EIC:</strong> 27ZG400Z0000123456
        </p>
      </div>

      {/* POLOŽKY - TDD ZVÝRAZNĚNO */}
      <div>
        <h4 className="font-semibold mb-3">Položky faktury:</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-2 border-b">
            <span>Silová elektřina (spot)</span>
            <span className="font-semibold">{electricityPrice.toLocaleString()} Kč</span>
          </div>

          {/* DISTRIBUČNÍ SLUŽBY - HLAVNÍ ČÁST S TDD */}
          <div className="border-2 border-primary/50 rounded-lg p-3 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-primary" />
              <span className="font-semibold text-primary">Distribuční služby</span>
            </div>
            <div className="space-y-1 text-sm pl-6">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-muted-foreground">Druh sazby: </span>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                    {tddCode}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{tddLabel}</p>
                </div>
                <span className="font-semibold">{distributionPrice.toLocaleString()} Kč</span>
              </div>
              <p className="text-xs text-muted-foreground italic">
                ↑ Toto je váš TDD kód!
              </p>
            </div>
          </div>

          <div className="flex justify-between text-sm py-2 border-b">
            <span>Systémové služby (OTE)</span>
            <span className="font-semibold">{Math.round(totalPrice * 0.02).toLocaleString()} Kč</span>
          </div>

          <div className="flex justify-between text-sm py-2 border-b">
            <span>Podpora OZE (POZE)</span>
            <span className="font-semibold">{Math.round(totalPrice * 0.05).toLocaleString()} Kč</span>
          </div>

          <div className="flex justify-between text-sm py-2 border-b">
            <span>Měsíční paušál</span>
            <span className="font-semibold">50 Kč</span>
          </div>

          {/* CELKEM */}
          <div className="flex justify-between text-lg font-bold pt-3 mt-3 border-t-2">
            <span>CELKEM k úhradě:</span>
            <span className="text-primary">{totalPrice.toLocaleString()} Kč</span>
          </div>
        </div>
      </div>

      {/* POZNÁMKA */}
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
        <p><strong>Variabilní symbol:</strong> 2024123456789</p>
        <p><strong>Číslo účtu:</strong> 123456789/0800</p>
        <p className="mt-2">Spotřeba za období: {period} ({consumption})</p>
      </div>
    </div>
  );
}
