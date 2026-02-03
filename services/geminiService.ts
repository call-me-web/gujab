import { GoogleGenAI } from "@google/genai";
import { SearchResult } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: import.meta.env.VITE_GEMINI_API_KEY});
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface GeneratedStory {
  headline: string;
  subhead: string;
  content: string;
  category: string;
  author: string;
  tags: string[];
  imagePrompt?: string;
}

/**
 * Uses Google Search Grounding to find existing memes, arts, or rumors.
 * Strictly filters out serious/factual news. Only 'artifacts' (memes/gujabs) pass.
 */
export const searchWeb = async (query: string): Promise<SearchResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are the Gujab Artifact Auditor. Your task is to locate specific visual memes, digital cards, or satirical rumors (Gujabs) related to: "${query}".
      
      STRICT AUDIT CRITERIA:
      1. IDENTIFY: Is the keyword related to a popular internet meme, a satirical rumor, or a piece of digital art?
      2. FILTER: If the search results are primarily serious news, factual reports, or non-satirical information, you MUST return only: SEARCH_NULL.
      3. NO GENERATION: You are strictly forbidden from writing your own summaries or explaining the findings.
      4. EXTRACTION: If a relevant meme caption or satirical rumor is found, provide the EXACT TEXT only. Separate multiple fragments with "---".
      5. NULL STATE: If no "fun" artifacts (memes/gujabs/art) exist for this keyword, return: SEARCH_NULL.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text?.trim() || "SEARCH_NULL";

    // If the model generates a polite refusal or an explanation, override to NULL
    if (text.length > 500 && !text.includes('---')) {
      return { text: "SEARCH_NULL", sources: [] };
    }

    return {
      text: text,
      sources: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any) || []
    };
  } catch (error) {
    console.error("Search Grounding Error:", error);
    return {
      text: "SEARCH_NULL",
      sources: []
    };
  }
};

/**
 * Generates an illustration for a news story using Gemini Image generation.
 * Note: gemini-1.5-flash doesn't generate images directly like DALL-E, 
 * but we can use it to describe images or use a specific image model if available.
 * For this implementation, we'll keep the structure but note that real image gen
 * requires a multimodal model or specific API.
 */
export const generateNewsIllustration = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Describe a vintage newspaper illustration style, black and white ink sketch, high contrast: ${prompt}`,
    });

    // Still returning null for now as 2.0-flash is text-to-text here.
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

/**
 * Direct Gemini API implementation for Editor Column
 */
export const generateEditorColumn = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are "The Oracle", a mysterious, vintage-style tabloid editor. 
      Write a short, cryptic, and witty editorial comment (max 3 sentences) about this topic: "${topic}".
      Maintain a tone that is slightly cynical yet deeply insightful, like an old-school journalist who has seen it all.`,
    });
    return response.text?.trim() || "The wires are silent...";
  } catch (error) {
    console.error("Oracle AI Error:", error);
    return "A thick fog clouds the Oracle's vision.";
  }
};

/**
 * Direct Gemini API implementation for Tabloid Story
 */
export const generateTabloidStory = async (topic: string, language: 'English' | 'Bangla' = 'English'): Promise<GeneratedStory | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a creative tabloid news writer. Create a sensational "Gujab" (rumor) story about: "${topic}".
      Language: ${language}.
      
      Return a JSON object with:
      {
        "headline": "Sensational headline",
        "subhead": "Catchy subheadline",
        "content": "A 3-paragraph story that is fun, satirical, and non-harmful",
        "category": "One of: Politics, Tech, Celebrity, Gossip, Finance, Creative Art, World, Lifestyle, Science, Sports, Satire",
        "author": "A creative pseudonym",
        "tags": ["3-5 relevant tags"],
        "imagePrompt": "Description for a vintage sketch illustration"
      }`,
    });

    const text = response.text?.trim() || "";
    // Basic JSON extraction in case of markdown wrapping
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(jsonStr) as GeneratedStory;
  } catch (error) {
    console.error("Tabloid Generation Error:", error);
    return null;
  }
};