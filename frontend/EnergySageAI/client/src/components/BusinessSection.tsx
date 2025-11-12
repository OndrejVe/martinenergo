import { motion } from "framer-motion";
import { Building2, TrendingDown, Clock, Zap, FileCheck, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";

export function BusinessSection() {
  const { language } = useLanguage();
  
  const features = [
    {
      icon: TrendingDown,
      titleCs: "Úspora až 30%",
      titleSk: "Úspora až 30%",
      descCs: "Firmy s pracovní dobou 8-17h netankují drahé večerní špičky. Průměrná úspora 20-30% oproti fixnímu tarifu.",
      descSk: "Firmy s pracovnou dobou 8-17h netankujú drahé večerné špičky. Priemerná úspora 20-30% oproti fixnému tarifu.",
      color: "text-green-500"
    },
    {
      icon: Clock,
      titleCs: "Flexibilní provoz",
      titleSk: "Flexibilný provoz",
      descCs: "Díky TDD profilům najdeme ideální tarif pro váš typ provozu - od kanceláří po nepřetržitou výrobu.",
      descSk: "Vďaka TDD profilom nájdeme ideálny tarif pre váš typ prevádzky - od kancelárií po nepretržitú výrobu.",
      color: "text-blue-500"
    },
    {
      icon: Zap,
      titleCs: "15 různých TDD sazeb",
      titleSk: "15 rôznych TDD sadzieb",
      descCs: "C25d (kanceláře), C35d (24/7), C45d (dvousměnný), C55d-C63d (průmysl). Pro každý typ provozu.",
      descSk: "C25d (kancelárie), C35d (24/7), C45d (dvojzmenný), C55d-C63d (priemysel). Pre každý typ prevádzky.",
      color: "text-primary"
    },
    {
      icon: FileCheck,
      titleCs: "Bez administrativy",
      titleSk: "Bez administratívy",
      descCs: "Martin vše zařídí - najde váš TDD kód, spočítá úspory a pomůže s přechodem na spot.",
      descSk: "Martin všetko vybavit - nájde váš TDD kód, vypočíta úspory a pomôže s prechodom na spot.",
      color: "text-orange-500"
    },
    {
      icon: BarChart3,
      titleCs: "Real-time data",
      titleSk: "Real-time data",
      descCs: "Přehled spotových cen každou hodinu. Vidíte přesně, kdy je elektřina nejlevnější.",
      descSk: "Prehľad spotových cien každú hodinu. Vidíte presne, kedy je elektrina najlacnejšia.",
      color: "text-cyan-500"
    }
  ];

  const businessTypes = [
    { cs: "Kanceláře", sk: "Kancelárie", tdd: "C25d" },
    { cs: "Obchody", sk: "Obchody", tdd: "C26d" },
    { cs: "Výroba 24/7", sk: "Výroba 24/7", tdd: "C35d" },
    { cs: "Dvousměnný provoz", sk: "Dvojzmenný provoz", tdd: "C45d" },
    { cs: "Velká výroba", sk: "Veľká výroba", tdd: "C55d-C63d" }
  ];

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-accent/5 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wide">
              {language === "cs" ? "Pro firmy" : "Pre firmy"}
            </span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-text-animated">
            {language === "cs" 
              ? "Spotové ceny šetří i vaší firmě"
              : "Spotové ceny šetria aj vašej firme"
            }
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {language === "cs"
              ? "Martin zná všech 15 TDD sazeb pro firmy v ČR. Najde tu pravou pro váš provoz a spočítá přesné úspory."
              : "Martin pozná všetkých 15 TDD sadzieb pre firmy v ČR. Nájde tú pravú pre vašu prevádzku a vypočíta presné úspory."
            }
          </p>
        </motion.div>

        {/* VÝHODY PRO FIRMY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover-elevate border-border">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {language === "cs" ? feature.titleCs : feature.titleSk}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {language === "cs" ? feature.descCs : feature.descSk}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* TYPY PROVOZŮ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border-2 border-primary/20 rounded-2xl p-8 md:p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold">
              {language === "cs" 
                ? "Máme tarif pro každý typ provozu"
                : "Máme tarif pre každý typ prevádzky"
              }
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {businessTypes.map((type, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="px-4 py-2 text-sm hover-elevate cursor-pointer"
                data-testid={`badge-business-${index}`}
              >
                <span className="font-semibold">{language === "cs" ? type.cs : type.sk}</span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="font-mono text-primary">{type.tdd}</span>
              </Badge>
            ))}
          </div>

          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-sm md:text-base text-foreground">
              <strong className="text-green-600 dark:text-green-400">
                {language === "cs" ? "Příklad:" : "Príklad:"}
              </strong>{" "}
              {language === "cs"
                ? "Firma s kancelářským provozem 8-17h (TDD C25d) při spotřebě 50 MWh/rok ušetří průměrně 80 000 Kč ročně oproti fixnímu tarifu 2.50 Kč/kWh."
                : "Firma s kancelárskym prevádzkam 8-17h (TDD C25d) pri spotrebe 50 MWh/rok ušetrí priemerne 80 000 Kč ročne oproti fixnému tarifu 2.50 Kč/kWh."
              }
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
