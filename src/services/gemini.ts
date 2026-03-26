import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface JointPositions {
  head: { x: number; y: number };
  neck: { x: number; y: number };
  lShoulder: { x: number; y: number };
  lElbow: { x: number; y: number };
  lWrist: { x: number; y: number };
  rShoulder: { x: number; y: number };
  rElbow: { x: number; y: number };
  rWrist: { x: number; y: number };
  spine: { x: number; y: number };
  // Facial features
  lEye: { x: number; y: number };
  rEye: { x: number; y: number };
  mouth: { x: number; y: number; width: number; height: number };
  // Fingers (Simplified: 3 points per hand to show hand shape)
  lFingers: { x: number; y: number }[];
  rFingers: { x: number; y: number }[];
}

export interface AnimationFrame {
  timestamp: number;
  joints: JointPositions;
  label?: string;
  expression?: string;
}

export async function translateToSignLanguage(text: string, urls: string[] = []) {
  // Use gemini-3-flash-preview for significantly faster response times
  const model = "gemini-3-flash-preview";
  
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { error: "API Key is missing. Please check your environment variables." };
  }

  const prompt = `Translate the following content into a sequence of sign language animation frames for a stick figure.
  
  INPUT TEXT: "${text}"
  INPUT URLS: ${urls.join(", ")}
  
  CRITICAL INSTRUCTIONS:
  1. If URLs are provided, you MUST fetch the full content/lyrics using 'googleSearch' or 'urlContext'. Do not just translate the URL title.
  2. Translate the ENTIRE meaning into a sequence of at least 15-20 keyframes.
  3. FINGERS ARE MANDATORY: You must change the 'lFingers' and 'rFingers' positions in EVERY frame to represent different hand shapes (e.g., fist, open palm, pointing, "OK" sign). 
  4. Finger positions are absolute coordinates (0-100). They should be near the wrists but move independently to show the sign's hand shape.
  5. Use facial expressions (mouth width/height, eye positions) to convey the emotion of the content.
  6. If the input is a song, translate the lyrics into sign language gestures.
  
  JOINTS: head, neck, lShoulder, lElbow, lWrist, rShoulder, rElbow, rWrist, spine.
  FACIAL: lEye, rEye, mouth (x, y, width, height).
  FINGERS: lFingers (3 points), rFingers (3 points).
  
  Coordinates are (x, y) from 0 to 100. (50, 50) is center.
  Provide a sequence of keyframes with 'label' and 'expression'.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            frames: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.NUMBER },
                  label: { type: Type.STRING },
                  expression: { type: Type.STRING },
                  joints: {
                    type: Type.OBJECT,
                    properties: {
                      head: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      neck: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      lShoulder: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      lElbow: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      lWrist: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      rShoulder: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      rElbow: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      rWrist: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      spine: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      lEye: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      rEye: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      mouth: { type: Type.OBJECT, properties: { 
                        x: { type: Type.NUMBER }, 
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      } },
                      lFingers: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      },
                      rFingers: { 
                        type: Type.ARRAY, 
                        items: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } },
                      },
                    }
                  }
                }
              }
            },
            summary: { type: Type.STRING, description: "A brief summary of the translation" }
          }
        },
        tools: urls.length > 0 ? [{ googleSearch: {} }, { urlContext: {} }] : [],
        toolConfig: urls.length > 0 ? { includeServerSideToolInvocations: true } : undefined
      }
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (e) {
    console.error("Gemini Translation Error:", e);
    return { error: e instanceof Error ? e.message : "Unknown translation error" };
  }
}
