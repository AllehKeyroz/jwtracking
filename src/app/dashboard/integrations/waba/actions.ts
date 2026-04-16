'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveWabaConnection(data: {
    name: string;
    accountId: string;
    token: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    // Upsert da conexão WABA para este workspace
    // Usamos o accountId como critério ou apenas substituímos a existente se houver apenas uma?
    // Frequentemente usuários podem querer mais de um número, mas para simplicidade agora vamos atualizar/criar por nome+workspace

    await prisma.whatsAppConnection.upsert({
        where: { id: `waba_${session.user.workspaceId}` }, // ID determinístico para simplificar atualização
        update: {
            name: data.name,
            instanceId: data.accountId,
            token: data.token,
            isActive: true,
        },
        create: {
            id: `waba_${session.user.workspaceId}`,
            workspaceId: session.user.workspaceId,
            name: data.name,
            provider: 'WABA',
            instanceId: data.accountId,
            token: data.token,
            isActive: true,
        },
    });

    revalidatePath('/dashboard/integrations');
    return { success: true };
}

export async function getWabaConnection() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return null;

    return await prisma.whatsAppConnection.findFirst({
        where: {
            workspaceId: session.user.workspaceId,
            provider: 'WABA'
        }
    });
}
