'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function getWebhookLogs(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autorizado');

  return await prisma.webhookLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
    take: 50 // Últimos 50 logs para não pesar
  });
}

export async function clearWebhookLogs(workspaceId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error('Não autorizado');

  return await prisma.webhookLog.deleteMany({
    where: { workspaceId }
  });
}
