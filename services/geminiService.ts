import { GoogleGenAI, Type } from "@google/genai";
import { GitHubRepo } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeRepo = async (repo: GitHubRepo): Promise<{ summary: string; useCase: string }> => {
  try {
    const prompt = `
      Analyze this GitHub repository based on the following details:
      Name: ${repo.full_name}
      Description: ${repo.description || "No description provided."}
      Language: ${repo.language || "Unknown"}
      Topics: ${repo.topics.join(', ')}

      Provide a concise summary (max 1 sentence) and a primary use case (max 1 sentence).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            useCase: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return { summary: "Analysis failed.", useCase: "Could not generate analysis." };
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "AI analysis unavailable.",
      useCase: "Check API Key configuration."
    };
  }
};
