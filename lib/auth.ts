// Dummy auth. Swap getCurrentUser() to call Clerk's auth()/currentUser()
// when real authentication is wired up — consumers won't change.

export interface AuthUser {
  userId: string;
  name: string;
  imageUrl: string;
}

const DUMMY_USER: AuthUser = {
  userId: 'dummy-user-1',
  name: 'Demo User',
  imageUrl: 'https://picsum.photos/seed/profile/100/100',
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  return DUMMY_USER;
}
