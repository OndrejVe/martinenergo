import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card border-t-2 border-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="space-y-3">
            <h3 className="text-xl font-bold gradient-text">⚡ Martin</h3>
            <p className="text-sm text-muted-foreground">{t.footer.tagline}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Právní informace</h4>
            <div className="flex flex-col space-y-2">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-privacy"
              >
                {t.footer.privacy}
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-terms"
              >
                {t.footer.terms}
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{t.footer.contact}</h4>
            <div className="flex flex-col space-y-1">
              <a
                href="mailto:info@martin-ai.cz"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                info@martin-ai.cz
              </a>
              <a
                href="tel:+420123456789"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                +420 123 456 789
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Martin AI. Všechna práva vyhrazena.
          </p>
        </div>
      </div>
    </footer>
  );
}
