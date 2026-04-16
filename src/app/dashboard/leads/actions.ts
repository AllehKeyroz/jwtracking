'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLeadsList() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return [];

    const leads = await prisma.leadIdentity.findMany({
        where: { workspaceId: session.user.workspaceId },
        orderBy: [
            { score: 'desc' },
            { createdAt: 'desc' }
        ],
        include: {
            messages: {
                orderBy: { timestamp: 'desc' },
                take: 1
            }
        }
    });

    return leads.map((l: any) => ({
        id: l.id,
        name: l.name,
        avatarUrl: l.avatarUrl,
        score: l.score,
        matchedHash: l.matchedHash,
        createdAt: l.createdAt,
        lastMessageAt: l.messages[0] ? l.messages[0].timestamp : null,
        aiIntentLevel: l.aiIntentLevel,
        aiDealClosed: l.aiDealClosed,
        aiValueFloat: l.aiValueFloat,
    }));
}

export async function deleteLead(leadId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    await prisma.leadIdentity.delete({
        where: { id: leadId, workspaceId: session.user.workspaceId }
    });

    revalidatePath('/dashboard/leads');
}

export async function getLeadHistory(leadId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const lead = await prisma.leadIdentity.findUnique({
        where: { id: leadId, workspaceId: session.user.workspaceId }
    });

    if (!lead || !lead.matchedHash) return [];

    // Busca todos os cliques deste dispositivo no workspace
    const history = await prisma.clickSession.findMany({
        where: {
            workspaceId: session.user.workspaceId,
            fingerprintHash: lead.matchedHash
        },
        orderBy: { clickedAt: 'desc' },
        take: 100
    });

    return history;
}
