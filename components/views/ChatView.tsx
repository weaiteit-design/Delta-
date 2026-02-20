import React, { useRef, useEffect } from 'react';
import { ChatMessage, UserContext } from '../../types';
import { Send, User, Bot } from 'lucide-react';

interface ChatViewProps {
    messages: ChatMessage[];
    input: string;
    setInput: (val: string) => void;
    onSend: () => void;
    isTyping: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ messages, input, setInput, onSend, isTyping }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-neutral-800' : 'bg-blue-600'
                            }`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                ? 'bg-neutral-800 text-white rounded-tr-none'
                                : 'bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-tl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                            <Bot size={14} />
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="pt-2">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSend()}
                        placeholder="Ask for clarification or help..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                        onClick={onSend}
                        disabled={!input.trim()}
                        className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-neutral-600 text-center mt-2">
                    Delta can explain any update or tool in simple terms.
                </p>
            </div>
        </div>
    );
};
