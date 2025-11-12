import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface VideoAvatarProps {
  isActive: boolean;
  onSessionCreated?: (sessionId: string) => void;
  onSessionReady?: () => void;
  onError?: (error: Error) => void;
}

export function VideoAvatar({ 
  isActive, 
  onSessionCreated, 
  onSessionReady,
  onError 
}: VideoAvatarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Začněte konverzaci s Martinem");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isConnectingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const callbacksCalledRef = useRef<{ created: boolean; ready: boolean }>({ created: false, ready: false });

  console.log("[VideoAvatar] Component rendered with isActive:", isActive);

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
  };

  useEffect(() => {
    console.log("[VideoAvatar] useEffect triggered with isActive:", isActive);
    mountedRef.current = true;
    
    if (!isActive) {
      console.log("[VideoAvatar] Not active, skipping connection");
      return;
    }

    const initializeAvatar = async () => {
      // Prevent duplicate connections (React StrictMode workaround)
      if (isConnectingRef.current) {
        console.log("[VideoAvatar] Already connecting, skipping duplicate call");
        return;
      }

      try {
        isConnectingRef.current = true;
        setIsLoading(true);
        updateStatus("Připojuji se k Martinovi...");
        console.log("[VideoAvatar] Step 1: Creating HeyGen session...");

        // Get SDP offer + ICE servers from backend
        const sessionResponse = await fetch("/api/avatar/session");
        if (!sessionResponse.ok) {
          throw new Error("Failed to create session");
        }
        
        const { success, data } = await sessionResponse.json();
        if (!success || !data) {
          throw new Error("Invalid session response");
        }

        if (!mountedRef.current) return;

        const { sessionId, sdp, iceServers } = data;
        console.log("[VideoAvatar] ✅ Got session data:", { sessionId, hasSDP: !!sdp, iceCount: iceServers?.length });
        sessionIdRef.current = sessionId;
        
        // Only call callback once
        if (!callbacksCalledRef.current.created) {
          callbacksCalledRef.current.created = true;
          onSessionCreated?.(sessionId);
        }

        // Normalize ICE servers
        const normalizedIceServers = (iceServers || []).map((server: any) => {
          if (typeof server === "string") {
            return { urls: server };
          }
          return {
            urls: server.urls,
            username: server.username,
            credential: server.credential,
          };
        });

        // Create RTCPeerConnection
        console.log("[VideoAvatar] Step 2: Creating RTCPeerConnection...");
        const pc = new RTCPeerConnection({
          iceServers: normalizedIceServers,
        });
        pcRef.current = pc;

        // Handle tracks (video/audio)
        pc.ontrack = (event) => {
          console.log("[VideoAvatar] 🎬 Track received:", event.track.kind);
          if (event.streams && event.streams[0] && videoRef.current) {
            videoRef.current.srcObject = event.streams[0];
            videoRef.current.play().catch((err) => {
              console.warn("[VideoAvatar] Autoplay failed:", err);
            });
            console.log("[VideoAvatar] ✅ Media attached to video element");
            if (mountedRef.current) {
              setIsConnected(true);
              updateStatus("Video připojeno!");
            }
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = ({ candidate }) => {
          if (candidate && sessionIdRef.current) {
            console.log("[VideoAvatar] Sending ICE candidate...");
            fetch("/api/avatar/ice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sessionIdRef.current,
                candidate: candidate.toJSON(),
              }),
            }).catch((err) => console.error("[VideoAvatar] ICE send error:", err));
          }
        };

        // Connection state monitoring
        pc.onconnectionstatechange = () => {
          console.log("[VideoAvatar] Connection state:", pc.connectionState);
          updateStatus(`Stav: ${pc.connectionState}`);
          
          if (pc.connectionState === "connected") {
            console.log("[VideoAvatar] 🎉 Connected!");
            if (!callbacksCalledRef.current.ready) {
              callbacksCalledRef.current.ready = true;
              onSessionReady?.();
            }
          }
        };

        // Set remote SDP offer
        console.log("[VideoAvatar] Step 3: Setting remote SDP offer...");
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        // Create local SDP answer
        console.log("[VideoAvatar] Step 4: Creating local SDP answer...");
        const localDesc = await pc.createAnswer();
        await pc.setLocalDescription(localDesc);

        // Send local SDP answer to start session
        console.log("[VideoAvatar] Step 5: Starting session with local SDP...");
        const startResponse = await fetch("/api/avatar/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            sdp: pc.localDescription,
          }),
        });

        if (!startResponse.ok) {
          throw new Error("Failed to start session");
        }

        console.log("[VideoAvatar] ✅ Session started! Waiting for video stream...");
        updateStatus("Čekám na video stream...");
        
        if (mountedRef.current) {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("[VideoAvatar] Error:", error);
        updateStatus("Chyba: " + error.message);
        onError?.(error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      } finally {
        isConnectingRef.current = false;
      }
    };

    initializeAvatar();

    // Cleanup
    return () => {
      mountedRef.current = false;
      console.log("[VideoAvatar] Cleanup triggered");
      
      // Only disconnect if NOT actively connecting (prevents React StrictMode double-mount issues)
      if (pcRef.current && !isConnectingRef.current) {
        console.log("[VideoAvatar] Closing peer connection...");
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [isActive, onSessionCreated, onSessionReady, onError]);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-2 border-primary/20 shadow-xl">
      {/* Video element - always in DOM */}
      <div className="relative aspect-video bg-gradient-to-br from-background/80 to-muted/50 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className={`w-full h-full transition-opacity duration-500 ${
            isConnected ? "opacity-100" : "opacity-0"
          }`}
          style={{
            objectFit: "contain",
          }}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        )}

        {/* Status when not active */}
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center avatar-glow">
                <span className="text-4xl">🤖</span>
              </div>
              <p className="text-lg font-medium gradient-text-animated">{status}</p>
            </div>
          </div>
        )}
      </div>

      {/* Animated border glow effect */}
      <div className="absolute inset-0 rounded-lg border-animated pointer-events-none"></div>
    </Card>
  );
}

// Export helper function for ChatInterface to send TTS via REST API
export async function sendTextToAvatar(sessionId: string, text: string): Promise<void> {
  console.log("[sendTextToAvatar] Sending TTS via REST API:", text.substring(0, 50) + "...");
  
  try {
    const response = await fetch("/api/avatar/speak", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
        text,
        taskType: "repeat", // repeat = say exact text, talk = process through LLM
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "TTS failed");
    }

    const data = await response.json();
    console.log("[sendTextToAvatar] ✅ TTS task created:", data);
  } catch (error) {
    console.error("[sendTextToAvatar] ❌ TTS error:", error);
    throw error;
  }
}
