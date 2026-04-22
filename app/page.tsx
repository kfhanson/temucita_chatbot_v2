import { getCurrentUser } from '@/lib/auth';
import ChatApp from './components/ChatApp';

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-main font-sans">
        <p className="text-text-main">Please sign in to continue.</p>
      </div>
    );
  }

  return <ChatApp user={user} />;
}
