import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GenerationOptions, Topic, AtomicClaim, Source, Analysis } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are a senior forensic analyst and information architect. Your task is to transform raw input into a structured "System of Truth".

PROCESS:
1. DECOMPOSE: Break down the input/topic into Atomic Claims. A claim is a single, falsifiable statement or a distinct opinion.
2. CLASSIFY: Assign every claim a type (factual, opinion, speculation, prediction) and a status (verified, disputed, unverified).
3. SOURCE: Identify core verification sources for the claims.
4. ANALYZE: Create a structured Analysis based on the the requested type (balanced, comparison, verification, impact, challenge).

CORE PRINCIPLES:
- Every slide content block MUST reference a claimId if it makes a specific assertion.
- Status hints must be consistent with the claim's status.
- Claims must be atomic. No multi-point sentences.
- Be extremely rigorous about distinguishing Facts from Opinions.

Analysis Types:
- balanced: Explores the core context and multiple interpretations.
- comparison: Contrasts different perspectives or datasets directly.
- verification: Focuses on the truth status of the most controversial claims.
- impact: Focuses on the "so what" and real-world consequences.
- challenge: Intentionally steel-mans a narrative challenge to the consensus.

Return the response strictly as JSON.
`;

export interface GenerationResult {
  topic: Partial<Topic>;
  claims: Partial<AtomicClaim>[];
  sources: Partial<Source>[];
  analysis: Partial<Analysis>;
}

export async function generateClaimAnalysis(options: GenerationOptions): Promise<GenerationResult> {
  const prompt = `
Topic/Source Content: "${options.topic}"
${options.inputContent ? `Input Content to Analyze:\n${options.inputContent}` : ""}
Requested Analysis Type: ${options.analysisType}

Deconstruct this into a Topic, its Atomic Claims, and a "${options.analysisType}" Analysis.
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
          topic: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "description", "category"]
          },
          claims: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Small unique slug like 'claim-1'" },
                statement: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["factual", "opinion", "speculation", "prediction"] },
                status: { type: Type.STRING, enum: ["verified", "disputed", "unverified"] },
                confidence: { type: Type.NUMBER, description: "0.0 to 1.0" },
                sourceIds: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["id", "statement", "type", "status"]
            }
          },
          sources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                url: { type: Type.STRING },
                citation: { type: Type.STRING }
              },
              required: ["id", "title", "citation"]
            }
          },
          analysis: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              slides: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    type: { type: Type.STRING },
                    content: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          claimId: { type: Type.STRING, description: "MUST match an ID from the claims array if applicable" },
                          statusHint: { type: Type.STRING, enum: ["verified", "disputed", "unverified"] }
                        },
                        required: ["text"]
                      }
                    }
                  },
                  required: ["title", "content"]
                }
              }
            },
            required: ["title", "slides"]
          }
        },
        required: ["topic", "claims", "sources", "analysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as GenerationResult;
}
