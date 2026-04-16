import prisma from '@/lib/prisma';

export async function saveMessageToHistory(
    workspaceId: string,
    leadId: string,
    connectionId: string,
    direction: 'INBOUND' | 'OUTBOUND',
    type: string,
    content: string,
    externalId: string | null = null,
    contactName: string | null = null,
    avatarUrl: string | null = null,
    rawPayload: string | null = null
) {
    try {
        // Assegura a existência do Lead. Usamos upsert para evitar race condition (ID duplicado)
        const initialName = direction === 'INBOUND' ? (contactName || 'Lead Sem Nome') : 'Lead Sem Nome';

        let lead = await prisma.leadIdentity.upsert({
            where: { id: leadId },
            update: {}, // Não sobrescrevemos dados sensíveis aqui, apenas garantimos que existe
            create: {
                id: leadId,
                workspaceId,
                name: initialName,
                avatarUrl: avatarUrl || null,
                score: 0
            }
        });

        // Só atualizamos o nome se for uma mensagem RECEBIDA (INBOUND), pois pushName em mensagens enviadas é o nome da instância/empresa
        if (direction === 'INBOUND' && contactName) {
            const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { name: true } });
            const currentName = lead.name || '';
            const isGeneric = currentName === 'Lead Sem Nome' ||
                currentName === workspace?.name ||
                currentName.includes('Lead #') ||
                currentName.match(/^\d+$/);

            if (isGeneric && contactName !== currentName) {
                lead = await prisma.leadIdentity.update({
                    where: { id: leadId },
                    data: { name: contactName }
                });
            }
        }

        if (avatarUrl && !lead.avatarUrl) {
            await prisma.leadIdentity.update({
                where: { id: leadId },
                data: { avatarUrl }
            });
        }

        // Armazena a mensagem
        await prisma.message.create({
            data: {
                workspaceId,
                leadId,
                connectionId,
                direction,
                type,
                content,
                externalId,
                rawPayload,
                status: direction === 'INBOUND' ? 'DELIVERED' : 'SENT'
            }
        });

        console.log(`[STORAGE] Gravada msg ${direction} em Lead: ${leadId}`);

        // Dispara a Inteligência em Background (Fase 5)
        import('@/lib/intelligence-engine').then((m: any) => {
            m.processLeadIntelligence(workspaceId, leadId, content);
        });

    } catch (err) {
        console.error('[STORAGE Error] Falha ao arquivar mensagem', err);
    }
}
