import { getCurrentUser } from '@/lib/auth';
import { loadChat, deleteChat } from '@/lib/chats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await ctx.params;
  const chat = await loadChat(id, user.userId);
  if (!chat) return new Response('Not found', { status: 404 });

  return Response.json({ chat });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await ctx.params;
  const deleted = await deleteChat(id, user.userId);
  if (!deleted) return new Response('Not found', { status: 404 });

  return new Response(null, { status: 204 });
}
