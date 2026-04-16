import prisma from '@/lib/prisma';
import { sendWelcomeTrackingMessage } from '@/lib/micro-bot';

/**
 * Função Core do Algoritmo "Fuzzy Hardware Matching" (Fase 4.3).
 * Responsável por ingerir a mensagem e decidir se este número de WhatsApp (telefone fisico)
 * já tem um rastro no DeviceFingerprint.
 */
export async function processIncomingLead(
    workspaceId: string,
    phone: string,
    contactName: string | null = null,
    messageBody: string | null = null,
    connectionId?: string,
    provider?: 'EVOLUTION' | 'WABA',
    avatarUrl?: string | null
) {
    try {
        // 1. O número cru entra. Exemplo: 5511999999999.
        // Usamos upsert para evitar que chamadas simultâneas (webhook + history) tentem criar o mesmo ID.
        let isNewLead = false;

        // Verificamos se existe antes apenas para definir se é novo e disparar o MicroBot depois
        let lead = await prisma.leadIdentity.findUnique({ where: { id: phone } });
        if (!lead) isNewLead = true;

        lead = await prisma.leadIdentity.upsert({
            where: { id: phone },
            update: {
                // Se o avatar chegou agora e não tinhamos, atualizamos
                ...(avatarUrl && !lead?.avatarUrl ? { avatarUrl } : {})
            },
            create: {
                id: phone,
                workspaceId,
                name: contactName || 'Lead Sem Nome',
                avatarUrl: avatarUrl || null,
                score: 0,
                matchedHash: null
            }
        });

        // Se o nome atual do Lead for genérico ou igual ao nome do Workspace, e temos um contactName, atualizamos.
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
        const currentName = lead.name || '';
        const nameIsGeneric = currentName === 'Lead Sem Nome' ||
            currentName === workspace?.name ||
            currentName.includes('Lead #') ||
            currentName.match(/^\d+$/); // Apenas números

        if (contactName && nameIsGeneric && contactName !== currentName) {
            lead = await prisma.leadIdentity.update({
                where: { id: phone },
                data: { name: contactName }
            });
            console.log(`[IDENTITY UPDATE] Nome do lead ${phone} atualizado para ${contactName}`);
        }

        // 2. Se a identidade do Lead JÁ FOI MAPEADA contra um Hash, não fazemos o Overwrite
        if (lead.matchedHash) {
            return lead;
        }

        // 3. MAGIC MATCHING (The Fuzzy Alg)
        const THIRTY_MINUTES_MS = 30 * 60 * 1000;
        const now = new Date();
        const pastWindow = new Date(now.getTime() - THIRTY_MINUTES_MS);

        const recentClicks = await prisma.clickSession.findMany({
            where: {
                workspaceId: workspaceId,
                clickedAt: {
                    gte: pastWindow,
                    lte: now
                }
            },
            orderBy: {
                clickedAt: 'desc'
            },
            take: 10
        });

        if (recentClicks.length > 0) {
            const bestMatch = recentClicks[0];

            lead = await prisma.leadIdentity.update({
                where: { id: phone },
                data: {
                    matchedHash: bestMatch.fingerprintHash,
                    score: 1.0
                }
            });

            console.log(`[IDENTITY MATCHED] Lead ${phone} amarrado com sucesso ao Hardware ${bestMatch.fingerprintHash} | Origem Ping: ${bestMatch.trafficSource}`);
        } else {
            console.log(`[IDENTITY LOST] Lead ${phone} mandou msg, mas ZERO rastro do PIXEL no limite de 30 minutos.`);

            // ==========================================
            // 4. MICRO-BOT FALLBACK DE OURO (Fase 4.4)
            // Se falhou no Match passivo, vamos forçar a Identidade 
            // enviando o link In-App WebView.
            // ==========================================
            if (isNewLead && connectionId && provider) {
                console.log(`[MicroBot Trigger] Tentando forçar Fixação de Hash In-App para ${phone}`);
                await sendWelcomeTrackingMessage(workspaceId, phone, contactName || 'Cliente', provider, connectionId);
            }
        }

        return lead;
    } catch (err) {
        console.error('[KDS Tracker Error] Falha brutal no Identity Matcher:', err);
        return null;
    }
}
