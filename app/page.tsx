'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import InputArea from './components/InputArea';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { motion } from 'framer-motion';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenerativeAI(API_KEY);

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

const SYSTEM_INSTRUCTION = `You are TemuCita, a compassionate, empathetic, and professional mental health chatbot. 
Your goal is to provide a safe space for users to talk, share, and feel heard. 
Use therapeutic techniques like active listening, validation, and gentle cognitive reframing.
Do not diagnose or prescribe medication. If someone is in immediate danger, provide crisis hotline information.
Keep your responses concise, warm, and conversational. Use a calming tone.`;

// Mock Knowledge Base for RAG
const KNOWLEDGE_BASE = [
  {
    topic: "Anxiety",
    content: "When feeling anxious, try the 5-4-3-2-1 grounding technique: Identify 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste."
  },
  {
    topic: "Overwhelm",
    content: "When overwhelmed by tasks, try the 'Eisenhower Matrix' to prioritize, or simply break down the largest task into the smallest possible next step. Remember that it's okay to pause and take a breath."
  },
  {
    topic: "Negative Self-Talk",
    content: "Cognitive Behavioral Therapy (CBT) suggests challenging negative thoughts. Ask yourself: Is this thought based on fact or feeling? What would I tell a friend in this situation?"
  }
];

function retrieveContext(query: string): string {
  const lowerQuery = query.toLowerCase();
  const relevantDocs = KNOWLEDGE_BASE.filter(doc => 
    lowerQuery.includes(doc.topic.toLowerCase()) || 
    doc.content.toLowerCase().split(' ').some(word => lowerQuery.includes(word))
  );
  
  if (relevantDocs.length > 0) {
    return `\n\n[Context from Knowledge Base: ${relevantDocs.map(d => d.content).join(' ')}]`;
  }
  return '';
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);

  // Initialize chat session on mount
  useEffect(() => {
    const initChat = () => {
      const model = ai.getGenerativeModel({
        model: 'gemini-flash-latest',
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      const chat = model.startChat({
        generationConfig: {
          temperature: 0.7,
        },
      });
      setChatSession(chat);
    };
    initChat();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !chatSession) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      let prompt = content;
      if (isSearchEnabled) {
        const context = retrieveContext(content);
        if (context) {
          prompt += context;
        }
      }

      const response = await chatSession.sendMessage(prompt);
      
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.response.text() || "I'm here for you. Could you tell me more?",
      };
      
      setMessages((prev) => [...prev, newAiMsg]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-bg-main overflow-hidden font-sans">
      <Sidebar onNewChat={handleNewChat} />
      
      <main className="flex-1 flex flex-col relative h-full">
        {/* Top Right Profile Placeholder */}
        <div className="absolute top-6 right-8 z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img 
              src="https://picsum.photos/seed/profile/100/100" 
              alt="User Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center w-full max-w-4xl"
            >
              {/* Cute Icon/Illustration placeholder */}
              <div className="mb-6 flex justify-center">
                <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Left Bubble (Orange) */}
                  <path d="M48.5 35C48.5 45.4934 39.9934 54 29.5 54C26.5 54 23.6644 53.3 21.1118 52.0526L12 56L14.6316 47.7895C11.75 44.3 10.5 40 10.5 35C10.5 24.5066 19.0066 16 29.5 16C39.9934 16 48.5 24.5066 48.5 35Z" fill="#E89B6A"/>
                  <path d="M24 32C24 33.6569 25.3431 35 27 35C28.6569 35 30 33.6569 30 32" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="23" cy="28" r="1.5" fill="#4A3B32"/>
                  <circle cx="31" cy="28" r="1.5" fill="#4A3B32"/>
                  
                  {/* Right Bubble (Yellow) */}
                  <path d="M82.5 45C82.5 54.3888 74.8888 62 65.5 62C62.8 62 60.25 61.35 58 60.2L50 64L52.3 56.5C49.8 53.4 48.5 49.5 48.5 45C48.5 35.6112 56.1112 28 65.5 28C74.8888 28 82.5 35.6112 82.5 45Z" fill="#EED09D"/>
                  <path d="M60 42C60 43.6569 61.3431 45 63 45C64.6569 45 66 43.6569 66 42" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="59" cy="38" r="1.5" fill="#4A3B32"/>
                  <circle cx="67" cy="38" r="1.5" fill="#4A3B32"/>

                  {/* Sparkles */}
                  <path d="M54 12L55.5 16.5L60 18L55.5 19.5L54 24L52.5 19.5L48 18L52.5 16.5L54 12Z" fill="#EED09D"/>
                  <path d="M22 6L23 9L26 10L23 11L22 14L21 11L18 10L21 9L22 6Z" fill="#E89B6A"/>
                  <path d="M86 20L86.5 22L88.5 22.5L86.5 23L86 25L85.5 23L83.5 22.5L85.5 22L86 20Z" fill="#E89B6A"/>
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-text-main mb-3">Hi, I'm TemuCita.</h1>
              <p className="text-text-main text-base mb-10 text-center">
                This is a safe space to talk, share, and feel heard..<br/>
                You don't have to go through this alone.
              </p>

              <div className="w-full mb-8">
                <InputArea 
                  onSendMessage={handleSendMessage} 
                  isLoading={isLoading} 
                  isSearchEnabled={isSearchEnabled}
                  onToggleSearch={() => setIsSearchEnabled(!isSearchEnabled)}
                />
              </div>

              {/* Suggestion Pills */}
              <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
                <button 
                  onClick={() => handleSendMessage("I need some support right now.")}
                  className="px-6 py-2.5 rounded-full border border-[#D9A8E2] bg-[#F9F0FA] text-[#8C4A97] text-sm font-medium hover:bg-[#F3E5F5] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">🫂</span> Get Support
                </button>
                <button 
                  onClick={() => handleSendMessage("I'm trying to find clarity on a situation.")}
                  className="px-6 py-2.5 rounded-full border border-[#88D4D9] bg-[#EEF9FA] text-[#3A8B90] text-sm font-medium hover:bg-[#E0F4F6] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">😌</span> Find Clarity
                </button>
                <button 
                  onClick={() => handleSendMessage("I want to reflect and understand my feelings.")}
                  className="px-6 py-2.5 rounded-full border border-[#F2B888] bg-[#FDF6F0] text-[#A66A3A] text-sm font-medium hover:bg-[#FAEDE3] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">🧘</span> Reflect and Understand
                </button>
                <button 
                  onClick={() => handleSendMessage("Can you share some mental health resources?")}
                  className="px-6 py-2.5 rounded-full border border-[#F49898] bg-[#FDF2F2] text-[#B34D4D] text-sm font-medium hover:bg-[#FAEDED] transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">📋</span> Mental Health Resources
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <ChatWindow messages={messages} />
            <div className="w-full bg-gradient-to-t from-bg-main via-bg-main to-transparent pt-4 px-8 pb-8">
              <InputArea 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                isSearchEnabled={isSearchEnabled}
                onToggleSearch={() => setIsSearchEnabled(!isSearchEnabled)}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
