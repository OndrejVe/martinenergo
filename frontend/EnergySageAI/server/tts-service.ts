/**
 * TTS Service - OpenAI Text-to-Speech
 * 
 * Generuje audio z textu pomocí OpenAI TTS API
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type TTSVoice = "alloy" | "echo" | "fable" | "nova" | "shimmer" | "onyx";

/**
 * Vygeneruje audio z textu pomocí OpenAI TTS
 */
export async function generateSpeech(
  text: string,
  voice: TTSVoice = "nova", // Nova = female, Onyx = male
  speed: number = 1.0
): Promise<Buffer> {
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // tts-1 je rychlejší, tts-1-hd je kvalitnější
      voice: voice,
      input: text,
      speed: speed,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
    
  } catch (error) {
    console.error("[TTS] OpenAI TTS error:", error);
    throw new Error("Failed to generate speech");
  }
}

/**
 * Streamuje audio z textu (pro real-time playback)
 */
export async function generateSpeechStream(
  text: string,
  voice: TTSVoice = "nova",
  speed: number = 1.0
): Promise<NodeJS.ReadableStream> {
  try {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
      speed: speed,
      response_format: "mp3",
    });

    // @ts-ignore - OpenAI SDK returns a Response with body
    return response.body as NodeJS.ReadableStream;
    
  } catch (error) {
    console.error("[TTS] OpenAI TTS stream error:", error);
    throw new Error("Failed to generate speech stream");
  }
}
