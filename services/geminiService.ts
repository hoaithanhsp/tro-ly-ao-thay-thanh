import { GoogleGenAI, Chat, Content, Part } from "@google/genai";
import { Message, Role, SupportMode } from "../types";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// ✅ API ROTATION - Lấy tất cả API keys từ biến môi trường
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.API_KEY, // Giữ lại key cũ để fallback
].filter(key => key && key.trim() !== ''); // Lọc bỏ undefined và string rỗng

// ✅ Hàm chọn API key ngẫu nhiên
const getRandomApiKey = (): string => {
  if (API_KEYS.length === 0) {
    throw new Error("No API keys found in environment variables. Please add GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.");
  }
  
  const randomIndex = Math.floor(Math.random() * API_KEYS.length);
  const selectedKey = API_KEYS[randomIndex];
  
  console.log(`🔄 Using API Key #${randomIndex + 1} (Total: ${API_KEYS.length} keys)`);
  
  return selectedKey;
};

const getGenAI = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = getRandomApiKey(); // ✅ Thay đổi: Dùng random API key
    
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // ✅ Thêm: Nếu gặp lỗi 429 (quota exceeded), reset và thử lại với key khác
    if (error?.status === 429 || error?.message?.includes('quota')) {
      console.warn("⚠️ API quota exceeded, resetting session with new key...");
      genAI = null; // Reset để chọn key mới
      chatSession = null;
      
      // Thử lại 1 lần với key mới
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
};
