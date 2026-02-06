
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ImageSize, AspectRatio } from "./types";

/**
 * Creates a fresh Gemini instance.
 * We do this every time for critical parts like high-quality images to ensure 
 * we use the latest API key from the user selection dialog if applicable.
 */
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateCampaignCopy = async (prompt: string): Promise<any> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a comprehensive email marketing campaign based on this request: "${prompt}".
    Return the response strictly as a JSON object with the following fields:
    - title: A short title for this campaign
    - subjectLines: An array of 3 engaging subject lines
    - previewText: A short preview text (snippet)
    - bodyHtml: Professional email body copy in HTML format (use basic tags like <p>, <strong>, <br>, <h2>)
    - visualPrompt: A detailed, artistic prompt for an AI image generator that would perfectly complement this email campaign.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subjectLines: { type: Type.ARRAY, items: { type: Type.STRING } },
          previewText: { type: Type.STRING },
          bodyHtml: { type: Type.STRING },
          visualPrompt: { type: Type.STRING }
        },
        required: ["title", "subjectLines", "previewText", "bodyHtml", "visualPrompt"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateCampaignImage = async (
  prompt: string, 
  size: ImageSize = '1K',
  aspectRatio: AspectRatio = '16:9'
): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image was generated in the response");
};

export const chatWithGenie = async (history: { role: string; content: string }[]) => {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are CampaignGenie, an expert marketing consultant. Help the user optimize their email campaigns, suggest improvements for subject lines, or answer marketing strategy questions."
    }
  });

  // Convert history for Gemini format (Gemini chat takes 'user' and 'model')
  const lastMessage = history[history.length - 1].content;
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
};
