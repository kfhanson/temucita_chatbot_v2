import { GoogleGenerativeAI } from '@google/generative-ai';

const TITLE_SYSTEM_INSTRUCTION = `You generate short, neutral titles for mental-health chat sessions.
Given the user's first message and the assistant's reply, respond with a single title of 2–5 words.
No quotes, no punctuation at the end, no emojis, no labels like "Title:". Title case. Plain text only.`;

const MAX_TITLE_CHARS = 60;

export async function generateChatTitle(
  userMessage: string,
  aiMessage: string,
  apiKey: string,
): Promise<string | null> {
  const ai = new GoogleGenerativeAI(apiKey);
  const model = ai.getGenerativeModel({
    model: 'gemini-flash-latest',
    systemInstruction: TITLE_SYSTEM_INSTRUCTION,
  });

  const prompt = `User: ${userMessage}\n\nAssistant: ${aiMessage}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 100,
    },
  });

  const raw = result.response.text().trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .split('\n')[0]
    .trim();

  if (!cleaned) return null;
  return cleaned.slice(0, MAX_TITLE_CHARS);
}
