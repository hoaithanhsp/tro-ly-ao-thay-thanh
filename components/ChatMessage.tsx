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
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shadow-sm mt-1 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-emerald-600'
        }`}>
          {isUser ? <User size={18} /> : <Bot size={22} />}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full min-w-0`}>
          <div className={`px-4 py-3 md:px-5 md:py-4 rounded-2xl text-[15px] md:text-base leading-relaxed shadow-sm overflow-hidden w-full ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
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
               <div className="prose prose-sm md:prose-base prose-slate max-w-none break-words">
                 <ReactMarkdown 
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                        // Custom paragraph to control spacing
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        // Style lists
                        ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 marker:text-emerald-500" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 marker:text-emerald-500" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        // Strong text
                        strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                        // Inline code that isn't math
                        code: ({node, className, children, ...props}) => {
                             const match = /language-(\w+)/.exec(className || '')
                             return !className ? (
                               <code className="bg-slate-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs border border-slate-200" {...props}>{children}</code>
                             ) : (
                               <code className={className} {...props}>{children}</code>
                             )
                        },
                        // Blockquotes for hints or important notes
                        blockquote: ({node, ...props}) => (
                            <blockquote className="border-l-4 border-emerald-500 pl-4 py-1 italic bg-emerald-50 rounded-r-lg text-slate-700 my-2" {...props} />
                        ),
                        // Tables for organized data
                        table: ({node, ...props}) => <div className="overflow-x-auto my-2"><table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg" {...props} /></div>,
                        th: ({node, ...props}) => <th className="bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider" {...props} />,
                        td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-600 border-t border-slate-100" {...props} />,
                    }}
                 >
                    {message.text}
                 </ReactMarkdown>
               </div>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;