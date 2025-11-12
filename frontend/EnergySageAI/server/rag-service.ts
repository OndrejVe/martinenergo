/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Poskytuje semantic search přes znalostní bázi pomocí vector embeddings.
 * Používá OpenAI embeddings API pro deterministické vector embeddings.
 */

import { db } from "./db";
import { documents, embeddings, type Document, type Embedding } from "@shared/schema";
import { eq, sql, desc } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Vygeneruje embedding vector pomocí OpenAI API
 * Model: text-embedding-3-small (1536 dimensions, deterministický output)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.trim(),
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error("[RAG] OpenAI embedding error:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Rozdělí text na menší chunky pro embedding
 */
function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence.trim();
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Přidá dokument do znalostní báze a vygeneruje embeddings
 */
export async function addDocument(
  title: string,
  content: string,
  category: string,
  language: "cs" | "sk" = "cs",
  metadata?: Record<string, any>
): Promise<Document> {
  // 1. Uložit dokument
  const [document] = await db.insert(documents).values({
    title,
    content,
    category,
    language,
    metadata: metadata || null,
    isActive: 1,
  }).returning();

  // 2. Rozdělit na chunky
  const chunks = chunkText(content);

  // 3. Vygenerovat embeddings pro každý chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await generateEmbedding(chunk);
    
    await db.insert(embeddings).values({
      documentId: document.id,
      chunkText: chunk,
      chunkIndex: i,
      embedding: JSON.parse(JSON.stringify(embedding)), // Convert to array for pgvector
    });
  }

  console.log(`[RAG] Document added: ${title} (${chunks.length} chunks)`);
  return document;
}

/**
 * Fallback znalostní báze pro případ selhání databáze
 */
const FALLBACK_KNOWLEDGE = {
  cs: [
    {
      chunkText: "Spotové ceny elektřiny se mění každou hodinu podle aktuální poptávky a nabídky na burze. TDD tarify (časové rozdělení dne) využívají tyto spotové ceny k výpočtu vaší ceny za elektřinu. Když odebíráte elektřinu v levnějších hodinách, ušetříte více.",
      documentTitle: "Úvod do spotových cen",
      similarity: 0.95
    },
    {
      chunkText: "TDD kódy C01d-C03d jsou pro domácnosti: C01d = nízká spotřeba (do 2500 kWh/rok), C02d = střední spotřeba (2500-5000 kWh/rok), C03d = vysoká spotřeba (nad 5000 kWh/rok). Každý kód má jiné váhové koeficienty pro výpočet ceny.",
      documentTitle: "TDD profily pro domácnosti",
      similarity: 0.92
    },
    {
      chunkText: "TDD kódy C11d-C33d jsou pro firmy a živnostníky. První číslice určuje kategorii spotřeby (1=malá, 2=střední, 3=velká), druhá číslice určuje typ profilu (1=základní, 2=časově flexibilní, 3=optimalizovaný). Vyšší kategorie mají nižší váhové koeficienty ve špičkách.",
      documentTitle: "TDD profily pro firmy",
      similarity: 0.90
    },
    {
      chunkText: "Spotové ceny jsou nejlevnější v noci (0:00-6:00) a nejdražší ve špičce (17:00-20:00). Průměrně můžete ušetřit 20-40% oproti fixní ceně, pokud dokážete přesunout spotřebu mimo špičky. Ideální pro nabíjení elektromobilů, ohřev vody nebo praní.",
      documentTitle: "Kdy spotové ceny fungují nejlépe",
      similarity: 0.88
    },
    {
      chunkText: "Martin vám pomůže najít váš TDD kód na vyúčtování, spočítat potenciální úspory a nastavit chytré zařízení pro automatickou optimalizaci spotřeby. Stačí mi říct vaši roční spotřebu a já vám spočítám přesné úspory.",
      documentTitle: "Co umí Martin",
      similarity: 0.85
    }
  ],
  sk: [
    {
      chunkText: "Spotové ceny elektriny sa menia každú hodinu podľa aktuálneho dopytu a ponuky na burze. TDD tarify (časové rozdelenie dňa) využívajú tieto spotové ceny na výpočet vašej ceny za elektrinu. Keď odoberáte elektrinu v lacnejších hodinách, ušetríte viac.",
      documentTitle: "Úvod do spotových cien",
      similarity: 0.95
    },
    {
      chunkText: "TDD kódy C01d-C03d sú pre domácnosti: C01d = nízka spotreba (do 2500 kWh/rok), C02d = stredná spotreba (2500-5000 kWh/rok), C03d = vysoká spotreba (nad 5000 kWh/rok). Každý kód má iné váhové koeficienty pre výpočet ceny.",
      documentTitle: "TDD profily pre domácnosti",
      similarity: 0.92
    },
    {
      chunkText: "Spotové ceny sú najlacnejšie v noci (0:00-6:00) a najdrahšie v špičke (17:00-20:00). V priemere môžete ušetriť 20-40% oproti fixnej cene, ak dokážete presunúť spotrebu mimo špičiek. Ideálne pre nabíjanie elektromobilov, ohrev vody alebo pranie.",
      documentTitle: "Kedy spotové ceny fungujú najlepšie",
      similarity: 0.88
    }
  ]
};

/**
 * Semantic search - najde nejrelevantnější chunky pro dotaz
 */
export async function searchKnowledge(
  query: string,
  language: "cs" | "sk" = "cs",
  limit: number = 5
): Promise<Array<{ chunkText: string; documentTitle: string; similarity: number }>> {
  try {
    // 1. Vygenerovat embedding pro dotaz
    const queryEmbedding = await generateEmbedding(query);
    
    // 2. Najít nejbližší embeddings pomocí cosine similarity
    // Používáme pgvector operátor <=> pro cosine distance
    const results = await db.execute(sql`
      SELECT 
        e.chunk_text,
        d.title as document_title,
        1 - (e.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM ${embeddings} e
      JOIN ${documents} d ON e.document_id = d.id
      WHERE d.language = ${language}
        AND d.is_active = 1
      ORDER BY e.embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `);

    return results.rows.map((row: any) => ({
      chunkText: row.chunk_text,
      documentTitle: row.document_title,
      similarity: parseFloat(row.similarity),
    }));
  } catch (error: any) {
    // Database selhala (např. Neon endpoint disabled) - použít fallback
    console.error("[RAG] Database error, using fallback knowledge:", error.message);
    
    // Vrátit fallback data podle jazyka
    const fallbackData = FALLBACK_KNOWLEDGE[language] || FALLBACK_KNOWLEDGE.cs;
    return fallbackData.slice(0, limit);
  }
}

/**
 * Získá všechny dokumenty podle kategorie
 */
export async function getDocumentsByCategory(
  category: string,
  language: "cs" | "sk" = "cs"
): Promise<Document[]> {
  return await db.query.documents.findMany({
    where: (docs, { eq, and }) => and(
      eq(docs.category, category),
      eq(docs.language, language),
      eq(docs.isActive, 1)
    ),
    orderBy: [desc(documents.createdAt)],
  });
}

/**
 * Smaže dokument a všechny jeho embeddings
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Embeddings se smažou automaticky díky ON DELETE CASCADE
  await db.delete(documents).where(eq(documents.id, documentId));
  console.log(`[RAG] Document deleted: ${documentId}`);
}

/**
 * Aktualizuje dokument a přegeneruje embeddings
 */
export async function updateDocument(
  documentId: string,
  updates: Partial<Pick<Document, "title" | "content" | "category" | "metadata" | "isActive">>
): Promise<Document> {
  // 1. Aktualizovat dokument
  const [updated] = await db.update(documents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(documents.id, documentId))
    .returning();

  // 2. Pokud se změnil obsah, přegenerovat embeddings
  if (updates.content) {
    // Smazat staré embeddings
    await db.delete(embeddings).where(eq(embeddings.documentId, documentId));
    
    // Vygenerovat nové
    const chunks = chunkText(updates.content);
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      await db.insert(embeddings).values({
        documentId,
        chunkText: chunk,
        chunkIndex: i,
        embedding: JSON.parse(JSON.stringify(embedding)),
      });
    }
    
    console.log(`[RAG] Document updated: ${updated.title} (${chunks.length} chunks)`);
  }

  return updated;
}

/**
 * Inicializace znalostní báze s výchozími dokumenty
 */
export async function initializeKnowledgeBase() {
  const existingDocs = await db.query.documents.findMany({ limit: 1 });
  
  if (existingDocs.length > 0) {
    console.log("[RAG] Knowledge base already initialized");
    return;
  }

  console.log("[RAG] Initializing knowledge base with default documents...");

  // Přidat základní dokumenty o spotových cenách a TDD
  await addDocument(
    "Co jsou spotové ceny elektřiny?",
    `Spotové ceny elektřiny jsou ceny za elektřinu, které se mění každou hodinu podle aktuální nabídky a poptávky na energetické burze. 
    Tyto ceny odrážejí skutečné náklady na výrobu elektřiny v daném okamžiku.
    
    Výhody spotových cen:
    - Možnost ušetřit až 30% oproti standardním tarifům
    - Transparentnost - vidíte přesnou tržní cenu
    - Flexibilita - můžete přizpůsobit spotřebu levnějším hodinám
    
    Nevýhody:
    - Ceny kolísají - v některých hodinách mohou být vyšší
    - Vyžaduje aktivní správu spotřeby
    - Potřeba chytré technologie pro optimalizaci`,
    "electricity",
    "cs",
    { source: "system", version: "1.0" }
  );

  await addDocument(
    "TDD tarify - Time of Day Distribution",
    `TDD (Time of Day Distribution) tarify rozdělují den na časová pásma s různými sazbami za distribuci elektřiny.
    V České republice existuje 15 distribučních profilů pro různé typy odběratelů.
    
    Hlavní pásma:
    - Vysoké tarify (VT) - špičková doba, nejdražší
    - Nízké tarify (NT) - mimo špičku, levnější
    - Volné tarify (VolT) - víkendy a svátky, nejlevnější
    
    Profily pro domácnosti:
    - C01d - nízký odběr (do 3000 kWh/rok)
    - C02d - střední odběr (3000-6000 kWh/rok)
    - C03d - vysoký odběr (nad 6000 kWh/rok)
    
    Profily pro firmy:
    - C11d, C12d, C13d - malé podniky
    - C21d, C22d, C23d - střední podniky
    - C31d, C32d, C33d - velké podniky
    
    Úspory s TDD:
    Správným načasováním spotřeby do levných pásem můžete ušetřit 20-40% na distribučních poplatcích.`,
    "tdd",
    "cs",
    { source: "system", version: "1.0" }
  );

  await addDocument(
    "Jak ušetřit na elektřině?",
    `Existuje několik způsobů, jak snížit náklady na elektřinu:
    
    1. Přechod na spotové ceny
       - Monitorujte hodinové ceny
       - Využívajte levné hodiny (typicky noc, víkendy)
       - Potenciální úspora: 20-30%
    
    2. Optimalizace TDD tarifu
       - Spotřebovávejte v nízkých pásmech
       - Vyhněte se špičkám
       - Potenciální úspora: 15-25%
    
    3. Chytré technologie
       - Programovatelné spotřebiče
       - Home automation systémy
       - Bateriové úložiště
    
    4. Vlastní výroba
       - Fotovoltaika
       - Větrné turbíny (méně časté)
       - Kombinace s bateriovým úložištěm
    
    Pro výpočet konkrétních úspor kontaktujte našeho AI poradce Martina.`,
    "savings",
    "cs",
    { source: "system", version: "1.0" }
  );

  console.log("[RAG] Knowledge base initialized successfully");
}
