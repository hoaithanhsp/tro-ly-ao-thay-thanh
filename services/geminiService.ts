import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { Message, Role, SupportMode } from "../types";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key is missing!");
      throw new Error("API Key not found in environment variables");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const initializeChat = async () => {
  const ai = getGenAI();
  chatSession = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.3,
      maxOutputTokens: 4000,
    },
    history: [],
  });
};

export const sendMessageToGemini = async (
  text: string, 
  currentMode: SupportMode,
  history: Message[],
  image?: string // Base64 data URI
): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  // We append the current mode context specifically for this turn
  // so the model adheres strictly to the selected level of help.
  const contextAwareMessage = `[CHẾ ĐỘ HIỆN TẠI: ${currentMode.toUpperCase()}]
  
  Câu hỏi/Trả lời của học sinh:
  ${text}`;

  try {
    let messageContent: string | Part[] = contextAwareMessage;

    // If an image is provided, we construct a multipart message
    if (image) {
      const parts: Part[] = [];
      
      // Add text part
      parts.push({ text: contextAwareMessage });

      // Add image part
      // Image comes as "data:image/png;base64,....."
      const [mimeTypeHeader, base64Data] = image.split(';base64,');
      const mimeType = mimeTypeHeader.split(':')[1];

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
      
      // Update messageContent to be the parts array
      messageContent = parts;
    }

    const response = await chatSession.sendMessage({ message: messageContent });
    
    return response.text || "Thầy đang suy nghĩ, em đợi chút nhé...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ôi, mạng của thầy hơi chập chờn. Em hỏi lại giúp thầy nhé!";
  }
};

export const generateDailyReport = async (messages: Message[]): Promise<string> => {
    const ai = getGenAI();
    // Filter only relevant conversation text
    const conversationText = messages.map(m => `${m.role}: ${m.text}`).join('\n');
    
    const prompt = `Dựa trên đoạn hội thoại sau, hãy lập "BÁO CÁO HỖ TRỢ HỌC SINH" theo mẫu đã quy định trong System Instruction. 
    Chỉ trích xuất thông tin từ cuộc hội thoại này.
    
    Hội thoại:
    ${conversationText}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt
        });
        return response.text || "Không thể tạo báo cáo lúc này.";
    } catch (e) {
        return "Lỗi khi tạo báo cáo.";
    }
}