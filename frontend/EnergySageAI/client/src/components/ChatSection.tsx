import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoAvatar } from "./VideoAvatar";
import { ChatInterface } from "./ChatInterface";
import { motion } from "framer-motion";
import { Bolt, LineChart, PhoneCall } from "lucide-react";

export function ChatSection() {
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [avatarSessionId, setAvatarSessionId] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  console.log("[ChatSection] Render - State:", { isAvatarActive, avatarSessionId, isSessionReady });
  
  const handleAvatarActivate = (active: boolean) => {
    console.log("[ChatSection] handleAvatarActivate called with:", active);
    setIsAvatarActive(active);
    console.log("[ChatSection] setIsAvatarActive called");
  };

  return (
    <section id="chat" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text-animated">
            Konverzace s Martinem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Zeptejte se na cokoliv o spotových cenách elektřiny
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-12"
        >
          <Card className="backdrop-blur-xl bg-card/90 border-2 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-8 p-6 xl:p-10">
              <div className="flex-1 min-h-[420px]">
                <VideoAvatar
                  isActive={isAvatarActive}
                  onSessionCreated={setAvatarSessionId}
                  onSessionReady={() => setIsSessionReady(true)}
                />
              </div>
              <div className="lg:w-[380px] space-y-4 text-sm">
                <h3 className="font-semibold text-lg text-foreground">Martin – osobní průvodce</h3>
                <p className="text-muted-foreground">
                  Avatar viditelně reaguje na vaše dotazy. Jakmile odpoví textem, stejný obsah
                  přednese hlasově a navede vás na další krok – analýzu úspor, porovnání nebo kontakt.
                </p>
                <div className="space-y-3">
                  <InsightCard
                    icon={<Bolt className="h-5 w-5 text-primary" />}
                    title="Okamžitá reakce"
                    description="Avatar shrne odpověď jako první, text v chatu ji jen doplní."
                  />
                  <InsightCard
                    icon={<LineChart className="h-5 w-5 text-primary" />}
                    title="Srozumitelná čísla"
                    description="Namísto grafů dostanete stručné shrnutí, kolik můžete ušetřit."
                  />
                  <InsightCard
                    icon={<PhoneCall className="h-5 w-5 text-primary" />}
                    title="Naváže kontakt"
                    description="Pokud chcete, Martin si řekne o e-mail a odešle PDF nabídku."
                  />
                </div>
                <div className="pt-2 text-sm">
                  Stav relace:{" "}
                  <Badge variant={isAvatarActive && isSessionReady ? "default" : "secondary"}>
                    {isAvatarActive && isSessionReady ? "Avatar mluví" : "Spouštím avatar…"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-xl bg-card/85 border-2 shadow-xl">
            <div className="p-4">
              <ChatInterface
                onAvatarActivate={handleAvatarActivate}
                avatarSessionId={avatarSessionId}
                isSessionReady={isSessionReady}
                avatarActive={isAvatarActive}
                onMessageSent={(message) => {
                  console.log("[ChatSection] Message sent:", message);
                }}
              />
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

const InsightCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="rounded-2xl border bg-background/60 px-4 py-3 flex items-start gap-3">
    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">{icon}</div>
    <div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);
