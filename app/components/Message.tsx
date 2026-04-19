import React from 'react';
import { motion } from 'framer-motion';

interface MessageProps {
  role: 'user' | 'ai';
  content: string;
}

export default function Message({ role, content }: MessageProps) {
  const isUser = role === 'user';

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
        {content}
      </div>
    </motion.div>
  );
}
