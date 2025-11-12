import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingDown, Eye, Zap, MessageSquare, Calculator, Lightbulb } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  {
    icon: MessageSquare,
    titleKey: "feature1Title",
    descKey: "feature1Desc",
    gradient: "from-primary to-accent",
  },
  {
    icon: Calculator,
    titleKey: "feature2Title",
    descKey: "feature2Desc",
    gradient: "from-secondary to-chart-2",
  },
  {
    icon: Lightbulb,
    titleKey: "feature3Title",
    descKey: "feature3Desc",
    gradient: "from-accent to-primary",
  },
  {
    icon: Eye,
    titleKey: "feature4Title",
    descKey: "feature4Desc",
    gradient: "from-primary to-secondary",
  },
  {
    icon: TrendingDown,
    titleKey: "feature5Title",
    descKey: "feature5Desc",
    gradient: "from-chart-2 to-accent",
  },
];

export function WhySpotSection() {
  const { t } = useLanguage();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-spot" className="py-24 md:py-32 relative overflow-hidden bg-muted/30" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-secondary/5"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg float-animation">
              <Zap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 gradient-text-animated">
            {t.whySpot.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.whySpot.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <Card className="h-full hover-elevate active-elevate-2 transition-all duration-300 border-2" data-testid={`card-feature-${index}`}>
                  <CardHeader className="space-y-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {t.whySpot[feature.titleKey as keyof typeof t.whySpot]}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {t.whySpot[feature.descKey as keyof typeof t.whySpot]}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
