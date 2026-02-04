import { SearchResult } from "../types";

// Groq API Configuration
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

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
 * Helper function to call Groq API
 */
const callGroqAPI = async (messages: Array<{ role: string; content: string }>, temperature = 0.7): Promise<string> => {
    try {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages,
                temperature,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
        console.error("Groq API Error:", error);
        throw error;
    }
};

/**
 * Searches for memes, arts, or rumors related to a query.
 * Note: Groq doesn't have built-in web search grounding like Gemini,
 * so this uses the LLM's knowledge base instead.
 */
export const searchWeb = async (query: string): Promise<SearchResult> => {
    try {
        const messages = [
            {
                role: "system",
                content: "You are the Gujab Artifact Auditor. Your task is to identify if a keyword relates to popular internet memes, satirical rumors, or digital art.Provide the EXACT meme text or rumor.Separate multiple fragments with '---'. Keep responses under 500 characters  - up to date"
            },
            {
                role: "user",
                content: `Search for memes, gujabs, or satirical content related to: "${query}"`
            }
        ];

        const text = await callGroqAPI(messages, 0.5);

        // If response is too long or doesn't contain fragments, treat as null
        if (text.length > 500 && !text.includes('---')) {
            return { text: "SEARCH_NULL", sources: [] };
        }

        return {
            text: text || "SEARCH_NULL",
            sources: [] // Groq doesn't provide grounding sources
        };
    } catch (error) {
        console.error("Search Error:", error);
        return {
            text: "SEARCH_NULL",
            sources: []
        };
    }
};

/**
 * Generates an illustration description for a news story.
 * Note: This doesn't generate actual images, just descriptions.
 */
export const generateNewsIllustration = async (prompt: string): Promise<string | null> => {
    try {
        const messages = [
            {
                role: "user",
                content: `Describe a vintage newspaper illustration style, black and white ink sketch, high contrast: ${prompt}`
            }
        ];

        await callGroqAPI(messages);
        // Still returning null as we're not generating actual images
        return null;
    } catch (error) {
        console.error("Image Description Error:", error);
        return null;
    }
};

/**
 * Generates cryptic editorial comments for the Oracle feature
 */
export const generateEditorColumn = async (topic: string): Promise<string> => {
    try {
        const messages = [
            {
                role: "system",
                content: "You are 'The Oracle', a mysterious often funny buddy, superfecial, humorous, and witty. Write short, cryptic, and witty editorial comments (max 3 sentences) with a slightly cynical yet deeply insightful tone, like an old-school journalist who has seen it all."
            },
            {
                role: "user",
                content: `Write an editorial comment about: "${topic}"`
            }
        ];

        const response = await callGroqAPI(messages, 0.8);
        return response || "The wires are silent...";
    } catch (error) {
        console.error("Oracle AI Error:", error);
        return "A thick fog clouds the Oracle's vision.";
    }
};

/**
 * Generates a tabloid story (Gujab) about a topic
 */
export const generateTabloidStory = async (topic: string, language: 'English' | 'Bangla' = 'English'): Promise<GeneratedStory | null> => {
    try {
        const messages = [
            {
                role: "system",
                content: "You are a creative tabloid news writer. Create sensational 'Gujab' (rumor) stories that are fun, satirical, and non-harmful. Always respond with valid JSON only, no markdown formatting."
            },
            {
                role: "user",
                content: `Create a ${language} tabloid story about: "${topic}". Return a JSON object with: {"headline": "Sensational headline", "subhead": "Catchy subheadline", "content": "A 3-paragraph story that is fun, satirical (From Facebook ect.), and non-harmful", "category": "One of: Politics, Tech, Celebrity, Gossip, Finance, Creative Art, World, Lifestyle, Science, Sports, Satire", "author": "A creative pseudonym", "tags": ["3-5 relevant tags"], "imagePrompt": "Description for a vintage sketch illustration"}`
            }
        ];

        const text = await callGroqAPI(messages, 0.9);

        // Extract JSON from response (in case of markdown wrapping)
        const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
        return JSON.parse(jsonStr) as GeneratedStory;
    } catch (error) {
        console.error("Tabloid Generation Error:", error);
        return null;
    }
};
