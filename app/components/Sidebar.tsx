import React, { useState } from 'react';
import { PanelLeft, SquarePen, Search, Settings, MoreHorizontal, ChevronDown } from 'lucide-react';

interface SidebarProps {
  onNewChat: () => void;
}

const MOCK_CHATS = Array(8).fill(null).map((_, i) => ({
  id: i.toString(),
  title: "Tes kalimat disini"
}));

export default function Sidebar({ onNewChat }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = MOCK_CHATS.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredChats.map(chat => (
            <div key={chat.id} className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-terracotta/5 cursor-pointer group transition-colors">
              <span className="text-text-main truncate pr-4">{chat.title}</span>
              <MoreHorizontal size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          ))}
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
