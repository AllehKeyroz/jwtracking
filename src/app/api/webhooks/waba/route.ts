import { NextResponse } from 'next/server';
import { processIncomingLead } from '@/lib/identity-matcher';
import prisma from '@/lib/prisma';
import { logWebhook } from '@/lib/webhook-logger';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === 'kds_waba_godmode') {
        console.log('WEBHOOK WABA VERIFIED OK');
        return new NextResponse(challenge, { status: 200 }); // Retorna só texto (Meta manda)
    }

    return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { searchParams } = new URL(req.url);
        const workspaceKey = searchParams.get('workspaceKey');

        // Registro de LOG UNIVERSAL (WABA)
        await logWebhook('WABA', body, workspaceKey);

        if (!workspaceKey) {
            return NextResponse.json({ error: 'Falta parametro WorkspaceKey' }, { status: 400 });
        }

        // Validação da Instância do Cloud API
        const connection = await prisma.whatsAppConnection.findFirst({
            where: {
                workspaceId: workspaceKey,
                provider: 'WABA',
                isActive: true
            }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Webhook WABA não Configurado' }, { status: 401 });
        }

        // Validar e Desconstruir JSON Massivo do WABA Cloud API
        if (body.object === 'whatsapp_business_account' && body.entry) {
            for (const entry of body.entry) {
                // Checa se as configurações dessa entrada vieram na raiz do message
                if (entry.changes && entry.changes[0]?.value?.messages) {
                    const messageInfo = entry.changes[0].value.messages[0];
                    if (!messageInfo) continue;

                    const contactInfo = entry.changes[0].value.contacts?.[0];
                    const phone = messageInfo.from; // Número CRU ex: 5511999999999
                    const name = contactInfo?.profile?.name || 'WABA Lead';
                    const msgId = messageInfo.id;

                    let text = '';
                    let type = 'TEXT';

                    if (messageInfo.type === 'text') text = messageInfo.text.body;
                    else if (messageInfo.type === 'button') text = messageInfo.button.text;
                    else if (messageInfo.type === 'interactive') text = messageInfo.interactive?.button_reply?.title || messageInfo.interactive?.list_reply?.title || '';
                    else if (messageInfo.type === 'image') { type = 'IMAGE'; text = messageInfo.image?.caption || ''; }
                    else if (messageInfo.type === 'video') { type = 'VIDEO'; text = messageInfo.video?.caption || ''; }
                    else if (messageInfo.type === 'audio') { type = 'AUDIO'; }
                    else if (messageInfo.type === 'document') { type = 'DOCUMENT'; }

                    // Log do Payload Completo para depuração
                    console.log(`[WABA PAYLOAD] De: ${phone} | Corpo:`, JSON.stringify(body, null, 2));

                    // Armazena no Histórico da IA com o Payload Bruto
                    import('@/lib/message-history').then(m => {
                        m.saveMessageToHistory(
                            workspaceKey,
                            phone,
                            connection.id,
                            'INBOUND',
                            type,
                            text,
                            msgId,
                            name,
                            null, // avatarUrl
                            JSON.stringify(body) // rawPayload
                        );
                    });

                    // Chama a Função Central de Rastreio (Pixels e Matching)
                    if (text) {
                        processIncomingLead(
                            workspaceKey,
                            phone,
                            name,
                            text,
                            connection.id,
                            'WABA'
                        );
                    }
                }
            }
        }

        return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } catch (err) {
        console.error('Meta WABA Webhook Error:', err);
        return NextResponse.json({ error: 'Motor Meta Inválido' }, { status: 500 });
    }
}
