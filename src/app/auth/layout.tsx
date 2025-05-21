import { redirect } from 'next/navigation';
import { auth } from '../../../auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  console.log('Session:', session);

  if (session) {
    return redirect('/dashboard');
  }

  return <>{children}</>;
}
