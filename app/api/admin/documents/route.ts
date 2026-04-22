import { getCurrentUser } from '@/lib/auth';
import { storeDocument } from '@/lib/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UploadBody {
  title?: string;
  content?: string;
}

// TODO: once real auth is wired up, gate this on an `admin` role rather than
// any authenticated user. For now any signed-in user may seed documents.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response('GEMINI_API_KEY is not configured on the server.', { status: 500 });
  }

  let body: UploadBody;
  try {
    body = (await request.json()) as UploadBody;
  } catch {
    return new Response('Invalid JSON body.', { status: 400 });
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title || !content) {
    return new Response('`title` and `content` are required.', { status: 400 });
  }

  try {
    const result = await storeDocument(title, content, apiKey);
    return Response.json(result);
  } catch (err) {
    console.error('Document upload failed:', err);
    return new Response('Failed to store document.', { status: 500 });
  }
}
