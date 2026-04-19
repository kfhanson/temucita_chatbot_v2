import React, { useEffect, useRef } from 'react';
import Message from './Message';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatWindowProps {
  messages: ChatMessage[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 scroll-smooth pt-24">
      <div className="max-w-4xl mx-auto flex flex-col">
        {messages.map((msg) => (
          <Message key={msg.id} role={msg.role} content={msg.content} />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
