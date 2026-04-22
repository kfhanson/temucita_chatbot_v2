import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { getCurrentUser } from '@/lib/auth';
import {
  appendMessage,
  assertChatOwnership,
  createChat,
  ensureUser,
  loadChatContext,
  updateChatSummary,
  updateChatTitle,
  type PersistedMessage,
} from '@/lib/chats';
import { generateChatTitle } from '@/lib/title';
import { vectorSearch, type RetrievedChunk } from '@/lib/documents';
import { summarizeMessages } from '@/lib/memory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_INSTRUCTION = `You are TemuCita, a compassionate, empathetic, and professional mental health chatbot.
Your goal is to provide a safe space for users to talk, share, and feel heard.
Use therapeutic techniques like active listening, validation, and gentle cognitive reframing.
Do not diagnose or prescribe medication. If someone is in immediate danger, provide crisis hotline information.
Keep your responses concise, warm, and conversational. Use a calming tone.`;

// Cosine distance threshold (0 = identical, 2 = opposite). Chunks above this
// are treated as unrelated to the query.
const RELEVANCE_THRESHOLD = 0.75;

// Context-window knobs. When unsummarized messages exceed SUMMARIZE_THRESHOLD,
// fold the oldest SUMMARIZE_CHUNK of them into the chat's rolling summary.
// Only the last HISTORY_WINDOW unsummarized messages are sent to Gemini as
// turn-by-turn history; the summary lives in the system instruction.
const HISTORY_WINDOW = 10;
const SUMMARIZE_THRESHOLD = 20;
const SUMMARIZE_CHUNK = 15;

function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  const relevant = chunks.filter((c) => c.distance <= RELEVANCE_THRESHOLD);
  if (relevant.length === 0) {
    return `\n\n[Context: No matching entries were found in our resources. If the user is asking for specific information from our materials, gently note that you don't have it in the provided resources and offer general guidance instead, phrased like: "I don't have information on that in our specific resources, but generally speaking..."]`;
  }
  const body = relevant
    .map((c, i) => `(${i + 1}) [${c.documentTitle}] ${c.content}`)
    .join('\n\n');
  return `\n\n[Context from Knowledge Base — use only if relevant to the user's message:\n${body}\n]`;
}

interface ChatRequestBody {
  chatId?: string;
  message: string;
  useSearch?: boolean;
}

function toGeminiHistory(history: { role: 'user' | 'ai'; content: string }[]): Content[] {
  return history.map((m) => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('GEMINI_API_KEY is not configured on the server.', { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return new Response('`message` is required.', { status: 400 });
  }

  await ensureUser(user);

  let chatId = body.chatId;
  if (chatId) {
    const owns = await assertChatOwnership(chatId, user.userId);
    if (!owns) return new Response('Not found', { status: 404 });
  } else {
    chatId = await createChat(user.userId);
  }

  // Load everything persisted so far, *before* this turn, plus any rolling
  // summary of exchanges already folded in.
  let ctx = await loadChatContext(chatId);
  const isFirstTurn = ctx.summarizedCount === 0 && ctx.messages.length === 0;

  // If the unsummarized tail has grown too long, fold its oldest slice into
  // the rolling summary before building the Gemini request.
  if (ctx.messages.length > SUMMARIZE_THRESHOLD) {
    const toFold = ctx.messages.slice(0, SUMMARIZE_CHUNK);
    try {
      const nextSummary = await summarizeMessages(toFold, ctx.summary, apiKey);
      if (nextSummary) {
        const nextCount = ctx.summarizedCount + toFold.length;
        await updateChatSummary(chatId, nextSummary, nextCount);
        ctx = {
          summary: nextSummary,
          summarizedCount: nextCount,
          messages: ctx.messages.slice(SUMMARIZE_CHUNK),
        };
      }
    } catch (summaryErr) {
      console.error('Summarization failed, continuing with full history:', summaryErr);
    }
  }

  const windowed: PersistedMessage[] = ctx.messages.slice(-HISTORY_WINDOW);
  const history = toGeminiHistory(windowed);

  await appendMessage(chatId, 'user', message);

  let prompt = message;
  if (body.useSearch) {
    try {
      const chunks = await vectorSearch(message, apiKey, 4);
      prompt = message + formatRetrievedContext(chunks);
    } catch (err) {
      console.error('Vector search failed, falling back to plain message:', err);
    }
  }

  const systemInstruction = ctx.summary
    ? `${SYSTEM_INSTRUCTION}\n\n[Long-term Memory — what has happened earlier in this conversation, for your reference only; do not quote it back verbatim:\n${ctx.summary}\n]`
    : SYSTEM_INSTRUCTION;

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction,
  });
  const chat = model.startChat({
    history,
    generationConfig: { temperature: 0.7 },
  });

  const encoder = new TextEncoder();
  const chatIdForStream = chatId;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let accumulated = '';
      try {
        const result = await chat.sendMessageStream(prompt);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            accumulated += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        if (accumulated) {
          await appendMessage(chatIdForStream, 'ai', accumulated);

          if (isFirstTurn) {
            try {
              const title = await generateChatTitle(message, accumulated, apiKey);
              if (title) await updateChatTitle(chatIdForStream, title);
            } catch (titleErr) {
              console.error('Title generation failed:', titleErr);
            }
          }
        }
        controller.close();
      } catch (err) {
        console.error('Gemini stream error:', err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Chat-Id': chatId,
    },
  });
}
