import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

export const EMBEDDING_DIMENSIONS = 768;
const EMBEDDING_MODEL = 'text-embedding-004';

function getModel(apiKey: string) {
  const ai = new GoogleGenerativeAI(apiKey);
  return ai.getGenerativeModel({ model: EMBEDDING_MODEL });
}

export async function embedDocument(text: string, apiKey: string): Promise<number[]> {
  const model = getModel(apiKey);
  const res = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return res.embedding.values;
}

export async function embedQuery(text: string, apiKey: string): Promise<number[]> {
  const model = getModel(apiKey);
  const res = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return res.embedding.values;
}
