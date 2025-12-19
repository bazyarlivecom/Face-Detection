import { GoogleGenAI, Type } from "@google/genai";
import { DetectedPerson } from "../types";

const analysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.INTEGER,
        description: "A unique sequential number for the person detected.",
      },
      category: {
        type: Type.STRING,
        description: "Category (Customer, Staff, Security, Vendor).",
      },
      description: {
        type: Type.STRING,
        description: "Visual description.",
      },
      boundingBox: {
        type: Type.ARRAY,
        items: {
          type: Type.INTEGER,
        },
        description: "Coordinates [ymin, xmin, ymax, xmax] 0-1000.",
      },
    },
    required: ["id", "category", "description", "boundingBox"],
  },
};

export const analyzeFrame = async (base64Image: string): Promise<DetectedPerson[]> => {
  // نمونه‌سازی در لحظه فراخوانی برای اطمینان از دسترسی به کلید API محیطی
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Detect all people in this surveillance frame. Assign IDs, categorize them, and provide bounding boxes.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a professional security analyst. Focus on identifying roles (staff vs customers) and providing precise spatial coordinates.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as DetectedPerson[];
    }
    return [];
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    // هندلینگ خطای کلید نامعتبر یا یافت نشدن
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API Key")) {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        window.aistudio.openSelectKey();
      }
    }
    throw error;
  }
};