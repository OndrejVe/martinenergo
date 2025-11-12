import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import type { Language } from "@/lib/translations";

export function Navigation() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-background/90 border-b-2 border-primary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-2xl font-bold gradient-text hover-elevate active-elevate-2 rounded-md px-3 py-2"
              data-testid="link-home"
            >
              ⚡ Martin
            </button>
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("why-spot")}
                data-testid="link-why-spot"
              >
                {t.nav.home}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection("contact")}
                data-testid="link-contact"
              >
                {t.nav.contact}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center border border-border rounded-md p-1">
              <Button
                variant={language === "cs" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLanguage("cs")}
                className="h-7 px-3"
                data-testid="button-lang-cs"
              >
                CZ
              </Button>
              <Button
                variant={language === "sk" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setLanguage("sk")}
                className="h-7 px-3"
                data-testid="button-lang-sk"
              >
                SK
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
