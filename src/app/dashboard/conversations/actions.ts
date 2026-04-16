'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { analyzeLeadConversation } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

export async function getConversationLeads() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return [];

    // Busca Leads que possuem mensagens vinculadas a ESTE Workspace
    // Isso resolve o problema de Leads "presos" a outros workspaces
    const leads = await prisma.leadIdentity.findMany({
        where: {
            messages: {
                some: {
                    workspaceId: session.user.workspaceId
                }
            }
        },
        include: {
            messages: {
                orderBy: { timestamp: 'desc' },
                take: 1 // Só precisamos do preview da ultima pra mostrar na lista
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // 2. Mapear leads e buscar a origem do tráfego via matchedHash
    const results = await Promise.all(leads.map(async (l: any) => {
        let trafficSource = 'Orgânico';

        if (l.matchedHash) {
            const lastClick = await prisma.clickSession.findFirst({
                where: { fingerprintHash: l.matchedHash, workspaceId: session.user.workspaceId },
                orderBy: { clickedAt: 'desc' }
            });
            if (lastClick) {
                trafficSource = lastClick.trafficSource || lastClick.utmCampaign || 'Direto';
            }
        }

        return {
            id: l.id,
            name: l.name,
            score: l.score,
            lastMessage: l.messages[0] ? l.messages[0].content || l.messages[0].type : '',
            lastUpdate: l.messages[0] ? l.messages[0].timestamp : l.createdAt,
            avatarUrl: l.avatarUrl,
            trafficSource,
            // AI Fields
            aiIntentLevel: l.aiIntentLevel,
            aiDealClosed: l.aiDealClosed,
            aiValueFloat: l.aiValueFloat,
            aiLossReason: l.aiLossReason
        };
    }));

    return results.sort((a: any, b: any) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
}

export async function getLeadMessages(leadId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return [];

    const messages = await prisma.message.findMany({
        where: {
            workspaceId: session.user.workspaceId,
            leadId
        },
        orderBy: {
            timestamp: 'asc'
        }
    });

    return messages;
}

export async function sendMessageToLead(leadId: string, text: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const workspaceId = session.user.workspaceId;

    // Buscar a ultima conexao valida usada com esse Lead
    const lastMsg = await prisma.message.findFirst({
        where: {
            workspaceId,
            leadId,
            connection: {
                instanceId: { not: 'master_setup' }
            }
        },
        orderBy: { timestamp: 'desc' },
        include: { connection: true }
    });

    let conn = lastMsg?.connection;

    // Se não houver histórico válido com esse número (ex: corrompido pelo master_setup), pega o 1º celular conectado
    if (!conn) {
        const fallbackConn = await prisma.whatsAppConnection.findFirst({
            where: {
                workspaceId,
                isActive: true,
                provider: 'EVOLUTION',
                instanceId: { not: 'master_setup' }
            }
        });

        if (!fallbackConn) {
            throw new Error("Nenhuma instância válida de WhatsApp conectada no seu Workspace.");
        }

        conn = fallbackConn as any;
    }

    if (conn.provider === 'EVOLUTION') {
        const [url, apiKey] = conn.token!.split('|');
        const apiInstanceId = conn.instanceId;

        const res = await fetch(`${url}/message/sendText/${apiInstanceId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
            },
            body: JSON.stringify({
                number: leadId,
                options: { delay: 1200, presence: 'composing' },
                text: text
            })
        });

        if (!res.ok) {
            console.error("Erro Evolution Send:", await res.text());
            throw new Error("Falha ao enviar mensagem pela Evolution.");
        }

        const data = await res.json();
        const msgId = data?.key?.id || null;

        await prisma.message.create({
            data: {
                workspaceId,
                leadId,
                connectionId: conn.id,
                direction: 'OUTBOUND',
                type: 'TEXT',
                content: text,
                externalId: msgId,
                status: 'SENT'
            }
        });

        return { success: true };
    }

    // Suporte para WABA Futuro via Cloud API do Meta
    if (conn.provider === 'WABA') {
        throw new Error("Envio manual no painel via Cloud API do Meta ainda não configurado.");
    }

    throw new Error("Provedor não suportado.");
}

export async function updateLeadName(leadId: string, name: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    await prisma.leadIdentity.update({
        where: { id: leadId, workspaceId: session.user.workspaceId },
        data: { name }
    });

    return { success: true };
}

export async function refreshLeadProfile(leadId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const workspaceId = session.user.workspaceId;

    // Buscar a conexão Evolution ativa
    const connection = await prisma.whatsAppConnection.findFirst({
        where: {
            workspaceId,
            provider: 'EVOLUTION',
            isActive: true,
            instanceId: { not: 'master_setup' }
        }
    });

    if (!connection || !connection.token) {
        throw new Error("Nenhuma conexão Evolution validada para este workspace.");
    }

    const [baseUrl, apiKey] = connection.token.split('|');
    const instance = connection.instanceId;

    try {
        // 1. Buscar Foto
        const picRes = await fetch(`${baseUrl}/chat/fetchProfilePictureUrl/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify({ number: leadId })
        });
        const picData = await picRes.json();
        const avatarUrl = picData.profilePictureUrl || picData.url || null;

        // 2. Buscar Dados do Contato usando o endpoint recomendado para 2026 (/chat/findContacts)
        const remoteJid = leadId.includes('@') ? leadId : `${leadId}@s.whatsapp.net`;
        const contactRes = await fetch(`${baseUrl}/chat/findContacts/${instance}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': apiKey },
            body: JSON.stringify({
                where: { remoteJid }
            })
        });

        const rawResponse = await contactRes.json();

        // Log para você ver no terminal exatamente o que a Evo respondeu
        console.log(`[EVO DEBUG] Resposta para ${leadId}:`, JSON.stringify(rawResponse, null, 2));

        // Busca o pushName em qualquer lugar (Array, objeto direto ou nó data)
        const contacts = Array.isArray(rawResponse) ? rawResponse : (rawResponse?.data || rawResponse?.contacts || [rawResponse]);
        const contactInfo = contacts[0];
        const pushName = contactInfo?.pushName || contactInfo?.name || contactInfo?.verifiedName || null;

        if (!pushName && !avatarUrl) {
            console.warn(`[REFRESH] Nenhum dado novo encontrado para ${leadId}`);
            return { success: false, message: "Nenhum dado novo na API" };
        }

        // ATUALIZAÇÃO FORÇADA: Se achou nome, grava. Sem perguntas.
        await prisma.leadIdentity.update({
            where: { id: leadId },
            data: {
                ...(pushName ? { name: pushName } : {}),
                ...(avatarUrl ? { avatarUrl } : {})
            }
        });

        console.log(`[REFRESH SUCCESS] Lead ${leadId} atualizado com Nome: ${pushName}`);

        revalidatePath('/dashboard/conversations');
        return { success: true, avatarUrl, name: pushName };
    } catch (e: any) {
        console.error("[REFRESH ERROR]", e);
        throw new Error("Erro na sincronização: " + e.message);
    }
}

import { analyzeWithFallback } from "@/lib/ai-orchestrator";

export async function analyzeConversationAction(leadId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId }
    });

    if (!workspace?.geminiApiKey && !workspace?.openRouterKey) {
        throw new Error("Nenhuma IA configurada nas configurações do Workspace.");
    }

    const messages = await prisma.message.findMany({
        where: { leadId, workspaceId: session.user.workspaceId },
        orderBy: { timestamp: 'asc' },
        take: 50 // Analisar as últimas 50 mensagens para contexto
    });

    if (messages.length === 0) throw new Error("Sem mensagens para analisar.");

    const history = messages.map((m: any) => `${m.direction === 'INBOUND' ? 'Lead' : 'Vendedor'}: ${m.content}`).join('\n');

    try {
        const analysis = await analyzeWithFallback({
            history,
            geminiKey: workspace.geminiKey as any || workspace.geminiApiKey,
            geminiModel: workspace.geminiModel,
            orKey: workspace.openRouterKey,
            orModel: workspace.openRouterModel
        });

        await prisma.leadIdentity.update({
            where: { id: leadId, workspaceId: session.user.workspaceId },
            data: {
                aiIntentLevel: analysis.intentLevel,
                aiDealClosed: analysis.dealClosed,
                aiValueFloat: Number(analysis.valueFloat),
                aiLossReason: analysis.lossReason,
                lastAiAnalysis: new Date()
            }
        });

        revalidatePath('/dashboard/conversations');
        return { success: true, analysis };
    } catch (e: any) {
        console.error("Erro na action AI:", e);
        throw new Error(e.message || "Falha na análise de I.A.");
    }
}

