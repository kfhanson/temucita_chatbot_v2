import { getCurrentUser } from '@/lib/auth';
import { ensureUser, listChats } from '@/lib/chats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  await ensureUser(user);
  const chats = await listChats(user.userId);
  return Response.json({ chats });
}
