export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export enum SupportMode {
  HINT = 'hint',   // Chế độ 1: Gợi ý nhẹ
  GUIDE = 'guide', // Chế độ 2: Hướng dẫn chi tiết
  SOLVE = 'solve', // Chế độ 3: Giải hoàn chỉnh
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  image?: string; // Base64 data string for image support
  timestamp: Date;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  mode: SupportMode;
}

export interface DailyReport {
  totalQuestions: number;
  topics: Record<string, number>;
  commonQuestions: string[];
}