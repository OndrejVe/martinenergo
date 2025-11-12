import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface AudioAvatarProps {
  isActive: boolean;
  isSpeaking: boolean;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function AudioAvatar({ isActive, isSpeaking, onSpeakingChange }: AudioAvatarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Pozadí s animovaným gradientem */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 gradient-flow" />
      </div>

      {/* Hlavní avatar - animovaná koule */}
      <motion.div
        className="relative z-10"
        animate={{
          scale: isSpeaking ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isSpeaking ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Vnější pulsující kruh */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-2xl"
          animate={{
            scale: isSpeaking ? [1, 1.3, 1] : 1,
            opacity: isSpeaking ? [0.3, 0.6, 0.3] : 0.2,
          }}
          transition={{
            duration: 2,
            repeat: isSpeaking ? Infinity : 0,
            ease: "easeInOut",
          }}
        />

        {/* Střední avatar koule */}
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-primary via-secondary to-accent p-1 avatar-glow">
          {/* Vnitřní obsah */}
          <div className="w-full h-full rounded-full bg-background/95 backdrop-blur-lg flex items-center justify-center overflow-hidden">
            {/* AI Symbol */}
            <motion.div
              className="relative z-10"
              animate={{
                rotate: isSpeaking ? 360 : 0,
              }}
              transition={{
                duration: 20,
                repeat: isSpeaking ? Infinity : 0,
                ease: "linear",
              }}
            >
              <svg
                className="w-32 h-32 md:w-40 md:h-40"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Elektrický symbol - zjednodušený AI brain */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient1)"
                  strokeWidth="2"
                  className={isSpeaking ? "animate-pulse" : ""}
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  stroke="url(#gradient2)"
                  strokeWidth="2"
                  className={isSpeaking ? "animate-pulse" : ""}
                />
                <path
                  d="M35 50 L50 35 L45 50 L65 50 L50 65 L55 50 Z"
                  fill="url(#gradient3)"
                  className={isSpeaking ? "animate-pulse" : ""}
                />
                
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" />
                  </linearGradient>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="50%" stopColor="hsl(var(--accent))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Sound waves když mluví */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 bg-primary rounded-full"
                    style={{ left: `${30 + i * 10}%` }}
                    animate={{
                      height: ["20%", "60%", "20%"],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Audio player (skrytý) */}
      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => onSpeakingChange?.(false)}
        onPlay={() => onSpeakingChange?.(true)}
        onPause={() => onSpeakingChange?.(false)}
      />

      {/* Mute button */}
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 z-20"
        onClick={() => setIsMuted(!isMuted)}
        data-testid="button-mute-avatar"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      {/* Status indicator */}
      {isActive && (
        <motion.div
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-primary/20"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: isSpeaking ? [1, 1.3, 1] : 1,
              opacity: isSpeaking ? [0.5, 1, 0.5] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />
          <span className="text-xs font-medium">
            {isSpeaking ? "Martin mluví..." : "Martin je online"}
          </span>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Hook pro přehrávání TTS audio
 */
export function useAvatarTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = async (text: string, voice: string = "nova") => {
    try {
      // Zastavit předchozí audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      setIsSpeaking(true);

      // Fetch TTS audio z backendu
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice, speed: 1.0 }),
      });

      if (!response.ok) {
        throw new Error("TTS request failed");
      }

      // Získat audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Vytvořit a přehrát audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

    } catch (error) {
      console.error("[TTS] Error:", error);
      setIsSpeaking(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsSpeaking(false);
  };

  return { speak, stop, isSpeaking };
}
