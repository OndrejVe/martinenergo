import { drizzle } from "drizzle-orm/d1";
import { chatMessages } from "../../shared/schema";
import type { Env, ApiResponse } from "../_types";
import { jsonResponse, handleCORS } from "../_types";

// POST /api/chat - Proxy to external AI API
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== "string") {
      return jsonResponse<null>({
        success: false,
        error: "Message is required",
      }, 400);
    }

    if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
      return jsonResponse<null>({
        success: false,
        error: "sessionId is required",
      }, 400);
    }

    // Get AI API configuration from environment
    const aiApiUrl = context.env.AI_API_URL;
    const aiApiKey = context.env.AI_API_KEY;

    if (!aiApiUrl) {
      return jsonResponse<null>({
        success: false,
        error: "AI API not configured",
        details: "AI_API_URL environment variable is not set. Please configure your AI API endpoint.",
      }, 503);
    }

    // Proxy request to external AI API
    const aiResponse = await fetch(aiApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(aiApiKey ? { "Authorization": `Bearer ${aiApiKey}` } : {}),
      },
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status, aiResponse.statusText);
      return jsonResponse<null>({
        success: false,
        error: "AI API request failed",
        details: `Status: ${aiResponse.status}`,
      }, 502);
    }

    // Parse AI response
    const aiData = await aiResponse.json();

    // Expected format from AI API:
    // {
    //   content: string,
    //   image?: string,
    //   link?: { url: string, title: string }
    // }

    const assistantResponse = {
      content: aiData.content || aiData.message || "Omlouvám se, nedostal jsem odpověď.",
      image: aiData.image,
      link: aiData.link,
    };

    // Persist assistant message to database
    try {
      const db = drizzle(context.env.DB);
      
      await db.insert(chatMessages).values({
        id: crypto.randomUUID(),
        sessionId: sessionId,
        role: "assistant",
        content: assistantResponse.content,
        hasImage: assistantResponse.image ? 1 : 0,
        hasLink: assistantResponse.link ? 1 : 0,
      });
    } catch (dbError) {
      console.error("Error persisting assistant message:", dbError);
      // Don't fail the request if DB save fails
    }

    return jsonResponse({
      success: true,
      data: assistantResponse,
    });

  } catch (error) {
    console.error("Error in chat proxy:", error);
    return jsonResponse<null>({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
};

// Handle OPTIONS (CORS preflight)
export const onRequestOptions: PagesFunction = async () => {
  return handleCORS();
};
