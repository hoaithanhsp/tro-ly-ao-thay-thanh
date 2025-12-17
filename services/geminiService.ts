import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { Message, Role, SupportMode } from "../types";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// ✅ API ROTATION - Lấy từ import.meta.env (Vite style)
const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_API_KEY, // Fallback
].filter(key => key && key.trim() !== '');

// Debug log
console.log(`🔑 Found ${API_KEYS.length} API keys`);
if (API_KEYS.length > 0) {
  console.log(`🔑 First key preview: ${API_KEYS[0]?.substring(0, 15)}...`);
}

// ✅ Hàm chọn API key ngẫu nhiên
const getRandomApiKey = (): string => {
  if (API_KEYS.length === 0) {
    console.error("❌ No API keys found!");
    console.error("Available env vars:", import.meta.env);
    throw new Error("No API keys found. Please add VITE_GEMINI_API_KEY_1, etc. in Vercel Environment Variables");
  }

  const randomIndex = Math.floor(Math.random() * API_KEYS.length);
  const selectedKey = API_KEYS[randomIndex];

  console.log(`🔄 Using API Key #${randomIndex + 1} (Total: ${API_KEYS.length} keys)`);

  return selectedKey;
};

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = getRandomApiKey();

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
  image?: string
): Promise<string> => {
  if (!chatSession) {
    await initializeChat();
  }

  if (!chatSession) {
    throw new Error("Failed to initialize chat session");
  }

  const contextAwareMessage = `[CHẾ ĐỘ HIỆN TẠI: ${currentMode.toUpperCase()}]

Câu hỏi/Trả lời của học sinh:
${text}`;

  try {
    let messageContent: string | Part[] = contextAwareMessage;

    if (image) {
      const parts: Part[] = [];
      parts.push({ text: contextAwareMessage });

      const [mimeTypeHeader, base64Data] = image.split(';base64,');
      const mimeType = mimeTypeHeader.split(':')[1];

      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });

      messageContent = parts;
    }

    const response = await chatSession.sendMessage({ message: messageContent });

    return response.text || "Thầy đang suy nghĩ, em đợi chút nhé...";
  } catch (error: any) {
    console.error("Gemini API Error:", error);

    // Auto retry with new key on quota error
    if (error?.status === 429 || error?.message?.includes('quota')) {
      console.warn("⚠️ API quota exceeded, resetting session with new key...");
      genAI = null;
      chatSession = null;

      try {
        await initializeChat();
        const response = await chatSession!.sendMessage({ message: messageContent });
        return response.text || "Thầy đang suy nghĩ, em đợi chút nhé...";
      } catch (retryError) {
        console.error("Retry failed:", retryError);
      }
    }

    return "Ôi, mạng của thầy hơi chập chờn. Em hỏi lại giúp thầy nhé!";
  }
};

export const generateDailyReport = async (messages: Message[]): Promise<string> => {
  const ai = getGenAI();
  const conversationText = messages.map(m => `${m.role}: ${m.text}`).join('\n');

  const prompt = `Dựa trên đoạn hội thoại sau, hãy lập "BÁO CÁO HỖ TRỢ HỌC SINH" theo mẫu đã quy định trong System Instruction.
Chỉ trích xuất thông tin từ cuộc hội thoại này.

Hội thoại:
${conversationText}`;

  try {
    const response = await ai.models.generateContent({
      model: gemini-3-pro-preview,
      contents: prompt
    });
    return response.text || "Không thể tạo báo cáo lúc này.";
  } catch (e) {
    return "Lỗi khi tạo báo cáo.";
  }
};
