import React from 'react';
import { motion } from 'framer-motion';

interface MessageProps {
  role: 'user' | 'ai';
  content: string;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1" aria-label="Assistant is thinking">
      <span className="w-2 h-2 rounded-full bg-terracotta/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-terracotta/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-terracotta/60 animate-bounce" />
    </div>
  );
}

export default function Message({ role, content }: MessageProps) {
  const isUser = role === 'user';
  const isEmptyAi = !isUser && content.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] px-6 py-4 text-[15px] leading-relaxed ${
          isUser
            ? 'bg-user-bubble text-text-main rounded-2xl rounded-tr-sm'
            : 'bg-transparent border border-terracotta/40 text-text-main rounded-2xl rounded-tl-sm'
        }`}
      >
        {isEmptyAi ? <TypingDots /> : content}
      </div>
    </motion.div>
  );
}
