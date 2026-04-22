'use client';
import React, { useState, useEffect } from 'react';
import Sidebar, { type SidebarChat } from './Sidebar';
import ChatWindow from './ChatWindow';
import InputArea from './InputArea';
import { motion } from 'framer-motion';
import type { AuthUser } from '@/lib/auth';

interface StarterPrompt {
  emoji: string;
  label: string;
  message: string;
  palette: {
    border: string;
    bg: string;
    text: string;
    hover: string;
  };
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    emoji: '🫂',
    label: 'Get Support',
    message: 'I need some support right now.',
    palette: { border: '#D9A8E2', bg: '#F9F0FA', text: '#8C4A97', hover: '#F3E5F5' },
  },
  {
    emoji: '😌',
    label: 'Find Clarity',
    message: "I'm trying to find clarity on a situation.",
    palette: { border: '#88D4D9', bg: '#EEF9FA', text: '#3A8B90', hover: '#E0F4F6' },
  },
  {
    emoji: '🧘',
    label: 'Reflect and Understand',
    message: 'I want to reflect and understand my feelings.',
    palette: { border: '#F2B888', bg: '#FDF6F0', text: '#A66A3A', hover: '#FAEDE3' },
  },
  {
    emoji: '📋',
    label: 'Mental Health Resources',
    message: 'Can you share some mental health resources?',
    palette: { border: '#F49898', bg: '#FDF2F2', text: '#B34D4D', hover: '#FAEDED' },
  },
  {
    emoji: '😰',
    label: 'Manage Anxiety',
    message: "I've been feeling anxious and could use some grounding.",
    palette: { border: '#A8C5E2', bg: '#F0F5FA', text: '#4A7AA6', hover: '#E5EEF5' },
  },
  {
    emoji: '💤',
    label: 'Trouble Sleeping',
    message: "I'm having trouble sleeping lately. Can we talk about it?",
    palette: { border: '#B8A8E2', bg: '#F4F0FA', text: '#6A5AA6', hover: '#ECE5F5' },
  },
  {
    emoji: '🌱',
    label: 'Build a Habit',
    message: "I'd like help building a healthier daily habit.",
    palette: { border: '#A8D9B3', bg: '#F0FAF3', text: '#3D8A54', hover: '#E0F4E8' },
  },
  {
    emoji: '🌧️',
    label: 'Feeling Low',
    message: "I've been feeling low and not sure why.",
    palette: { border: '#D9BFA8', bg: '#FAF4F0', text: '#8A6A4A', hover: '#F4E8DC' },
  },
  {
    emoji: '🔥',
    label: 'Burned Out',
    message: "I'm burned out and don't know where to start.",
    palette: { border: '#F4B088', bg: '#FDF4ED', text: '#B3663A', hover: '#FAE8DC' },
  },
  {
    emoji: '💬',
    label: 'Just Want to Talk',
    message: 'I just want to talk. Nothing specific, really.',
    palette: { border: '#C8C8C8', bg: '#F5F5F5', text: '#555555', hover: '#EDEDED' },
  },
];

function pickRandom<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

interface ChatAppProps {
  user: AuthUser;
}

export default function ChatApp({ user }: ChatAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<SidebarChat[]>([]);

  // Start with a deterministic slice so SSR and first client render match,
  // then shuffle to a random subset on mount to avoid a hydration mismatch.
  const [starters, setStarters] = useState<StarterPrompt[]>(() =>
    STARTER_PROMPTS.slice(0, 4),
  );
  useEffect(() => {
    setStarters(pickRandom(STARTER_PROMPTS, 4));
  }, []);

  const refreshChats = async () => {
    try {
      const res = await fetch('/api/chats');
      if (!res.ok) return;
      const data = (await res.json()) as { chats: SidebarChat[] };
      setChats(data.chats);
    } catch (err) {
      console.error('Failed to load chat list:', err);
    }
  };

  useEffect(() => {
    refreshChats();
  }, []);

  const handleSelectChat = async (id: string) => {
    if (isLoading || id === chatId) return;
    try {
      const res = await fetch(`/api/chats/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        chat: { id: string; messages: { id: string; role: 'user' | 'ai'; content: string }[] };
      };
      setChatId(data.chat.id);
      setMessages(
        data.chat.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
      );
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };
    const aiMsgId = (Date.now() + 1).toString();

    setMessages((prev) => [...prev, userMsg, { id: aiMsgId, role: 'ai', content: '' }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: content,
          useSearch: isSearchEnabled,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const returnedChatId = res.headers.get('X-Chat-Id');
      if (returnedChatId && returnedChatId !== chatId) {
        setChatId(returnedChatId);
        refreshChats(); // show new chat in sidebar immediately
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let target = ''; // everything received so far
      let streamDone = false;
      let displayed = 0;

      // Typewriter pacing: reveal roughly 60 chars/sec regardless of how
      // Gemini chunks arrive. A tick every 16ms (one animation frame) reveals
      // CHARS_PER_TICK chars; we catch up instantly if we fall more than
      // CATCHUP_LIMIT chars behind the server.
      const CHARS_PER_TICK = 1;
      const TICK_MS = 16;
      const CATCHUP_LIMIT = 400;

      const paintPromise = new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (displayed >= target.length) {
            if (streamDone) {
              clearInterval(interval);
              resolve();
            }
            return;
          }
          if (target.length - displayed > CATCHUP_LIMIT) {
            displayed = target.length;
          } else {
            displayed = Math.min(target.length, displayed + CHARS_PER_TICK);
          }
          const shown = target.slice(0, displayed);
          setMessages((prev) =>
            prev.map((m) => (m.id === aiMsgId ? { ...m, content: shown } : m)),
          );
        }, TICK_MS);
      });

      (async () => {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          target += decoder.decode(value, { stream: true });
        }
        streamDone = true;
      })().catch(() => {
        streamDone = true;
      });

      await paintPromise;
      const accumulated = target;

      if (!accumulated) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: "I'm here for you. Could you tell me more?" }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content:
                  "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment.",
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
      refreshChats();
    }
  };

  const handleDeleteChat = async (id: string) => {
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (chatId === id) {
      setMessages([]);
      setChatId(null);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setChatId(null);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen w-full bg-bg-main overflow-hidden font-sans">
      <Sidebar
        chats={chats}
        activeChatId={chatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
      />

      <main className="flex-1 flex flex-col relative h-full">
        {/* Top Right Profile */}
        <div className="absolute top-6 right-8 z-10">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
            <img
              src={user.imageUrl}
              alt={user.name}
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
              <div className="mb-6 flex justify-center">
                <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M48.5 35C48.5 45.4934 39.9934 54 29.5 54C26.5 54 23.6644 53.3 21.1118 52.0526L12 56L14.6316 47.7895C11.75 44.3 10.5 40 10.5 35C10.5 24.5066 19.0066 16 29.5 16C39.9934 16 48.5 24.5066 48.5 35Z" fill="#E89B6A"/>
                  <path d="M24 32C24 33.6569 25.3431 35 27 35C28.6569 35 30 33.6569 30 32" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="23" cy="28" r="1.5" fill="#4A3B32"/>
                  <circle cx="31" cy="28" r="1.5" fill="#4A3B32"/>
                  <path d="M82.5 45C82.5 54.3888 74.8888 62 65.5 62C62.8 62 60.25 61.35 58 60.2L50 64L52.3 56.5C49.8 53.4 48.5 49.5 48.5 45C48.5 35.6112 56.1112 28 65.5 28C74.8888 28 82.5 35.6112 82.5 45Z" fill="#EED09D"/>
                  <path d="M60 42C60 43.6569 61.3431 45 63 45C64.6569 45 66 43.6569 66 42" stroke="#4A3B32" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="59" cy="38" r="1.5" fill="#4A3B32"/>
                  <circle cx="67" cy="38" r="1.5" fill="#4A3B32"/>
                  <path d="M54 12L55.5 16.5L60 18L55.5 19.5L54 24L52.5 19.5L48 18L52.5 16.5L54 12Z" fill="#EED09D"/>
                  <path d="M22 6L23 9L26 10L23 11L22 14L21 11L18 10L21 9L22 6Z" fill="#E89B6A"/>
                  <path d="M86 20L86.5 22L88.5 22.5L86.5 23L86 25L85.5 23L83.5 22.5L85.5 22L86 20Z" fill="#E89B6A"/>
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-text-main mb-3">Hi, I&apos;m TemuCita.</h1>
              <p className="text-text-main text-base mb-10 text-center">
                This is a safe space to talk, share, and feel heard..<br/>
                You don&apos;t have to go through this alone.
              </p>

              <div className="w-full mb-8">
                <InputArea
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  isSearchEnabled={isSearchEnabled}
                  onToggleSearch={() => setIsSearchEnabled(!isSearchEnabled)}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
                {starters.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => handleSendMessage(s.message)}
                    style={{
                      borderColor: s.palette.border,
                      backgroundColor: s.palette.bg,
                      color: s.palette.text,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        s.palette.hover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                        s.palette.bg;
                    }}
                    className="px-6 py-2.5 rounded-full border text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <span className="text-lg">{s.emoji}</span> {s.label}
                  </button>
                ))}
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
