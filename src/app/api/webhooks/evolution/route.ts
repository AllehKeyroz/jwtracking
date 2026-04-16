import { NextResponse } from 'next/server';
import { processIncomingLead } from '@/lib/identity-matcher';
import prisma from '@/lib/prisma';
import { saveMessageToHistory } from '@/lib/message-history';
import { revalidatePath } from 'next/cache';
import { logWebhook } from '@/lib/webhook-logger';

async function fetchEvolutionContactInfo(baseUrl: string, apiKey: string, instance: string, number: string) {
    try {
        const res = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify({ number })
        });
        const data = await res.json();
        return {
            profilePictureUrl: data.profilePictureUrl || data.url || null
        };
    } catch (e) {
        console.error('Erro ao buscar foto do contato:', e);
        return { profilePictureUrl: null };
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // O URL será algo como /api/webhooks/evolution?workspaceKey=cuidxyz
        // Na vida real o cara põe esse parametro na plataforma de disparo Evo
        const { searchParams } = new URL(req.url);
        const workspaceKey = searchParams.get('workspaceKey');

        // Registro de LOG UNIVERSAL (Mesmo se der erro depois)
        await logWebhook('EVOLUTION', body, workspaceKey);

        if (!workspaceKey) {
            return NextResponse.json({ error: 'Falta parametro WorkspaceKey' }, { status: 400 });
        }

        // Tenta achar a conexão para garantir que ela exista (Ignorando o Gateway Master vazio)
        const instanceName = body?.instance;

        const connection = await prisma.whatsAppConnection.findFirst({
            where: {
                workspaceId: workspaceKey,
                provider: 'EVOLUTION',
                isActive: true,
                ...(instanceName ? { instanceId: instanceName } : { instanceId: { not: 'master_setup' } })
            }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Nenhum Webhook "EVOLUTION" Configurado Neste Workspace' }, { status: 401 });
        }

        // Fast Return/Acknowledge pra API Evolution não sobrecarregar
        NextResponse.json({ status: 'Acknowledge Evolution OK' }, { status: 200 });

        console.log('--- [EVOLUTION WEBHOOK RECEBIDO] --- EVENTO:', body?.event);
        console.log(JSON.stringify(body, null, 2));

        // Validação básica do Payload Evolution
        if (body?.event === 'messages.upsert' || body?.event === 'MESSAGES_UPSERT') {
            const data = body.data;
            if (data?.key && data?.message) {
                // remoteJid é o número Ex: 5511999999999@s.whatsapp.net
                const remoteJid = data.key.remoteJid as string;
                if (!remoteJid || !remoteJid.includes('@s.whatsapp.net')) return NextResponse.json({ ok: true });

                const cleanPhone = remoteJid.replace('@s.whatsapp.net', '');
                const contactName = data.pushName || null;
                const fromMe = data.key.fromMe;
                const msgId = data.key.id;

                // Extrai Texto Base ou Legendas (Obriga extração de Mídia)
                let messageBody = '';
                if (data.message.conversation) messageBody = data.message.conversation;
                else if (data.message.extendedTextMessage?.text) messageBody = data.message.extendedTextMessage.text;
                else if (data.message.imageMessage?.caption) messageBody = data.message.imageMessage.caption;
                else if (data.message.videoMessage?.caption) messageBody = data.message.videoMessage.caption;

                // 2 - Identifica Tipo de Mídia para o Cerebro da IA ignorar ou focar
                let type = 'TEXT';
                if (data.message.imageMessage) type = 'IMAGE';
                if (data.message.videoMessage) type = 'VIDEO';
                if (data.message.audioMessage) type = 'AUDIO';
                if (data.message.documentMessage) type = 'DOCUMENT';

                // Tenta enriquecer dados (Avatar) para novos Leads
                let avatarUrl = null;
                const [baseUrl, apiKey] = (connection.token || "").split('|');
                if (!fromMe && baseUrl && apiKey) {
                    const contactInfo = await fetchEvolutionContactInfo(baseUrl, apiKey, connection.instanceId!, cleanPhone);
                    avatarUrl = contactInfo.profilePictureUrl;
                }

                // Arquiva Histórico Permanentemente para a Fase 5 (IA MESTRA) LER!
                if (messageBody || type !== 'TEXT') {
                    // AGORA: Esperamos a gravação terminar antes de seguir
                    await saveMessageToHistory(
                        workspaceKey,
                        cleanPhone,
                        connection.id,
                        fromMe ? 'OUTBOUND' : 'INBOUND',
                        type,
                        messageBody,
                        msgId,
                        contactName,
                        avatarUrl,
                        JSON.stringify(body) // Passa o payload bruto para auditoria
                    );
                }

                // Se for INBOUND (Dele pra Nós), roda o Cérebro Fuzzy de Matching
                if (!fromMe) {
                    await processIncomingLead(
                        workspaceKey,
                        cleanPhone,
                        contactName,
                        messageBody,
                        connection.id,
                        'EVOLUTION',
                        avatarUrl
                    );
                }

                // Força o Next.js a atualizar a lista de conversas em tempo real
                revalidatePath('/dashboard/conversations');
            }
        }

        return NextResponse.json({ status: 'Processed' }, { status: 200 });

    } catch (err) {
        console.error('Fatal Webhook Evolution Error:', err);
        return NextResponse.json({ error: 'System Error Evolution' }, { status: 500 });
    }
}
