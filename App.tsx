import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Message, Role, SupportMode } from './types';
import { INITIAL_GREETING } from './constants';
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
    <div className="flex h-full bg-slate-50 overflow-hidden relative">

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
      <main className="flex-1 flex flex-col h-full relative w-full bg-white md:bg-slate-50">

        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm">TH</div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm">Thầy Trần Hoài Thanh</h1>
              <p className="text-xs text-emerald-600">Trợ lý Toán học</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-colors ${!hasApiKey ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-500 hover:bg-slate-100'}`}
              title="Cài đặt API Key"
            >
              <Settings size={20} />
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Header - Desktop (Added for Settings button visibility on Desktop) */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-10">
          <div className="flex items-center gap-3">
            {/* Can add breadcrumbs or title here if needed */}
          </div>
          <div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl border transition-all shadow-sm
                        ${!hasApiKey
                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }
                    `}
            >
              <Settings size={18} />
              <span className="font-medium text-sm">
                {hasApiKey ? "Cài đặt & API" : "Lấy API Key để sử dụng app"}
              </span>
            </button>
          </div>
        </header>


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

              {isLoading && (
                <div className="flex w-full mb-6 justify-start animate-fade-in">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-slate-500 font-medium">Thầy đang giải...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-4 md:right-8 bg-white border border-slate-200 text-emerald-600 p-2 rounded-full shadow-lg hover:bg-slate-50 transition-all z-20"
            >
              <ArrowDown size={20} />
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-6 bg-white border-t border-slate-200 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-3xl mx-auto w-full">

            <ModeSelector
              currentMode={currentMode}
              onSelectMode={setCurrentMode}
              disabled={isLoading}
            />

            {/* Image Preview Area */}
            {selectedImage && (
              <div className="mb-3 relative inline-block animate-in fade-in slide-in-from-bottom-2">
                <div className="relative group">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="h-24 w-auto rounded-xl border border-slate-200 shadow-md object-contain bg-slate-50"
                  />
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 bg-white text-slate-500 border border-slate-200 rounded-full p-1 shadow-sm hover:text-red-500 hover:border-red-200 transition-colors"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`
                      p-3 mb-0.5 rounded-xl transition-all border
                      ${selectedImage
                    ? 'text-emerald-600 bg-emerald-50 border-emerald-200 shadow-sm'
                    : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50 hover:text-emerald-600'
                  }
                    `}
                title="Gửi ảnh bài tập"
                disabled={isLoading}
              >
                {selectedImage ? <ImageIcon size={20} /> : <Paperclip size={20} />}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={selectedImage ? "Thêm ghi chú cho ảnh này..." : "Nhập câu hỏi hoặc bài toán..."}
                className="flex-1 py-3 px-4 bg-slate-100 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 resize-none min-h-[48px] max-h-[120px]"
                style={{ height: '48px' }}
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`
                    p-3 mb-0.5 rounded-xl flex items-center justify-center transition-all
                    ${(!input.trim() && !selectedImage) || isLoading
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-emerald-200'
                  }
                  `}
              >
                <Send size={20} />
              </button>
            </form>
            <div className="text-center mt-2 hidden md:block">
              <p className="text-[10px] text-slate-400">
                Trợ lý ảo có thể mắc lỗi. Hãy luôn kiểm tra lại kết quả.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Promotion */}
        <footer className="bg-slate-800 text-slate-300 py-8 px-4 mt-auto border-t border-slate-700 no-print">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
              <p className="font-bold text-lg md:text-xl text-blue-200 mb-3 leading-relaxed">
                ĐĂNG KÝ KHOÁ HỌC THỰC CHIẾN VIẾT SKKN, TẠO APP DẠY HỌC, TẠO MÔ PHỎNG TRỰC QUAN <br className="hidden md:block" />
                <span className="text-yellow-400">CHỈ VỚI 1 CÂU LỆNH</span>
              </p>
              <a
                href="https://tinyurl.com/khoahocAI2025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all transform hover:-translate-y-1 shadow-lg shadow-blue-900/50"
              >
                ĐĂNG KÝ NGAY
              </a>
            </div>

            <div className="space-y-2 text-sm md:text-base">
              <p className="font-medium text-slate-400">Mọi thông tin vui lòng liên hệ:</p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                <a
                  href="https://www.facebook.com/tranhoaithanhvicko/"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                >
                  <span className="font-bold">Facebook:</span> tranhoaithanhvicko
                </a>
                <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                <span className="hover:text-emerald-400 transition-colors duration-200 cursor-default flex items-center gap-2">
                  <span className="font-bold">Zalo:</span> 0348296773
                </span>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default App;