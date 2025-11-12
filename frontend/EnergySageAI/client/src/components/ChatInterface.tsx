import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Send,
  Mic,
  MicOff,
  ExternalLink,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalculationResult } from "./CalculationResult";
import { InvoiceExample } from "./InvoiceExample";
import { LeadCollectionForm } from "./LeadCollectionForm";
import { sendTextToAvatar } from "./VideoAvatar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  link?: { url: string; title: string };
  sources?: Array<{ title?: string; url?: string; text?: string }>;
  chart?: {
    title?: string;
    labels: string[];
    data: number[];
    meta?: Record<string, any>;
  };
  calculation?: {
    result: any;
    comparison?: any;
  };
  calculationResult?: any; // From AI function call
  showInvoice?: boolean;
  showLeadForm?: boolean;
  leadFormContext?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onMessageSent?: (message: string) => void;
  onAvatarActivate?: (isActive: boolean) => void;
  avatarSessionId?: string | null;
  isSessionReady?: boolean; // Indicates when LiveKit connection is ready for TTS
  avatarActive?: boolean;
}

export function ChatInterface({ onMessageSent, onAvatarActivate, avatarSessionId, isSessionReady, avatarActive = false }: ChatInterfaceProps) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    const stored = sessionStorage.getItem("chatSessionId");
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("chatSessionId", newId);
    return newId;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarSessionIdRef = useRef<string | null>(null);
  const isSessionReadyRef = useRef<boolean>(false);

  // Keep refs in sync with props for live access in closures
  useEffect(() => {
    avatarSessionIdRef.current = avatarSessionId || null;
  }, [avatarSessionId]);

  useEffect(() => {
    isSessionReadyRef.current = isSessionReady || false;
  }, [isSessionReady]);

  // Note: We don't load history from DB on mount to avoid race conditions
  // Messages are only added via chatMutation for simplicity
  // If you need persistence across page reloads, implement manual refetch

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        message,
        sessionId,
        language: "cs", // TODO: Get from LanguageContext
      });
      // apiRequest returns raw Response - need to parse JSON
      return await response.json();
    },
    onSuccess: async (response: any) => {
      console.log("Chat mutation success:", response);
      
      if (response.success && response.data) {
        // Mapování z nové AI API struktury
        const aiResponse = response.data.response || response.data.content;
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse,
          image: response.data.image,
          link: response.data.link,
          sources: response.data.context || [],
          chart: response.data.chart,
          showLeadForm: response.data.showLeadForm || !!response.data.calculationResult, // Show lead form after calculation
          leadFormContext: response.data.leadFormContext || "Pro dokončení výpočtu a konkrétní nabídku nás kontaktujte:",
          calculationResult: response.data.calculationResult,
          timestamp: new Date(),
        };
        console.log("Adding AI message to state:", aiMessage);
        setMessages((prev) => {
          console.log("Previous messages:", prev);
          const newMessages = [...prev, aiMessage];
          console.log("New messages:", newMessages);
          return newMessages;
        });

        // Send AI response to avatar for TTS - wait for session AND tracks to be ready
        if (aiResponse) {
          const waitForSessionAndSpeak = async (maxRetries = 40) => {
            console.log("[ChatInterface] 🎯 Starting TTS flow - waiting for session AND tracks...");
            
            for (let i = 0; i < maxRetries; i++) {
              const currentSessionId = avatarSessionIdRef.current;
              const sessionReady = isSessionReadyRef.current;
              
              console.log(`[ChatInterface] TTS retry ${i + 1}: sessionId=${!!currentSessionId}, ready=${sessionReady}`);
              
              // CRITICAL: Wait for BOTH session ID AND tracks to be ready
              if (currentSessionId && sessionReady) {
                try {
                  console.log(`[ChatInterface] ✅ Session ready! Sending TTS:`, aiResponse.substring(0, 50));
                  await sendTextToAvatar(currentSessionId, aiResponse);
                  console.log("[ChatInterface] ✅ TTS sent successfully!");
                  return;
                } catch (error: any) {
                  console.error(`[ChatInterface] ❌ TTS failed:`, error.message);
                  return;
                }
              }
              
              // Wait 500ms between retries (40 retries = 20 seconds max wait)
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            console.warn("[ChatInterface] ⚠️ Timeout waiting for session readiness");
          };
          waitForSessionAndSpeak();
        }
      }
      // DON'T deactivate avatar - keep session alive for TTS playback
      // onAvatarActivate?.(false);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Omlouváme se, došlo k chybě. Zkuste to prosím znovu.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      // Keep avatar active even on error
      // onAvatarActivate?.(false);
    },
  });

  const handleSendMessage = async () => {
    console.log("[ChatInterface] ============ handleSendMessage CALLED ============");
    console.log("[ChatInterface] input:", input);
    console.log("[ChatInterface] isPending:", chatMutation.isPending);
    
    if (!input.trim() || chatMutation.isPending) {
      console.log("[ChatInterface] ❌ Returning early - empty input or pending");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    onMessageSent?.(input);
    console.log("[ChatInterface] Activating avatar...");
    console.log("[ChatInterface] onAvatarActivate exists?", !!onAvatarActivate);
    if (onAvatarActivate) {
      onAvatarActivate(true);
      console.log("[ChatInterface] ✅ Avatar activated!");
    } else {
      console.error("[ChatInterface] ❌ onAvatarActivate is undefined!");
    }

    // Save user message to database
    try {
      await apiRequest("POST", "/api/messages", {
        sessionId,
        role: "user",
        content: input,
        hasImage: 0,
        hasLink: 0,
      });
    } catch (error) {
      console.error("Error saving user message:", error);
    }

    // Send to AI API
    chatMutation.mutate(input);
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Váš prohlížeč nepodporuje rozpoznávání řeči");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "cs-CZ";
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleExampleQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 border-b border-border/60">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 shadow-lg border border-primary/30">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                M
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl lg:text-2xl">{t.chat.title}</CardTitle>
              <p className="text-sm text-muted-foreground">Martin – firemní energetický poradce</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={avatarActive ? "default" : "secondary"}>
              {avatarActive ? "Avatar právě mluví" : "Avatar připraven"}
            </Badge>
            <span>
              {messages.length
                ? `${messages.length} zpráv v konverzaci`
                : "Začněte otázkou o tarifech"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${message.role}`}
              >
                {message.role === "assistant" && (
                  <Avatar className="w-11 h-11 border border-primary/40 bg-primary/5 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">M</AvatarFallback>
                  </Avatar>
                )}
                {message.role === "user" && (
                  <Avatar className="w-10 h-10 bg-primary text-primary-foreground shrink-0">
                    <AvatarFallback>Vy</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`rounded-2xl ${
                    message.role === "user"
                      ? "max-w-[80%] bg-primary text-primary-foreground px-4 py-3 shadow-lg"
                      : message.calculation || message.showInvoice
                      ? "w-full"
                      : "max-w-[80%] bg-card border border-border/60 px-4 py-4 shadow-sm"
                  }`}
                >
                  {message.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {message.image && (
                    <div className="mt-2">
                      <button
                        onClick={() => setSelectedImage(message.image!)}
                        className="relative group"
                        data-testid="button-image-preview"
                      >
                        <img
                          src={message.image}
                          alt="Attachment"
                          className="rounded-md max-w-full h-auto hover-elevate transition-all"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white" />
                        </div>
                      </button>
                    </div>
                  )}
                  
                  {message.link && (
                    <a
                      href={message.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center space-x-1 text-xs hover:underline"
                      data-testid="link-message"
                    >
                      <span>{message.link.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {message.calculation && (
                    <div className="mt-3">
                      <CalculationResult
                        result={message.calculation.result}
                        comparison={message.calculation.comparison}
                      />
                    </div>
                  )}

                  {message.showInvoice && (
                    <div className="mt-3">
                      <InvoiceExample />
                    </div>
                  )}

                  {message.calculationResult?.result && (
                    <div className="mt-4">
                      <CalculationResult
                        result={message.calculationResult.result}
                        comparison={message.calculationResult.comparison}
                      />
                    </div>
                  )}

                  {message.chart && (
                    <ChartInsight chart={message.chart} />
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <SourcesList sources={message.sources} />
                  )}

                  {message.showLeadForm && (
                    <div className="mt-3">
                      <LeadCollectionForm
                        context={message.leadFormContext}
                        onSuccess={(data) => {
                          // Pokračovat v konverzaci po úspěšném odeslání
                          const thankYouMessage: Message = {
                            id: (Date.now() + 2).toString(),
                            role: "assistant",
                            content: `Děkuji, ${data.name}! Teď můžeme pokračovat s přesným výpočtem vaších úspor.`,
                            timestamp: new Date(),
                          };
                          setMessages((prev) => [...prev, thankYouMessage]);
                        }}
                      />
                    </div>
                  )}

                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString("cs-CZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 space-y-2 pt-3 border-t border-border/60">
          {isListening && (
            <Badge variant="secondary" className="w-full justify-center py-2">
              <Mic className="mr-2 h-4 w-4 animate-pulse" />
              {t.chat.listening}
            </Badge>
          )}

          <div className="flex items-center space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder={t.chat.placeholder}
              className="flex-1"
              disabled={chatMutation.isPending}
              data-testid="input-chat"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleVoiceInput}
              className={isListening ? "text-destructive" : ""}
              disabled={chatMutation.isPending}
              data-testid="button-voice-input"
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || chatMutation.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardContent>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Enlarged"
            className="max-w-full max-h-full rounded-md"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

const SourcesList = ({
  sources,
}: {
  sources: Array<{ title?: string; url?: string; text?: string }>;
}) => {
  if (!sources.length) return null;
  return (
    <div className="mt-4 border border-border/60 rounded-2xl p-3 bg-background/70">
      <p className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1 mb-2">
        <LinkIcon className="h-3.5 w-3.5 text-primary" />
        Zdroje odpovědi
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((source, idx) => (
          <a
            key={`${source.url ?? source.title ?? idx}-${idx}`}
            href={source.url || "#"}
            target={source.url ? "_blank" : undefined}
            rel="noreferrer"
            className="flex items-start gap-2 rounded-xl border border-border/40 px-3 py-2 text-sm hover:bg-primary/5 transition"
          >
            <span className="text-xs font-semibold text-primary">{idx + 1}.</span>
            <span className="text-foreground">
              {source.title || source.text || source.url || "Zdroj"}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

const ChartInsight = ({ chart }: { chart: NonNullable<Message["chart"]> }) => {
  const rows =
    (chart.labels || []).map((label, idx) => {
      const value = Number(chart.data?.[idx] ?? 0);
      return {
        label,
        value: `${value.toLocaleString("cs-CZ")} Kč`,
      };
    }) || [];

  if (!rows.length) return null;

  return (
    <div className="mt-4 border border-primary/20 rounded-2xl bg-primary/5 p-4 space-y-2">
      <p className="text-sm font-semibold text-primary flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        {chart.title || "Shrnutí nákladů"}
      </p>
      <ul className="text-sm text-muted-foreground space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex justify-between">
            <span>{row.label}</span>
            <span className="text-foreground font-semibold">{row.value}</span>
          </li>
        ))}
      </ul>
      {chart.meta?.consumption_mwh && (
        <p className="text-xs text-muted-foreground">
          Výpočet pro cca {chart.meta.consumption_mwh} MWh • sazba {chart.meta.sazba}
        </p>
      )}
    </div>
  );
};
