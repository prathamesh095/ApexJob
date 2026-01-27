
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Standard initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ResearchResult {
  content: string;
  sources: { title: string; uri: string }[];
}

export async function researchCompany(company: string): Promise<ResearchResult> {
  const prompt = `Provide a strategic executive briefing on ${company} for a job candidate.
    Focus on:
    1. Recent news/press releases (last 6 months)
    2. Financial health/Funding rounds
    3. Key product launches or strategic pivots
    4. Cultural values or mission statement keywords
    
    Keep it concise (under 200 words), bulleted, and highly actionable.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "text/plain"
      }
    });

    const content = response.text || "No intelligence gathered.";
    
    // Extract grounding chunks properly
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title) || [];

    return { content, sources };
  } catch (error) {
    console.error("AI Research error:", error);
    return { content: "Intelligence gathering failed due to network or API constraints.", sources: [] };
  }
}

export async function generateOutreachDraft(params: {
  company: string;
  role: string;
  contactName: string;
  tone: string;
}): Promise<string> {
  const prompt = `Write a professional outreach email for a job application.
    Company: ${params.company}
    Role: ${params.role}
    Contact: ${params.contactName}
    Tone: ${params.tone}
    
    Keep it concise, high-impact, and focused on how I can add value.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Failed to generate draft.";
  } catch (error) {
    console.error("AI Generation error:", error);
    return "AI service temporarily unavailable.";
  }
}

export async function summarizeApplicationHistory(logs: string[]): Promise<string> {
  const prompt = `Summarize the following career application events into a concise narrative. 
    Focus on key milestones and current status.
    
    Events:
    ${logs.join('\n')}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error("AI Analysis error:", error);
    return "Analysis failed.";
  }
}
