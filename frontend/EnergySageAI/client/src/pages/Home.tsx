import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { WhySpotSection } from "@/components/WhySpotSection";
import { BusinessSection } from "@/components/BusinessSection";
import { ChatSection } from "@/components/ChatSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { TestTube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

export default function Home() {
  const [testResult, setTestResult] = useState<any>(null);
  
  const runCalculationTest = async () => {
    try {
      const response = await apiRequest("POST", "/api/calculate", {
        tddCode: "C02d",
        yearlyConsumption: 3500,
        year: 2024,
        fixedPrice: 2.50
      });
      
      console.log("Test calculation result:", response);
      setTestResult(response);
      alert("Kalkulace úspěšná! Otevřete konzoli pro detaily.");
    } catch (error) {
      console.error("Test failed:", error);
      alert("Chyba při kalkulaci!");
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        <WhySpotSection />
        <ChatSection />
        <BusinessSection />
      </main>
      <Footer />
      
      {/* DEV ONLY: Test kalkulací */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={runCalculationTest}
            variant="outline"
            size="lg"
            className="shadow-lg border-2 border-primary/50 hover-elevate"
            data-testid="button-test-calculation"
          >
            <TestTube className="mr-2 h-5 w-5" />
            Test Kalkulace
          </Button>
        </div>
      )}
    </div>
  );
}
