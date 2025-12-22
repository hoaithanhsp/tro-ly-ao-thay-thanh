import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div className={`flex max-w-[90%] md:max-w-[85%] ${isUser ? 'items-end space-x-2' : 'items-end space-x-2'}`}>

        {/* Avatar - Teacher Only (Left) */}
        {!isUser && (
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm order-first mr-2">
            TH
          </div>
        )}

        {/* Message Content Wrapper */}
        <div className={`flex flex-col space-y-1 w-full min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm overflow-hidden 
                ${isUser
              ? 'bg-primary text-white rounded-br-none shadow-glow'
              : 'bg-bubble-teacher-light dark:bg-bubble-teacher-dark border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
            }`}>

            {/* Image Rendering */}
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/20 bg-black/5">
                <img
                  src={message.image}
                  alt="Bài tập học sinh gửi"
                  className="max-w-full h-auto max-h-[300px] object-contain mx-auto"
                />
              </div>
            )}

            {/* Text Rendering */}
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            ) : (
              <div className="prose prose-sm prose-slate dark:prose-invert max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    // Custom paragraph
                    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2 marker:text-primary" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2 marker:text-primary" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    strong: ({ node, ...props }) => <span className="font-bold text-gray-900 dark:text-white" {...props} />,
                    code: ({ node, className, children, ...props }) => {
                      return !className ? (
                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-mono text-xs border border-gray-200 dark:border-gray-600" {...props}>{children}</code>
                      ) : (
                        <code className={className} {...props}>{children}</code>
                      )
                    },
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-primary pl-4 py-1 italic bg-green-50 dark:bg-green-900/10 rounded-r-lg text-gray-700 dark:text-gray-300 my-2" {...props} />
                    ),
                    table: ({ node, ...props }) => <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props} /></div>,
                    th: ({ node, ...props }) => <th className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />,
                    td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800" {...props} />,
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Timestamp & Status */}
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-gray-400">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isUser && <span className="text-[10px] text-gray-400">· Đã gửi</span>}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChatMessage;