'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function getRecentTrackingData() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return { clicks: [], fingerprints: [] };

    const workspaceId = session.user.workspaceId;

    const clicks = await prisma.clickSession.findMany({
        where: { workspaceId },
        orderBy: { clickedAt: 'desc' },
        take: 20,
        include: {
            fingerprint: true
        }
    });

    const fingerprints = await prisma.deviceFingerprint.findMany({
        orderBy: { lastSeen: 'desc' },
        take: 10
    });

    return { clicks, fingerprints };
}

export async function deleteClickSession(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    await prisma.clickSession.delete({
        where: { id: id, workspaceId: session.user.workspaceId }
    });

    revalidatePath('/dashboard/analytics');
}

export async function deleteFingerprint(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    // Limpa o matchedHash de qualquer Lead atrelado a este hardware antes de apagar
    await prisma.leadIdentity.updateMany({
        where: { matchedHash: id, workspaceId: session.user.workspaceId },
        data: { matchedHash: null }
    });

    await prisma.deviceFingerprint.delete({
        where: { id }
    });

    const { revalidatePath } = await import("next/cache");
    revalidatePath('/dashboard/analytics');
}
