import { drizzle } from "drizzle-orm/d1";
import { contacts, insertContactSchema } from "../../shared/schema";
import type { Env, ApiResponse } from "../_types";
import { jsonResponse, handleCORS } from "../_types";

// POST /api/contacts - Save contact form submission
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json();
    
    // Validate input
    const validation = insertContactSchema.safeParse(body);
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
    const result = await db.insert(contacts).values({
      id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      language: data.language,
      gdprConsent: data.gdprConsent,
    }).returning();

    return jsonResponse<typeof result[0]>({
      success: true,
      data: result[0],
    }, 201);

  } catch (error) {
    console.error("Error saving contact:", error);
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
