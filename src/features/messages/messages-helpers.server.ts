'use server';

import { createMessage } from '@/actions/messages';
import { auth } from '../../../auth';
import { getCurrentUser } from '../auth/user-auth-session-model.server';
import { revalidatePath } from 'next/cache';

export const createMessageForCurrentUser = async ({
  role,
  message,
}: {
  role: 'user' | 'assistant';
  message: string;
}) => {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized');
  }
  const user = await getCurrentUser(session);

  await createMessage({
    role,
    userId: user?.id as string,
    content: message,
  });
  revalidatePath('/dashboard');
};
