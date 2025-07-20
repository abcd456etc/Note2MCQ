
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Note, ChatMessage } from '../types';
import { getChatResponseStream } from '../services/geminiService';
import { ArrowLeftIcon, BotIcon, LoaderIcon, SendIcon, UserIcon } from './Icons';

interface ChatViewProps {
  notes: Note[];
  chatHistory: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ notes, chatHistory, onNewMessage, onBack }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = useCallback(async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    onNewMessage(userMessage);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    // Construct history for API
    const apiHistory = chatHistory.map(m => ({role: m.role, text: m.text}));
    apiHistory.push({role: 'user', text: input});

    try {
      const stream = await getChatResponseStream(notes, apiHistory);
      let modelResponseText = '';
      const modelMessageId = (Date.now() + 1).toString();
      
      // Add a placeholder for the model's message
      const modelMessagePlaceholder: ChatMessage = { id: modelMessageId, role: 'model', text: '...' };
      onNewMessage(modelMessagePlaceholder);

      for await (const chunk of stream) {
        modelResponseText += chunk.text;
        // Update the existing model message in the history
        onNewMessage({ id: modelMessageId, role: 'model', text: modelResponseText });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      onNewMessage({ id: (Date.now() + 1).toString(), role: 'model', text: `Error: ${errorMessage}` });
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, notes, chatHistory, onNewMessage]);

  return (
    <div className="h-full flex flex-col bg-slate-800">
      <header className="flex items-center p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <button onClick={onBack} className="text-slate-300 hover:text-white mr-4">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold">Chat with your Notes</h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatHistory.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'model' && (
              <div className="w-8 h-8 flex-shrink-0 bg-indigo-600 rounded-full flex items-center justify-center">
                  <BotIcon className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`max-w-xl p-3 rounded-2xl ${message.role === 'user' ? 'bg-indigo-600 rounded-br-lg' : 'bg-slate-700 rounded-bl-lg'}`}>
              <p className="text-white whitespace-pre-wrap">{message.text}</p>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 flex-shrink-0 bg-slate-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-slate-200" />
              </div>
            )}
          </div>
        ))}
        {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-3 justify-start">
             <div className="w-8 h-8 flex-shrink-0 bg-indigo-600 rounded-full flex items-center justify-center">
                <LoaderIcon className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="max-w-xl p-3 rounded-2xl bg-slate-700 rounded-bl-lg">
                <p className="text-white">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t border-slate-700">
        {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question about your notes..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl p-3 pr-12 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
