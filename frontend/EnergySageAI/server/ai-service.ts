/**
 * AI Service - OpenAI Chat Completions s Function Calling
 * 
 * Poskytuje inteligentní odpovědi s možností volat TDD calculator
 */

import OpenAI from "openai";
import { calculateSpotPrice, type CalculationInput, type CalculationResult } from "./calculation-engine";
import type { TddCode } from "./mock-data";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Function definitions pro OpenAI function calling
 */
const functions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculate_tdd_savings",
      description: "Vypočítá spotové ceny a úspory podle TDD profilu uživatele. Použij když se uživatel ptá na výpočet úspor, ceny nebo má konkrétní spotřebu.",
      parameters: {
        type: "object",
        properties: {
          tddCode: {
            type: "string",
            enum: ["C01d", "C02d", "C03d", "C11d", "C12d", "C13d", "C21d", "C22d", "C23d", "C31d", "C32d", "C33d"],
            description: "TDD profil uživatele (C01d-C03d pro domácnosti, C11d-C33d pro firmy)"
          },
          yearlyConsumption: {
            type: "number",
            description: "Roční spotřeba v kWh"
          },
          year: {
            type: "number",
            enum: [2023, 2024],
            description: "Rok pro výpočet (2023 nebo 2024)"
          },
          exchangeRate: {
            type: "number",
            description: "EUR→CZK kurz (volitelné, default 25)",
            default: 25
          }
        },
        required: ["tddCode", "yearlyConsumption", "year"]
      }
    }
  }
];

/**
 * Response metadata pro AI odpověď
 */
export interface AIResponseMetadata {
  content: string;
  showLeadForm: boolean;
  calculationResult?: CalculationResult;
}

/**
 * Zpracuje function call - zavolá TDD calculator
 */
function handleFunctionCall(
  functionName: string,
  functionArgs: string
): { response: string; calculationResult?: CalculationResult } {
  if (functionName === "calculate_tdd_savings") {
    const args = JSON.parse(functionArgs) as CalculationInput;
    const result = calculateSpotPrice(args);
    
    // Formátovat výsledek pro LLM
    const llmResponse = JSON.stringify({
      success: true,
      data: {
        averagePricePerKWh: result.averagePricePerKWh,
        totalCostPerYear: result.totalCostPerYear,
        tddCode: result.input.tddCode,
        yearlyConsumption: result.input.yearlyConsumption,
        year: result.input.year
      }
    });
    
    return { response: llmResponse, calculationResult: result };
  }
  
  return { response: JSON.stringify({ error: "Unknown function" }) };
}

/**
 * Vygeneruje AI odpověď s RAG kontextem a function calling
 */
export async function generateAIResponse(
  userMessage: string,
  ragContext: Array<{ chunkText: string; documentTitle: string; similarity: number }>,
  language: "cs" | "sk" = "cs"
): Promise<AIResponseMetadata> {
  try {
    // Sestavit system prompt s RAG kontextem
    const contextText = ragContext.length > 0
      ? ragContext.map(chunk => `[${chunk.documentTitle}]: ${chunk.chunkText}`).join("\n\n")
      : "Žádný relevantní kontext nenalezen.";
    
    const systemPrompt = language === "cs" 
      ? `Jsi Martin, energetický poradce pro spotové ceny elektřiny a TDD tarify v České republice.

ZNALOSTNÍ BÁZE:
${contextText}

POKYNY:
- Odpovídej VELMI STRUČNĚ (max 3-4 věty, 50-80 slov)! Avatar musí text přečíst nahlas.
- Jdi rovnou k věci, bez dlouhých úvodů
- Použij informace ze znalostní báze
- Pokud uživatel chce výpočet úspor, zavolej funkci calculate_tdd_savings
- Vysvětluj TDD profily (C01d-C03d domácnosti, C11d-C33d firmy)
- Při výpočtech zobraz výsledky jako VELKÉ ČÍSELNÉ HODNOTY, ne grafy
- Nezmiňuj "spotové ceny" v marketingových textech, mluvíme o "lepší ceně" nebo "úsporách"`
      : `Si Martin, energetický poradca pre spotové ceny elektriny a TDD tarify na Slovensku.

ZNALOSTNÁ BÁZA:
${contextText}

POKYNY:
- Odpovedaj VEĽMI STRUČNE (max 3-4 vety, 50-80 slov)! Avatar musí text prečítať nahlas.
- Choď rovno k veci, bez dlhých úvodov
- Použij informácie zo znalostnej bázy
- Ak užívateľ chce výpočet úspor, zavolaj funkciu calculate_tdd_savings
- Vysvetľuj TDD profily (C01d-C03d domácnosti, C11d-C33d firmy)
- Pri výpočtoch zobraz výsledky ako VEĽKÉ ČÍSELNÉ HODNOTY, nie grafy
- Nespomínaj "spotové ceny" v marketingových textoch, hovoríme o "lepšej cene" alebo "úsporách"`;

    // Prvý OpenAI call
    let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    let calculationResult: CalculationResult | undefined;

    let response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: functions,
      tool_choice: "auto",
      temperature: 0.7,
    });

    let responseMessage = response.choices[0].message;

    // Pokud AI chce zavolat funkci
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Přidat AI odpověď do historie
      messages.push(responseMessage);

      // Zpracovat všechny function calls
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = toolCall.function.arguments;
        
        console.log(`[AI] Function call: ${functionName}(${functionArgs})`);
        
        const functionCallResult = handleFunctionCall(functionName, functionArgs);
        
        // Uložit calculation result pro metadata
        if (functionCallResult.calculationResult) {
          calculationResult = functionCallResult.calculationResult;
        }
        
        // Přidat function result do historie (jen string response)
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: functionCallResult.response,
        });
      }

      // Druhý OpenAI call s function results
      const secondResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
      });

      const content = secondResponse.choices[0].message.content || "Omlouvám se, nepodařilo se vygenerovat odpověď.";
      
      return {
        content,
        showLeadForm: !!calculationResult,
        calculationResult,
      };
    }

    // Žádný function call - vrátit přímou odpověď
    const content = responseMessage.content || "Omlouvám se, nepodařilo se vygenerovat odpověď.";
    
    return {
      content,
      showLeadForm: false,
    };

  } catch (error) {
    console.error("[AI] OpenAI API error:", error);
    throw new Error("Failed to generate AI response");
  }
}
