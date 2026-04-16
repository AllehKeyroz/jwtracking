import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import LogsView from './LogsView';

export default async function LogsPage({ searchParams }: { searchParams: { workspaceId?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  let workspaceId = searchParams.workspaceId;

  if (!workspaceId) {
    // Busca o primeiro workspace vinculado a este usuário
    const workspaceAccount = await prisma.workspaceUser.findFirst({
      where: { userId: (session.user as any).id }
    });
    workspaceId = workspaceAccount?.workspaceId;
  }

  if (!workspaceId) redirect('/dashboard');

  return (
    <div className="p-6">
      <LogsView workspaceId={workspaceId} />
    </div>
  );
}
