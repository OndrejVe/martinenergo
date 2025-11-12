import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { chatMessages, insertChatMessageSchema } from "../../shared/schema";
import type { Env, ApiResponse } from "../_types";
import { jsonResponse, handleCORS } from "../_types";

// POST /api/messages - Save chat message
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    
    // Validate input
    const validation = insertChatMessageSchema.safeParse(body);
    if (!validation.success) {
      return jsonResponse<null>({
        success: false,
        error: "Validation failed",
        details: validation.error.flatten(),
      }, 400);
    }

    const db = drizzle(context.env.DB);
    const data = validation.data;

    // Generate UUID for ID
    const id = crypto.randomUUID();

    // Insert into database
    const result = await db.insert(chatMessages).values({
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      hasImage: data.hasImage,
      hasLink: data.hasLink,
    }).returning();

    return jsonResponse<typeof result[0]>({
      success: true,
      data: result[0],
    }, 201);

  } catch (error) {
    console.error("Error saving message:", error);
    return jsonResponse<null>({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
};

// GET /api/messages?sessionId=xxx&limit=50 - Get chat history
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const sessionId = url.searchParams.get("sessionId");
    const limitParam = url.searchParams.get("limit") || "50";
    
    // Sanitize and clamp limit
    let limit = parseInt(limitParam);
    if (isNaN(limit) || limit < 1) {
      limit = 50;
    }
    if (limit > 500) {
      limit = 500; // Max limit to prevent excessive queries
    }

    if (!sessionId) {
      return jsonResponse<null>({
        success: false,
        error: "sessionId parameter is required",
      }, 400);
    }

    const db = drizzle(context.env.DB);

    // Query messages for session
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return jsonResponse({
      success: true,
      data: messages.reverse(), // Return in chronological order
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
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
