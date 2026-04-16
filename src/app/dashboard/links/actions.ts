'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getLinks() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return [];

    return prisma.shortLink.findMany({
        where: { workspaceId: session.user.workspaceId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createLink(data: { slug: string, destinationUrl: string, rotatorUrls?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (!cleanSlug) throw new Error("Slug inválido.");

    const existing = await prisma.shortLink.findUnique({ where: { slug: cleanSlug } });
    if (existing) throw new Error("Este slug (link) já está em uso no sistema.");

    try {
        console.log(`[LINK CREATE] Tentando criar slug: ${cleanSlug} no workspace: ${session.user.workspaceId}`);

        // Usamos create diretamente, o try/catch cuidará de erros de banco
        const newLink = await prisma.shortLink.create({
            data: {
                workspaceId: session.user.workspaceId,
                slug: cleanSlug,
                destinationUrl: data.destinationUrl,
                rotatorUrls: data.rotatorUrls || null
            }
        });

        console.log(`[LINK CREATE SUCCESS] Slug: ${cleanSlug}, ID: ${newLink.id}`);
    } catch (e: any) {
        console.error("Link Create Error Details:", e);
        if (e.code === 'P2002') throw new Error("Este slug já existe.");
        throw new Error(`Falha no Banco: ${e.message}`);
    }

    revalidatePath('/dashboard/links');
}

export async function deleteLink(id: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    try {
        console.log(`[LINK DELETE] Tentando remover ID: ${id} no workspace: ${session.user.workspaceId}`);

        const result = await prisma.shortLink.deleteMany({
            where: {
                id: id,
                workspaceId: session.user.workspaceId
            }
        });

        if (result.count === 0) {
            throw new Error("Link não encontrado ou você não tem permissão.");
        }

        console.log(`[LINK DELETE SUCCESS] ID: ${id}`);
    } catch (e: any) {
        console.error("Link Delete Error Details:", e);
        throw new Error(e.message || "Falha ao remover o link.");
    }

    revalidatePath('/dashboard/links');
}

export async function getLinkAudience(slug: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    // 1. Buscar as sessões de clique para este slug (via workspace para segurança)
    const clicks = await prisma.clickSession.findMany({
        where: {
            workspaceId: session.user.workspaceId,
            linkSlug: slug
        },
        orderBy: { clickedAt: 'desc' },
        take: 50, // Limite para performance
        include: {
            fingerprint: true
        }
    });

    // 2. Para cada clique, tentar encontrar um Lead e calcular engajamento
    const audience = await Promise.all(clicks.map(async (click) => {
        // Busca o Lead Matched
        const lead = await prisma.leadIdentity.findFirst({
            where: {
                workspaceId: session.user.workspaceId,
                matchedHash: click.fingerprintHash
            }
        });

        // Contagem de Links Únicos que este hdid já clicou
        const uniqueLinksClicked = await prisma.clickSession.groupBy({
            by: ['linkSlug'],
            where: {
                workspaceId: session.user.workspaceId,
                fingerprintHash: click.fingerprintHash
            }
        });

        return {
            id: click.id,
            clickedAt: click.clickedAt,
            fingerprintHash: click.fingerprintHash,
            trafficSource: click.trafficSource,
            utmMedium: click.utmMedium,
            utmCampaign: click.utmCampaign,
            utmTerm: click.utmTerm,
            utmContent: click.utmContent,
            distinctLinksCount: uniqueLinksClicked.length,
            lead: lead ? {
                id: lead.id,
                name: lead.name,
                avatarUrl: lead.avatarUrl
            } : null
        };
    }));

    return audience;
}
