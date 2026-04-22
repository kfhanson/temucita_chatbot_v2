import React, { useState, useEffect, useRef } from 'react';
import { PanelLeft, SquarePen, Search, Settings, MoreHorizontal, ChevronDown, Trash2 } from 'lucide-react';

export interface SidebarChat {
  id: string;
  title: string | null;
}

interface SidebarProps {
  chats: SidebarChat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export default function Sidebar({ chats, activeChatId, onNewChat, onSelectChat, onDeleteChat }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter((chat) => {
    const title = chat.title ?? 'Untitled';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  return (
    <div className={`h-full bg-bg-sidebar flex flex-col py-6 border-r border-terracotta/10 shrink-0 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[280px] px-6' : 'w-20 items-center'}`}>

      {/* Logo Area */}
      <div className={`mb-8 flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <path d="M16 26.5L14.5 25.1C8.4 19.6 4 15.6 4 10.5C4 6.4 7.2 3.2 11.3 3.2C13.6 3.2 15.8 4.3 17 6.1C18.2 4.3 20.4 3.2 22.7 3.2C26.8 3.2 30 6.4 30 10.5C30 15.6 25.6 19.6 19.5 25.2L18 26.5L16 26.5Z" fill="#EED09D"/>
          <path d="M16 26.5L14.5 25.1C8.4 19.6 4 15.6 4 10.5C4 6.4 7.2 3.2 11.3 3.2C13.6 3.2 15.8 4.3 17 6.1V26.5H16Z" fill="#D68A67"/>
        </svg>
        {isExpanded && <span className="text-xl font-bold text-text-main">TemuCita</span>}
      </div>

      {/* Panel Toggle */}
      <div className={`w-full flex ${isExpanded ? 'justify-start mb-6' : 'justify-center mb-6'}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl text-text-main hover:bg-terracotta/10 transition-colors"
        >
          <PanelLeft size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* New Chat & Search */}
      {isExpanded ? (
        <div className="flex flex-col gap-4 w-full mb-6">
          <button
            onClick={onNewChat}
            className="w-full py-3 px-4 rounded-xl bg-terracotta text-white shadow-sm transition-transform hover:scale-[1.02] flex items-center justify-center gap-2 font-medium"
          >
            <SquarePen size={20} strokeWidth={2} />
            New Chat
          </button>

          <div className="relative w-full">
            <Search size={18} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-main" />
            <input
              type="text"
              placeholder="Search Chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none pl-10 pr-4 py-2 text-text-main placeholder:text-text-main font-medium"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 w-full items-center mb-6">
          <button
            onClick={onNewChat}
            className="p-3 rounded-xl bg-terracotta text-white shadow-sm transition-transform hover:scale-105"
          >
            <SquarePen size={24} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setIsExpanded(true)}
            className="p-3 rounded-xl text-text-main hover:bg-terracotta/10 transition-colors"
          >
            <Search size={24} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Chat List (Expanded Only) */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto w-full flex flex-col gap-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-1 mb-2 px-2 text-text-main font-bold">
            Your Chat <ChevronDown size={16} strokeWidth={2} />
          </div>
          {filteredChats.length === 0 ? (
            <div className="px-2 py-2 text-sm text-text-muted">
              {chats.length === 0 ? 'No chats yet' : 'No matches'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const menuOpen = openMenuId === chat.id;
              return (
                <div key={chat.id} className="relative">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectChat(chat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectChat(chat.id)}
                    className={`flex items-center justify-between w-full p-2 rounded-lg cursor-pointer group transition-colors ${
                      isActive ? 'bg-terracotta/10' : 'hover:bg-terracotta/5'
                    }`}
                  >
                    <span className={`truncate pr-4 text-sm ${chat.title ? 'text-text-main' : 'text-text-muted italic'}`}>
                      {chat.title ?? 'Untitled'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(menuOpen ? null : chat.id);
                      }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-terracotta/10 transition-opacity shrink-0"
                      aria-label="Chat options"
                    >
                      <MoreHorizontal size={16} className="text-text-muted" />
                    </button>
                  </div>

                  {menuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-full mt-1 z-50 bg-white border border-terracotta/15 rounded-xl shadow-lg py-1 min-w-[120px]"
                    >
                      <button
                        onClick={() => {
                          setOpenMenuId(null);
                          onDeleteChat(chat.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-lg"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Spacer for collapsed state */}
      {!isExpanded && <div className="flex-grow"></div>}

      {/* Settings */}
      <div className={`w-full mt-4 ${isExpanded ? '' : 'flex justify-center'}`}>
        {isExpanded ? (
          <button className="w-full py-2.5 px-4 rounded-xl border border-terracotta/20 text-text-main hover:bg-terracotta/5 transition-colors flex items-center gap-3 font-medium">
            <Settings size={20} strokeWidth={1.5} />
            Pengaturan dan bantuan
          </button>
        ) : (
          <button className="p-3 rounded-xl text-text-main hover:bg-terracotta/10 transition-colors mb-4">
            <Settings size={24} strokeWidth={1.5} />
          </button>
        )}
      </div>

    </div>
  );
}
