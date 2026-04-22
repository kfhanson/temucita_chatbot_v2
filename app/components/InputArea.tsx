import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowUp } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
}

export default function InputArea({ onSendMessage, isLoading, isSearchEnabled, onToggleSearch }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-[#F4EAE1] rounded-[2rem] p-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="bg-white rounded-[1.5rem] p-4 flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share what's on your mind..."
            className="w-full bg-transparent resize-none outline-none text-text-main placeholder:text-text-muted/60 text-lg px-2 min-h-[44px] max-h-[150px] overflow-y-auto"
            rows={1}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between mt-2">
            {/* Search Pill */}
            <button 
              onClick={onToggleSearch}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors text-sm font-medium ${
                isSearchEnabled 
                  ? 'bg-terracotta text-white border-terracotta' 
                  : 'border-terracotta/30 text-text-main hover:bg-terracotta/5'
              }`}
            >
              <Search size={16} className={isSearchEnabled ? "text-white" : "text-text-main"} />
              <span>Search</span>
            </button>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-full bg-terracotta text-white hover:bg-terracotta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
