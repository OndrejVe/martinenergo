import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, insertChatMessageSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import {
  calculateSpotPrice,
  calculateMonthlyBreakdown,
  compareFixedVsSpot,
  type CalculationInput,
  type CalculationResult,
  type ComparisonResult
} from "./calculation-engine";
import { TDD_CODES, TDD_METADATA } from "./mock-data";
import * as ragService from "./rag-service";
import * as aiService from "./ai-service";
import * as ttsService from "./tts-service";
import { setupAuth, isAuthenticated } from "./replitAuth";

// SPAM PROTECTION: Rate limiting store
// Tracks submissions per IP/sessionId to prevent abuse
const submissionTracker = new Map<string, { count: number; lastSubmit: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 3; // Max 3 submissions per minute per IP/session

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = submissionTracker.get(identifier);

  if (!record) {
    submissionTracker.set(identifier, { count: 1, lastSubmit: now });
    return true;
  }

  // Reset if window expired
  if (now - record.lastSubmit > RATE_LIMIT_WINDOW) {
    submissionTracker.set(identifier, { count: 1, lastSubmit: now });
    return true;
  }

  // Check if under limit
  if (record.count < MAX_SUBMISSIONS_PER_WINDOW) {
    record.count++;
    record.lastSubmit = now;
    return true;
  }

  return false; // Rate limit exceeded
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(submissionTracker.entries());
  for (const [key, record] of entries) {
    if (now - record.lastSubmit > RATE_LIMIT_WINDOW * 5) {
      submissionTracker.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // REPLIT AUTH SETUP (MUST BE FIRST)
  // ============================================
  await setupAuth(app);

  // ============================================
  // AUTH ENDPOINTS
  // ============================================
  
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================
  
  // POST /api/contacts - Create new contact (lead) with spam protection
  app.post("/api/contacts", async (req, res) => {
    try {
      // SPAM PROTECTION: Rate limiting
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const identifier = `contact_${clientIp}`;
      
      if (!checkRateLimit(identifier)) {
        return res.status(429).json({
          success: false,
          error: "Příliš mnoho požadavků. Zkuste to prosím později.",
          retryAfter: 60, // seconds
        });
      }

      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      
      res.status(201).json({
        success: true,
        data: contact,
        message: "Kontakt byl úspěšně vytvořen",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná data",
          details: error.errors,
        });
      }
      
      console.error("Error creating contact:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se vytvořit kontakt",
      });
    }
  });

  // GET /api/contacts - Get all contacts (for future admin panel)
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getAllContacts();
      res.json({
        success: true,
        data: contacts,
        count: contacts.length,
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst kontakty",
      });
    }
  });

  // GET /api/contacts/:id - Get contact by ID
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contact = await storage.getContactById(req.params.id);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: "Kontakt nenalezen",
        });
      }
      
      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst kontakt",
      });
    }
  });

  // POST /api/messages - Create chat message
  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(validatedData);
      
      res.status(201).json({
        success: true,
        data: message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná data",
          details: error.errors,
        });
      }
      
      console.error("Error creating message:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se uložit zprávu",
      });
    }
  });

  // GET /api/messages/:sessionId - Get chat messages by session
  app.get("/api/messages/:sessionId", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesBySession(req.params.sessionId);
      res.json({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst zprávy",
      });
    }
  });

  // GET /api/messages - Get recent chat messages
  app.get("/api/messages", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const messages = await storage.getRecentChatMessages(limit);
      res.json({
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst zprávy",
      });
    }
  });

  // POST /api/chat - Proxy endpoint for user's AI API
  // This endpoint will forward requests to the user's AI service
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || !sessionId) {
        return res.status(400).json({
          success: false,
          error: "Message and sessionId are required",
        });
      }

      // TODO: Replace with actual integration to user's AI API
      // This is a placeholder that returns a mock response
      // Example:
      // const response = await fetch(process.env.AI_API_URL, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message, sessionId })
      // });
      // const data = await response.json();
      
      // MOCK: Detekce trigger slov pro lead collection
      const triggerWords = [
        "kolik ušetřím", "kolik můžu ušetřit", "výpočet úspor", "kalkulace",
        "chci nabídku", "chci vědět více", "zajímá mě", "kontakt",
        "firma", "business", "firemní", "kancelář"
      ];
      
      const lowerMessage = message.toLowerCase();
      const shouldAskForLead = triggerWords.some(word => lowerMessage.includes(word));

      // Mock response
      const responseData = shouldAskForLead ? {
        content: "Skvělé! Pro přesný výpočet úspor a personalizovanou nabídku potřebuji pár základních údajů. Můžete vyplnit krátký formulář?",
        showLeadForm: true,
        leadFormContext: "Pro přesný výpočet úspor podle vašeho TDD profilu a roční spotřeby:",
        hasImage: false,
        hasLink: false,
      } : {
        content: "Děkuji za váš dotaz. Toto je placeholder odpověď. Po připojení k vašemu AI API zde bude skutečná odpověď od Martina.\n\nPokud chcete výpočet úspor, zeptejte se například: 'Kolik můžu ušetřit?'",
        hasImage: false,
        hasLink: false,
      };

      // Save assistant response to database
      await storage.createChatMessage({
        sessionId,
        role: "assistant",
        content: responseData.content,
        hasImage: responseData.hasImage ? 1 : 0,
        hasLink: responseData.hasLink ? 1 : 0,
      });

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Chyba při komunikaci s AI",
      });
    }
  });

  // ============================================
  // HEYGEN STREAMING AVATAR API (SDK)
  // ============================================

  // GET /api/avatar/list - List available HeyGen avatars
  app.get("/api/avatar/list", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      console.log("[HeyGen] Fetching available avatars...");

      const response = await fetch("https://api.heygen.com/v2/avatars", {
        method: "GET",
        headers: {
          "x-api-key": heygenApiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[HeyGen] List avatars error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen API error: ${response.statusText}`,
        });
      }

      const data = await response.json();
      const allAvatars = data?.data?.avatars || [];
      console.log("[HeyGen] ✅ Available avatars count:", allAvatars.length);
      
      // Log first avatar to see structure
      if (allAvatars.length > 0) {
        console.log("[HeyGen] Sample avatar structure:", JSON.stringify(allAvatars[0], null, 2));
      }
      
      // Filter for streaming/interactive avatars
      const streamingAvatars = allAvatars.filter((a: any) => 
        a.avatar_type === "streaming" || 
        a.is_streaming === true ||
        a.avatar_id?.includes("_public") || // Public streaming avatars
        a.preview_video_url // Streaming avatars usually have preview
      );
      
      console.log("[HeyGen] 🎬 Streaming avatars:", streamingAvatars.length);
      
      // Log streaming avatar IDs
      const streamingIds = streamingAvatars.slice(0, 10).map((a: any) => a.avatar_id || a.avatar_name);
      console.log("[HeyGen] First 10 streaming IDs:", streamingIds);
      
      res.json({
        success: true,
        data: {
          total: allAvatars.length,
          streaming_count: streamingAvatars.length,
          all: allAvatars.slice(0, 20), // First 20 for preview
          streaming: streamingAvatars.slice(0, 20), // First 20 streaming
        },
      });
    } catch (error) {
      console.error("Error fetching avatars:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst seznam avatarů",
      });
    }
  });

  // GET /api/avatar/session - Create HeyGen session and return LiveKit credentials
  // This is secure - API key stays on server, browser only gets LiveKit access token
  app.get("/api/avatar/session", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      // FIXED: Always use confirmed working public avatar (Secret HEYGEN_AVATAR_ID was invalid)
      const avatarId = "Anna_public_3_20240108";
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      console.log("[HeyGen] Creating new session for LiveKit...");
      console.log("[HeyGen] Using Avatar ID:", avatarId);

      // Step 1: Create session (FIXED: use avatar_name and voice_id)
      const newResponse = await fetch("https://api.heygen.com/v1/streaming.new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify({
          quality: "high",
          avatar_name: avatarId,
          voice: {
            voice_id: "1bd001e7e50f421d891986aad5158bc8" // Czech female voice
          }
        }),
      });

      if (!newResponse.ok) {
        const errorBody = await newResponse.text();
        console.error("[HeyGen] API Error Response:", errorBody);
        throw new Error(`HeyGen API error: ${newResponse.status} - ${errorBody}`);
      }

      const newData = await newResponse.json();
      console.log("[HeyGen] ✅ Session created:", newData.data.session_id);

      // Return SDP + ICE servers for WebRTC (NOT LiveKit!)
      // Frontend will create answer and call streaming.start
      res.json({
        success: true,
        data: {
          sessionId: newData.data.session_id,
          sdp: newData.data.sdp, // SDP offer from HeyGen
          iceServers: newData.data.ice_servers2 || newData.data.ice_servers || [],
        }
      });
    } catch (error: any) {
      console.error("[HeyGen] Session creation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Nepodařilo se vytvořit session",
      });
    }
  });

  // POST /api/avatar/new - Create new HeyGen streaming session
  app.post("/api/avatar/new", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      const { avatarId, quality = "high", voice } = req.body;

      // Get Avatar ID from environment (user's HeyGen Interactive Avatar)
      const defaultAvatarId = avatarId || process.env.HEYGEN_AVATAR_ID || "Dexter_Lawyer_Sitting_public";

      const response = await fetch("https://api.heygen.com/v1/streaming.new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify({
          version: "v2",
          avatar_id: defaultAvatarId,
          quality,
          voice: voice || {
            rate: 1.0,
            emotion: "FRIENDLY",
          },
          language: "cs", // Czech language
          activity_idle_timeout: 600, // 10 minutes
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HeyGen API error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen API error: ${response.statusText}`,
        });
      }

      const heygenData = await response.json();
      
      // Return HeyGen response directly to client (includes sdp, ice_servers, etc.)
      // Client expects: { success: true, data: { data: {...} } }
      res.json({
        success: true,
        data: heygenData, // This contains { data: { session_id, sdp, ice_servers, ... } }
      });
    } catch (error) {
      console.error("Error creating HeyGen session:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se vytvořit session s avatarem",
      });
    }
  });

  // POST /api/avatar/start - Start HeyGen session and get SDP offer
  // This is called BEFORE creating the peer connection answer
  app.post("/api/avatar/start", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      const { sessionId, sdp } = req.body;

      if (!sessionId || !sdp) {
        return res.status(400).json({
          success: false,
          error: "Session ID a SDP jsou povinné",
        });
      }

      console.log("[HeyGen] Starting session WITH local SDP answer...");

      // Call HeyGen start WITH local SDP answer (WebRTC flow)
      const response = await fetch("https://api.heygen.com/v1/streaming.start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          sdp, // Local SDP answer from RTCPeerConnection
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[HeyGen] Start API error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen start API error: ${errorText}`,
        });
      }

      const data = await response.json();
      console.log("[HeyGen] /v1/streaming.start response:", JSON.stringify(data));
      console.log("[HeyGen] Session started successfully:", sessionId);
      console.log("[HeyGen] SDP present:", !!data?.data?.sdp, "SDP type:", typeof data?.data?.sdp);
      
      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      console.error("[HeyGen] Error starting session:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to start avatar session",
      });
    }
  });

  // POST /api/avatar/speak - Send text to avatar for TTS
  app.post("/api/avatar/speak", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      const { sessionId, text, taskType = "repeat" } = req.body;

      if (!sessionId || !text) {
        return res.status(400).json({
          success: false,
          error: "Session ID a text jsou povinné",
        });
      }

      console.log("[HeyGen TTS] Sending task:", { sessionId, text: text.substring(0, 50) + "...", taskType });

      const response = await fetch("https://api.heygen.com/v1/streaming.task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          text,
          task_type: taskType, // repeat or talk
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HeyGen speak API error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen API error: ${response.statusText}`,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error sending text to avatar:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se poslat text avatarovi",
      });
    }
  });

  // POST /api/avatar/ice - Handle ICE candidates AND SDP answer for WebRTC connection
  app.post("/api/avatar/ice", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      const { sessionId, candidate, sdp } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID je povinné",
        });
      }

      if (!candidate && !sdp) {
        return res.status(400).json({
          success: false,
          error: "Candidate nebo SDP je povinné",
        });
      }

      console.log("[HeyGen] Sending to /v1/streaming.ice:", { 
        hasCandidate: !!candidate, 
        hasSdp: !!sdp 
      });

      const payload: any = { session_id: sessionId };
      if (candidate) payload.candidate = candidate;
      if (sdp) payload.sdp = sdp;

      const response = await fetch("https://api.heygen.com/v1/streaming.ice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HeyGen ICE API error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen API error: ${response.statusText}`,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error sending ICE candidate:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se poslat ICE candidate",
      });
    }
  });

  // POST /api/avatar/stop - Stop HeyGen streaming session
  app.post("/api/avatar/stop", async (req, res) => {
    try {
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      
      if (!heygenApiKey) {
        return res.status(500).json({
          success: false,
          error: "HeyGen API key není nastaven",
        });
      }

      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: "Session ID je povinné",
        });
      }

      const response = await fetch("https://api.heygen.com/v1/streaming.stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": heygenApiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("HeyGen stop API error:", errorText);
        return res.status(response.status).json({
          success: false,
          error: `HeyGen API error: ${response.statusText}`,
        });
      }

      const data = await response.json();
      
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error stopping avatar session:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se ukončit session",
      });
    }
  });

  // ============================================
  // KALKULACE SPOTOVÝCH CEN
  // ============================================

  // GET /api/tdd - Získat dostupné TDD sazby
  app.get("/api/tdd", (req, res) => {
    const tddList = TDD_CODES.map(code => ({
      code,
      ...TDD_METADATA[code]
    }));
    
    res.json({
      success: true,
      data: tddList
    });
  });

  // POST /api/calculate - Vypočítat spotovou cenu
  app.post("/api/calculate", async (req, res) => {
    try {
      const schema = z.object({
        tddCode: z.enum(TDD_CODES),
        yearlyConsumption: z.number().positive(),
        year: z.number().int().min(2022).max(2025),
        exchangeRate: z.number().positive().optional(),
        includeMonthly: z.boolean().optional(),
        fixedPrice: z.number().positive().optional() // Pro porovnání
      });

      const input = schema.parse(req.body);
      
      // Základní výpočet
      const result: CalculationResult = calculateSpotPrice({
        tddCode: input.tddCode,
        yearlyConsumption: input.yearlyConsumption,
        year: input.year,
        exchangeRate: input.exchangeRate
      });
      
      // Měsíční breakdown (pokud požadováno)
      let monthlyBreakdown = null;
      if (input.includeMonthly) {
        monthlyBreakdown = calculateMonthlyBreakdown({
          tddCode: input.tddCode,
          yearlyConsumption: input.yearlyConsumption,
          year: input.year,
          exchangeRate: input.exchangeRate
        });
      }
      
      // Porovnání s fixní cenou (pokud zadáno)
      let comparison: ComparisonResult | null = null;
      if (input.fixedPrice) {
        comparison = compareFixedVsSpot(
          {
            tddCode: input.tddCode,
            yearlyConsumption: input.yearlyConsumption,
            year: input.year,
            exchangeRate: input.exchangeRate
          },
          input.fixedPrice
        );
      }
      
      res.json({
        success: true,
        data: {
          result,
          monthlyBreakdown,
          comparison
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná vstupní data",
          details: error.errors
        });
      }
      
      console.error("Error calculating spot price:", error);
      res.status(500).json({
        success: false,
        error: "Chyba při výpočtu spotové ceny"
      });
    }
  });

  // ========================================
  // AI & RAG API ENDPOINTS
  // ========================================

  // POST /api/ai/chat - AI Chat s RAG semantic search + LLM
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const schema = z.object({
        message: z.string().min(1),
        sessionId: z.string(),
        language: z.enum(["cs", "sk"]).default("cs"),
      });

      const { message, sessionId, language } = schema.parse(req.body);

      // 1. Semantic search přes znalostní bázi
      const relevantChunks = await ragService.searchKnowledge(message, language, 3);
      
      // 2. Vygenerovat AI odpověď s RAG kontextem a function calling
      const aiResponse = await aiService.generateAIResponse(message, relevantChunks, language);

      res.json({
        success: true,
        data: {
          response: aiResponse.content,
          showLeadForm: aiResponse.showLeadForm,
          calculationResult: aiResponse.calculationResult,
          context: relevantChunks,
          hasContext: relevantChunks.length > 0,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná vstupní data",
          details: error.errors,
        });
      }

      console.error("Error in AI chat:", error);
      res.status(500).json({
        success: false,
        error: "Chyba při zpracování dotazu",
      });
    }
  });

  // POST /api/tts - Text-to-Speech pomocí OpenAI
  app.post("/api/tts", async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1).max(4096), // OpenAI TTS limit
        voice: z.enum(["alloy", "echo", "fable", "nova", "shimmer", "onyx"]).default("nova"),
        speed: z.number().min(0.25).max(4.0).default(1.0),
      });

      const { text, voice, speed } = schema.parse(req.body);

      // Generovat audio stream
      const audioStream = await ttsService.generateSpeechStream(text, voice, speed);

      // Nastavit headers pro audio stream
      res.set({
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      });

      // @ts-ignore - stream pipe
      audioStream.pipe(res);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná vstupní data",
          details: error.errors,
        });
      }

      console.error("Error in TTS:", error);
      res.status(500).json({
        success: false,
        error: "Chyba při generování řeči",
      });
    }
  });

  // ========================================
  // ADMIN API - Knowledge Base Management
  // ========================================

  // Middleware: Admin autentizace (basic protection)
  // Admin middleware - requires Replit Auth login
  // For production: add role check or whitelist specific user IDs
  const requireAdmin = isAuthenticated;

  // POST /api/admin/knowledge/init - Inicializace znalostní báze
  app.post("/api/admin/knowledge/init", requireAdmin, async (req, res) => {
    try {
      await ragService.initializeKnowledgeBase();
      res.json({
        success: true,
        message: "Znalostní báze úspěšně inicializována",
      });
    } catch (error) {
      console.error("Error initializing knowledge base:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se inicializovat znalostní bázi",
      });
    }
  });

  // POST /api/admin/documents - Přidat dokument
  app.post("/api/admin/documents", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      
      const document = await ragService.addDocument(
        validatedData.title,
        validatedData.content,
        validatedData.category,
        validatedData.language as "cs" | "sk",
        validatedData.metadata as Record<string, any> | undefined
      );

      res.status(201).json({
        success: true,
        data: document,
        message: "Dokument úspěšně přidán",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Neplatná data",
          details: error.errors,
        });
      }

      console.error("Error adding document:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se přidat dokument",
      });
    }
  });

  // GET /api/admin/documents - Seznam dokumentů
  app.get("/api/admin/documents", requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const language = (req.query.language as "cs" | "sk") || "cs";

      const documents = category
        ? await ragService.getDocumentsByCategory(category, language)
        : await ragService.getDocumentsByCategory("electricity", language); // Default

      res.json({
        success: true,
        data: documents,
        count: documents.length,
      });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst dokumenty",
      });
    }
  });

  // PUT /api/admin/documents/:id - Aktualizovat dokument
  app.put("/api/admin/documents/:id", requireAdmin, async (req, res) => {
    try {
      const documentId = req.params.id;
      const updates = req.body;

      const updated = await ragService.updateDocument(documentId, updates);

      res.json({
        success: true,
        data: updated,
        message: "Dokument úspěšně aktualizován",
      });
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se aktualizovat dokument",
      });
    }
  });

  // DELETE /api/admin/documents/:id - Smazat dokument
  app.delete("/api/admin/documents/:id", requireAdmin, async (req, res) => {
    try {
      const documentId = req.params.id;
      await ragService.deleteDocument(documentId);

      res.json({
        success: true,
        message: "Dokument úspěšně smazán",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se smazat dokument",
      });
    }
  });

  // ============================================
  // ADMIN ENDPOINTS - LEADS & CONVERSATIONS
  // ============================================
  
  // GET /api/admin/leads - Get all leads (contacts)
  app.get("/api/admin/leads", requireAdmin, async (req, res) => {
    try {
      const leads = await storage.getAllContacts();
      res.json({
        success: true,
        data: leads,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst leady",
      });
    }
  });

  // GET /api/admin/conversations - Get all unique conversations with metadata
  app.get("/api/admin/conversations", requireAdmin, async (req, res) => {
    try {
      const allMessages = await storage.getRecentChatMessages(1000);
      
      // Group by sessionId
      const conversationMap = new Map<string, any>();
      
      allMessages.forEach(msg => {
        if (!conversationMap.has(msg.sessionId)) {
          conversationMap.set(msg.sessionId, {
            sessionId: msg.sessionId,
            messageCount: 0,
            firstMessage: msg.createdAt,
            lastMessage: msg.createdAt,
            messages: [],
          });
        }
        
        const conv = conversationMap.get(msg.sessionId)!;
        conv.messageCount++;
        conv.messages.push(msg);
        if (msg.createdAt > conv.lastMessage) {
          conv.lastMessage = msg.createdAt;
        }
        if (msg.createdAt < conv.firstMessage) {
          conv.firstMessage = msg.createdAt;
        }
      });
      
      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
      
      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst konverzace",
      });
    }
  });

  // GET /api/admin/conversations/:sessionId - Get specific conversation messages
  app.get("/api/admin/conversations/:sessionId", requireAdmin, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessagesBySession(sessionId);
      
      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({
        success: false,
        error: "Nepodařilo se načíst konverzaci",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
