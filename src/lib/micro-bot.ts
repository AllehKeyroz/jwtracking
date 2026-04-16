import prisma from '@/lib/prisma';
import crypto from 'crypto';

/**
 * Função Core do Micro-Bot (Fase 4.4).
 * Envia mensagens automáticas contendo links de armadilha (In-App WebView).
 * Isso serve como "Fallback de Ouro" caso o Lead tenha perdido o Hash original na primeira janela.
 * Ao clicar no link de dentro do WhatsApp, a WebView nativa abre e extrai a identidade.
 */
export async function sendWelcomeTrackingMessage(
    workspaceId: string,
    phone: string, // 5511999999999
    contactName: string,
    provider: 'EVOLUTION' | 'WABA',
    connectionId: string
) {
    try {
        // 1. Pega os dados da Conexão para podermos chamar as APIs originárias
        const connection = await prisma.whatsAppConnection.findUnique({
            where: { id: connectionId }
        });

        if (!connection || !connection.isActive || !connection.token) {
            console.log('[MicroBot] Conexão desativada ou sem Token. Ignorando resposta.');
            return false;
        }

        // 2. Busca o Domínio do Cliente para montar a URL
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        const baseUrl = workspace?.customDomain ? `https://${workspace.customDomain}` : 'https://app.kdstracker.com';

        // Criptografamos o telefone rápido via Base64 só pra não ficar feio na URL
        const securePayload = Buffer.from(phone).toString('base64');
        const trapLink = `${baseUrl}/go/auth-${securePayload}`;

        const messageText = `Olá ${contactName}! Que bom te ver por aqui.\n\nPara agilizarmos seu atendimento de forma segura, por favor clique no link abaixo para validar seu acesso:\n\n🔗 ${trapLink}\n\n*Atendimento Automático*`;

        // 3. Disparo EVOLUTION API
        if (provider === 'EVOLUTION' && connection.instanceId) {
            // No Evolution o formato é /message/sendText/{{instanceName}}
            // (Considerando a base url padrão num .env ficticio, ou se o token = apiUrl|apiKey)
            // Aqui simularemos a chamada estrutural padrão da doc do Evo:
            // evolution_url: porta / sendText / instancia

            // Como não temos a URL do Evo no schema, vamos assumir que o TOKEN aqui guardou "URL|APIKEY"
            // Ex: "https://evo.meuservidor.com|B629X1..."
            const [urlEvo, apiEvo] = connection.token.split('|');

            if (urlEvo && apiEvo) {
                await fetch(`${urlEvo}/message/sendText/${connection.instanceId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiEvo
                    },
                    body: JSON.stringify({
                        number: phone,
                        options: {
                            delay: 1200,
                            presence: 'composing'
                        },
                        textMessage: {
                            text: messageText
                        }
                    })
                });
                console.log(`[MicroBot - EVO] Mensagem Ponte enviada para ${phone}`);
            }
        }

        // 4. Disparo WABA OFICIAL (Meta Graph)
        if (provider === 'WABA' && connection.instanceId) {
            // WABA Phone ID é o instanceId. Token é o token long-lived do app
            const graphUrl = `https://graph.facebook.com/v20.0/${connection.instanceId}/messages`;

            await fetch(graphUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${connection.token}`
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: phone,
                    type: "text",
                    text: {
                        preview_url: true, // Força mostrar o cartão do site (Gera WebView)
                        body: messageText
                    }
                })
            });
            console.log(`[MicroBot - WABA] Mensagem Ponte enviada para ${phone}`);
        }

        return true;

    } catch (err) {
        console.error('[MicroBot Error] Falha ao disparar resposta automática:', err);
        return false;
    }
}
