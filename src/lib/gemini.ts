import { GoogleGenAI, Type } from "@google/genai";
import { GenerationOptions, Claim, Source, Deck, ExtractionDebug } from "./types";
import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a senior analyst specializing in analyzing information and creating structural outlines. 
Your goal is to transform complex input (URL content or raw text) into a simple list of key claims and an optional presentation deck.

CORE PRINCIPLES:
1. SINGLE POINTS: Every claim MUST make just one clear point. If a sentence has multiple ideas, break it into multiple claims.
2. CLASSIFICATION: Every claim MUST be classified into exactly one of:
    - verifiable: Statements that can be checked against empirical evidence or data.
    - opinion: Value judgments, subjective interpretations, or moral stances.
    - speculation: Possible but unproven interpretations or logic.
    - prediction: Statements about future events or outcomes.
3. NEUTRALITY: Your extraction must be objective. Do not judge truth; merely classify and list the statements.
4. NARRATIVE: If an intent is provided, construct a sequence of claims that fulfills that intent (explain, case, challenge, compare).

Output strictly in JSON.
`;

export interface ExtractionResult {
  source: Partial<Source>;
  claims: Partial<Claim>[];
  initialDeck?: Partial<Deck>;
  fromCache?: boolean;
  debug?: ExtractionDebug;
}

export class ExtractionError extends Error {
  debug?: ExtractionDebug;
  constructor(message: string, debug?: ExtractionDebug, options?: ErrorOptions) {
    super(message, options);
    this.debug = debug;
    this.name = 'ExtractionError';
  }
}

/**
 * Utility to generate a stable hash for a string input.
 */
async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function extractClaimsAndNarrative(options: GenerationOptions): Promise<ExtractionResult> {
  const content = options.sourceInput;
  if (!content) throw new Error("No content provided for analysis");

  // 1. Check Cache
  const inputHash = await hashInput(`${content}-${options.intent}`);
  const cacheRef = doc(db, 'extraction_cache', inputHash);
  
  try {
    const cacheSnap = await getDoc(cacheRef);
    if (cacheSnap.exists()) {
      console.log("Extraction served from cache:", inputHash);
      return { 
        ...(cacheSnap.data().result as ExtractionResult),
        fromCache: true 
      };
    }
  } catch (err) {
    // Fail silent on cache read error, proceed to AI
    console.warn("Cache lookup failed:", err);
  }

  const prompt = `
Please analyze this source: ${content}

If the source is a URL, use the available tools to research its content. Focus on the core message and primary assertions.
If the source is raw text, deconstruct it directly.

Goal:
1. Extract the top 5-10 key claims.
2. Classify claims (verifiable, opinion, speculation, prediction).
3. ${options.intent ? `Synthesize a concise narrative deck for the intent "${options.intent}".` : "Provide a descriptive title."}

CRITICAL: If content is extremely long, prioritize the introduction and conclusion for claim extraction.
STRICT JSON OUTPUT.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      tools: [
        { googleSearch: {} }
      ],
      toolConfig: { includeServerSideToolInvocations: true },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          source: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
            },
            required: ["title"]
          },
          claims: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Small unique slug like 'claim-1'" },
                statement: { type: Type.STRING },
                classification: { type: Type.STRING, enum: ["verifiable", "opinion", "speculation", "prediction"] }
              },
              required: ["id", "statement", "classification"]
            }
          },
          initialDeck: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    claimId: { type: Type.STRING },
                    narration: { type: Type.STRING }
                  },
                  required: ["claimId"]
                }
              }
            }
          }
        },
        required: ["source", "claims"]
      }
    }
  });

  const rawText = response.text;
  const candidates = response.candidates;

  if (!rawText) {
    // Check if it was a safety blockage
    const safetyRatings = candidates?.[0]?.safetyRatings;
    if (safetyRatings?.some(r => r.probability !== 'NEGLIGIBLE')) {
      throw new ExtractionError("Content was flagged by safety filters.", { rawResponse: rawText, candidates });
    }
    throw new ExtractionError("No response from AI - The model may have reached its limit or failed to produce valid JSON.", { rawResponse: rawText, candidates });
  }
  
  let result: ExtractionResult;
  try {
    result = JSON.parse(rawText) as ExtractionResult;
    result.debug = { rawResponse: rawText, candidates };
  } catch (err) {
    console.error("Failed to parse AI response:", rawText);
    throw new ExtractionError("AI produced invalid data format. Please try again.", { rawResponse: rawText, candidates }, { cause: err });
  }

  // 2. Save to Cache
  try {
    // We don't save debug info to public cache to save space and keep it clean
    const cacheResult = { ...result };
    delete cacheResult.debug;
    
    await setDoc(cacheRef, {
      inputHash,
      result: cacheResult,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("Failed to write to extraction cache:", err);
  }
  
  return result;
}
