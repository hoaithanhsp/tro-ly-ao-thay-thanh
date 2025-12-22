import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Message, Role, SupportMode } from './types';
import { INITIAL_GREETING, MODE_DESCRIPTIONS } from './constants';
import { sendMessageToGemini, generateDailyReport, initializeChat, getApiKey } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ModeSelector from './components/ModeSelector';
import TeacherProfile from './components/TeacherProfile';
import ApiKeyModal from './components/ApiKeyModal';
import { Send, Paperclip, Menu, X, Image as ImageIcon, Trash2, ArrowDown, Settings } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: Role.MODEL,
      text: INITIAL_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<SupportMode>(SupportMode.HINT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Settings & API Key State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Use a ref for the scroll container instead of a dummy div at the end
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize checks on mount
  useEffect(() => {
    const checkKey = () => {
      const key = getApiKey();
      if (key) {
        setHasApiKey(true);
        // Initialize chat if key exists
        initializeChat(key, 'gemini-3-flash-preview').catch(console.error);
      } else {
        setHasApiKey(false);
        // Open settings if no key found (small delay for UX)
        setTimeout(() => setIsSettingsOpen(true), 800);
      }
    };
    checkKey();
  }, []);

  // Handle scroll logic
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior,
      });
    }
  };

  // Auto scroll on new messages
  useLayoutEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading]);

  // Show/hide scroll to bottom button
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        // Focus back on input
        setTimeout(() => inputRef.current?.focus(), 100);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedImage) || isLoading) return;

    if (!hasApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userText = input;
    const userImage = selectedImage;

    // Reset inputs immediately
    setInput('');
    setSelectedImage(null);

    // Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText,
      image: userImage || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Pass both text and image to the service
      // We pass undefined for preferredModelId to let it use default or whatever logic inside
      const responseText = await sendMessageToGemini(
        userText || "Gửi một ảnh bài tập",
        currentMode,
        messages,
        userImage || undefined
      );

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error("Failed to send message", error);

      const errorMessage = error?.message || "Lỗi không xác định";
      const isResourceExhausted = errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("429");

      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: Role.MODEL,
        text: isResourceExhausted
          ? `⚠️ **LỖI:** ${errorMessage}\n\nHệ thống đang quá tải hoặc hết quota. Vui lòng kiểm tra API Key hoặc thử lại sau.`
          : `Đã dừng do lỗi: ${errorMessage}`, // Change to "Đã dừng do lỗi" as requested
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
      // Keep focus on input for desktop
      if (window.innerWidth > 768) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  const handleGenerateReport = async () => {
    if (!hasApiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setIsGeneratingReport(true);
    const report = await generateDailyReport(messages);

    const reportMessage: Message = {
      id: Date.now().toString(),
      role: Role.MODEL,
      text: `📊 **BÁO CÁO TỰ ĐỘNG:**\n\n${report}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, reportMessage]);
    setIsGeneratingReport(false);
    setIsSidebarOpen(false); // Close mobile sidebar if open
  };

  return (
    <div className="flex h-full bg-background-light dark:bg-background-dark overflow-hidden relative font-display">

      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => {
          setHasApiKey(!!getApiKey());
          // Optionally re-init chat here if key changed
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`
        absolute md:relative z-30 w-[280px] h-full transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:block md:w-80 md:p-6 p-0 bg-white md:bg-transparent
      `}>
        <div className="h-full md:h-full bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 overflow-hidden flex flex-col">
          <div className="h-full p-4 md:p-0 overflow-y-auto custom-scrollbar">
            <TeacherProfile
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative w-full bg-background-light dark:bg-background-dark transition-colors duration-200">



        {/* Header - Styled per snippet */}
        <header className="bg-surface-light dark:bg-surface-dark shadow-sm px-4 py-3 flex items-center justify-between z-20 sticky top-0 transition-colors duration-200">
          <div className="flex items-center space-x-3">
            {/* Mobile Sidebar Toggle (using Back Icon style) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-500 dark:text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="material-icons-round">menu</span>
            </button>
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shadow-glow">
                TH
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-surface-dark rounded-full"></div>
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-gray-900 dark:text-white">Trần Hoài Thanh</h1>
              <p className="text-xs text-primary font-medium">Đang hoạt động</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Cài đặt"
            >
              <span className={`material-icons-round ${!hasApiKey ? 'text-red-500 animate-pulse' : ''}`}>settings</span>
            </button>
            <button className="text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors hidden md:block">
              <span className="material-icons-round">more_vert</span>
            </button>
          </div>
        </header>

        {/* Teacher Info Card (Visible on Desktop/Tablet or collapsible) - Adapting snippet 'header extension' */}
        <div className="px-4 pt-4 pb-2 hidden md:block">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-soft border border-gray-100 dark:border-gray-700 transition-colors duration-200 max-w-3xl mx-auto w-full">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="material-icons-round text-sm mr-1 text-primary">school</span>
                  <span>GV Toán - THPT Khúc Thừa Dụ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-bold uppercase rounded-lg border border-green-100 dark:border-green-800">Toán 10-12</span>
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase rounded-lg border border-blue-100 dark:border-blue-800">Nhiệt tình</span>
                </div>
              </div>
              <button
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors"
                title="Tạo báo cáo"
              >
                <span className="material-icons-round text-lg">assessment</span>
              </button>
            </div>
          </div>
        </div>




        {/* Chat Messages Container */}
        <div className="flex-1 relative flex flex-col min-h-0"> {/* min-h-0 is crucial for flex scrolling */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar scroll-smooth"
          >
            <div className="max-w-3xl mx-auto w-full pb-8">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              <div className="flex items-end space-x-2 animate-fade-in">
                <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                <div className="bg-bubble-teacher-light dark:bg-bubble-teacher-dark px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 w-16">
                  <div className="flex space-x-1 justify-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-4 md:right-8 bg-white border border-slate-200 text-teal-600 p-2 rounded-full shadow-lg hover:bg-slate-50 transition-all z-20"
            >
              <ArrowDown size={20} />
            </button>
          )}
        </div>

        {/* Footer Input Area */}
        <footer className="bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 pt-2 pb-6 px-4 z-30 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] transition-colors duration-200">
          {/* Mode Chips */}
          <div className="flex space-x-2 overflow-x-auto hide-scrollbar mb-3 pb-1 justify-center md:justify-start max-w-3xl mx-auto w-full">
            {Object.values(SupportMode).map((mode) => {
              const isSelected = currentMode === mode;
              // Map modes to specific colors/icons as per snippet style
              let icon = "lightbulb";
              if (mode === SupportMode.GUIDE) icon = "menu_book";
              if (mode === SupportMode.SOLVE) icon = "check_circle_outline";

              return (
                <button
                  key={mode}
                  onClick={() => setCurrentMode(mode)}
                  disabled={isLoading}
                  className={`
                                flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold active:scale-95 transition-transform border
                                ${isSelected
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 ring-1 ring-green-200'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }
                            `}
                >
                  <span className="material-icons-round text-sm">{icon}</span>
                  <span>{MODE_DESCRIPTIONS[mode].label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Bar */}
          <div className="flex items-end space-x-2 max-w-3xl mx-auto w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            >
              <span className="material-icons-round rotate-45">attach_file</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-[1.5rem] flex items-center px-4 py-1.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/50">
              {/* Image Preview inside input */}
              {selectedImage && (
                <div className="mr-2 relative group">
                  <img src={selectedImage} alt="preview" className="h-8 w-8 rounded object-cover border border-gray-300" />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-1 -right-1 bg-white text-gray-500 rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
                  >
                    <span className="material-icons-round text-[10px]">close</span>
                  </button>
                </div>
              )}

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 py-2"
                placeholder={selectedImage ? "Thêm ghi chú..." : "Nhập câu hỏi hoặc bài toán..."}
                disabled={isLoading}
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className={`
                        p-3 rounded-full shadow-lg hover:shadow-glow active:scale-90 transition-all flex-shrink-0 flex items-center justify-center
                         ${(!input.trim() && !selectedImage) || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white'
                }
                    `}
            >
              <span className="material-icons-round text-xl">send</span>
            </button>
          </div>

          <div className="text-[10px] text-center text-gray-400 dark:text-gray-600 mt-3 font-medium hidden md:block">
            Trợ lý ảo có thể mắc lỗi. Hãy luôn kiểm tra lại kết quả.
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;