import { db } from './db';
import type { AuthUser } from './auth';

export interface PersistedMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: Date;
}

export interface ChatSummary {
  id: string;
  title: string | null;
  updatedAt: Date;
}

export interface ChatDetail {
  id: string;
  title: string | null;
  messages: PersistedMessage[];
}

export interface ChatContext {
  summary: string | null;
  summarizedCount: number;
  messages: PersistedMessage[];
}

export async function ensureUser(user: AuthUser): Promise<void> {
  await db.user.upsert({
    where: { id: user.userId },
    create: { id: user.userId },
    update: {},
  });
}

export async function createChat(userId: string): Promise<string> {
  const chat = await db.chat.create({
    data: { userId },
    select: { id: true },
  });
  return chat.id;
}

export async function assertChatOwnership(chatId: string, userId: string): Promise<boolean> {
  const chat = await db.chat.findUnique({
    where: { id: chatId },
    select: { userId: true },
  });
  return chat?.userId === userId;
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await db.chat.update({ where: { id: chatId }, data: { title } });
}

export async function appendMessage(
  chatId: string,
  role: 'user' | 'ai',
  content: string,
): Promise<void> {
  await db.$transaction([
    db.message.create({ data: { chatId, role, content } }),
    db.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }),
  ]);
}

export async function loadChatMessages(chatId: string): Promise<PersistedMessage[]> {
  const rows = await db.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return rows.map((r: { id: string; role: string; content: string; createdAt: Date }) => ({
    ...r,
    role: r.role as 'user' | 'ai',
  }));
}

// Returns the chat's persisted summary plus only the messages that have NOT
// yet been folded into it (by createdAt order, skipping the first
// `summarizedCount`).
export async function loadChatContext(chatId: string): Promise<ChatContext> {
  const chat = await db.chat.findUnique({
    where: { id: chatId },
    select: { summary: true, summarizedCount: true },
  });
  const summary = chat?.summary ?? null;
  const summarizedCount = chat?.summarizedCount ?? 0;

  const rows = await db.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
    skip: summarizedCount,
    select: { id: true, role: true, content: true, createdAt: true },
  });
  const messages = rows.map(
    (r: { id: string; role: string; content: string; createdAt: Date }) => ({
      ...r,
      role: r.role as 'user' | 'ai',
    }),
  );
  return { summary, summarizedCount, messages };
}

export async function updateChatSummary(
  chatId: string,
  summary: string,
  summarizedCount: number,
): Promise<void> {
  await db.chat.update({
    where: { id: chatId },
    data: { summary, summarizedCount },
  });
}

export async function listChats(userId: string): Promise<ChatSummary[]> {
  return db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function deleteChat(chatId: string, userId: string): Promise<boolean> {
  const owns = await assertChatOwnership(chatId, userId);
  if (!owns) return false;
  await db.chat.delete({ where: { id: chatId } });
  return true;
}

export async function loadChat(chatId: string, userId: string): Promise<ChatDetail | null> {
  const chat = await db.chat.findFirst({
    where: { id: chatId, userId },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });
  if (!chat) return null;
  return {
    id: chat.id,
    title: chat.title,
    messages: chat.messages.map(
      (m: { id: string; role: string; content: string; createdAt: Date }) => ({
        ...m,
        role: m.role as 'user' | 'ai',
      }),
    ),
  };
}
