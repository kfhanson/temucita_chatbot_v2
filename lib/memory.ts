import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PersistedMessage } from './chats';

const SUMMARY_MODEL = 'gemini-flash-latest';

const SUMMARY_SYSTEM_INSTRUCTION = `You maintain a rolling "Long-term Memory" for an ongoing mental-health chat.
Your job: fold new exchanges into the prior memory so the assistant can recall earlier context without replaying it verbatim.

Rules:
- Output ONE plain-text paragraph. No headings, no bullets, no preamble, no quotes.
- Preserve facts the user shared about themselves (name if given, situation, relationships, feelings, goals, coping strategies that worked, triggers).
- Preserve commitments, follow-ups, or promises either side made.
- Drop small talk and filler. Keep it under ~200 words.
- Write in the third person about the user ("The user mentioned...", "They felt...").
- If prior memory exists, integrate — do not list old and new separately.`;

function formatExchanges(messages: PersistedMessage[]): string {
  return messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n');
}

export async function summarizeMessages(
  messages: PersistedMessage[],
  priorSummary: string | null,
  apiKey: string,
): Promise<string> {
  if (messages.length === 0) return priorSummary ?? '';

  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: SUMMARY_MODEL,
    systemInstruction: SUMMARY_SYSTEM_INSTRUCTION,
  });

  const prompt = priorSummary
    ? `Prior long-term memory:\n${priorSummary}\n\nNew exchanges to fold in:\n${formatExchanges(messages)}\n\nReturn the updated long-term memory paragraph.`
    : `Exchanges to summarize:\n${formatExchanges(messages)}\n\nReturn the long-term memory paragraph.`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
  });

  const text = result.response.text().trim();
  return text || priorSummary || '';
}
