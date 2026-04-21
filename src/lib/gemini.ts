import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GenerationOptions, Claim, Source, Deck } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a senior analyst specializing in information deconstruction and narrative synthesis. 
Your goal is to transform complex input (URL content or raw text) into a structured graph of atomic claims and an optional narrative deck.

CORE PRINCIPLES:
1. ATOMICITY: Every claim MUST be a single, discrete assertion. If a sentence has multiple points, break it into multiple claims.
2. CLASSIFICATION: Every claim MUST be classified into exactly one of:
    - verifiable: Statements that can be checked against empirical evidence or data.
    - opinion: Value judgments, subjective interpretations, or moral stances.
    - speculation: Possible but unproven interpretations or bridge-logic.
    - prediction: Statements about future events or outcomes.
3. NEUTRALITY: Your extraction must be descriptive, not prescriptive. Do not judge truth; merely classify and map.
4. NARRATIVE: If an intent is provided, construct a sequence of claims that fulfills that intent (explain, case, challenge, compare).

Output strictly in JSON.
`;

export interface ExtractionResult {
  source: Partial<Source>;
  claims: Partial<Claim>[];
  initialDeck?: Partial<Deck>;
}

export async function extractClaimsAndNarrative(options: GenerationOptions): Promise<ExtractionResult> {
  const content = options.sourceInput;
  if (!content) throw new Error("No content provided for analysis");

  const prompt = `
INPUT CONTENT:
${content}

INTENT: ${options.intent || "Not specified"}

TASK:
1. Generate a descriptive title for this source.
2. Extract all significant atomic claims from the text.
3. Classify each claim.
4. ${options.intent ? `Construct an initial deck of 5-8 slides for the intent "${options.intent}". Each slide should link to one claim and provide a brief narration (max 150 chars).` : "No deck needed for now."}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH
      },
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

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as ExtractionResult;
}
