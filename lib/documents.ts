import { db } from './db';
import { embedDocument, embedQuery } from './embeddings';

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

export interface RetrievedChunk {
  content: string;
  documentTitle: string;
  distance: number;
}

function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= CHUNK_SIZE) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);
    let slice = normalized.slice(start, end);

    // If not at the end, try to break on a paragraph or sentence boundary
    // within the last 200 chars of the chunk, to avoid cutting mid-sentence.
    if (end < normalized.length) {
      const tail = slice.slice(-200);
      const paraBreak = tail.lastIndexOf('\n\n');
      const sentBreak = Math.max(tail.lastIndexOf('. '), tail.lastIndexOf('? '), tail.lastIndexOf('! '));
      const breakOffset = paraBreak >= 0 ? paraBreak : sentBreak;
      if (breakOffset > 0) {
        slice = slice.slice(0, slice.length - 200 + breakOffset + 1);
      }
    }

    const cleaned = slice.trim();
    if (cleaned) chunks.push(cleaned);

    if (end >= normalized.length) break;
    start += slice.length - CHUNK_OVERLAP;
    if (start <= 0) start = end;
  }
  return chunks;
}

function toPgVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}

export async function storeDocument(
  title: string,
  content: string,
  apiKey: string,
): Promise<{ documentId: string; chunkCount: number }> {
  const chunks = chunkText(content);
  if (chunks.length === 0) {
    throw new Error('Document has no content after normalization.');
  }

  const embeddings = await Promise.all(chunks.map((c) => embedDocument(c, apiKey)));

  const doc = await db.document.create({
    data: { title },
    select: { id: true },
  });

  for (let i = 0; i < chunks.length; i++) {
    const vecLiteral = toPgVectorLiteral(embeddings[i]);
    await db.$executeRaw`
      INSERT INTO "DocumentChunk" ("id", "documentId", "chunkIndex", "content", "embedding", "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${doc.id},
        ${i},
        ${chunks[i]},
        ${vecLiteral}::vector,
        NOW()
      )
    `;
  }

  return { documentId: doc.id, chunkCount: chunks.length };
}

export async function vectorSearch(
  query: string,
  apiKey: string,
  limit: number = 4,
): Promise<RetrievedChunk[]> {
  const queryVec = await embedQuery(query, apiKey);
  const vecLiteral = toPgVectorLiteral(queryVec);

  const rows = await db.$queryRaw<
    Array<{ content: string; title: string; distance: number }>
  >`
    SELECT
      c."content"        AS content,
      d."title"          AS title,
      c."embedding" <=> ${vecLiteral}::vector AS distance
    FROM "DocumentChunk" c
    JOIN "Document" d ON d."id" = c."documentId"
    ORDER BY c."embedding" <=> ${vecLiteral}::vector
    LIMIT ${limit}
  `;

  return rows.map((r: { content: string; title: string; distance: number }) => ({
    content: r.content,
    documentTitle: r.title,
    distance: Number(r.distance),
  }));
}
