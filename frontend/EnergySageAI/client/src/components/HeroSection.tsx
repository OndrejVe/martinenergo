import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MessageSquare, Zap, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function HeroSection() {
  const { t } = useLanguage();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-animated-gradient"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-8 inline-block">
            <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center float-animation border-4 border-white/40">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 drop-shadow-lg">
            {t.hero.title}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto mb-12 leading-relaxed drop-shadow-md"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            onClick={() => scrollToSection("chat")}
            className="text-xl px-10 h-14 bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl"
            data-testid="button-start-chat"
          >
            <MessageSquare className="mr-3 h-6 w-6" />
            {t.hero.ctaPrimary}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <button
            onClick={() => scrollToSection("chat")}
            className="flex flex-col items-center text-white/90 hover:text-white transition-colors"
            data-testid="button-scroll-down"
          >
            <span className="text-sm mb-2 font-medium">Zjistit více</span>
            <ChevronDown className="h-8 w-8 animate-bounce" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
