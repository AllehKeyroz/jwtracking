import prisma from './prisma';
import { runAiAnalysis } from './ai-master';

/**
 * Inteligência Estruturada (Fase 5)
 * Lógica para economizar tokens e priorizar provedores.
 */
export async function processLeadIntelligence(workspaceId: string, leadId: string, currentContent?: string) {
    try {
        const lead = await prisma.leadIdentity.findUnique({
            where: { id: leadId },
            include: { workspace: true }
        });

        if (!lead || !lead.workspace) return;

        // 1. ECONOMIA DE TOKENS: Critérios para disparar a IA
        const now = new Date();
        const lastAnalysis = lead.lastAiAnalysis ? new Date(lead.lastAiAnalysis).getTime() : 0;
        const fiveMinutesMs = 5 * 60 * 1000;

        // Se analisou a menos de 5 minutos, pula (evita spam em chats rápidos)
        if (now.getTime() - lastAnalysis < fiveMinutesMs) {
            console.log(`[AI ENGINE] Lead ${leadId} analisado recentemente. Pulando para economizar.`);
            return;
        }

        // Busca mensagens desde a última análise (ou todas se nunca analisou)
        const messages = await prisma.message.findMany({
            where: {
                leadId,
                timestamp: { gte: lead.lastAiAnalysis || new Date(0) }
            },
            orderBy: { timestamp: 'asc' }
        });

        const newMessagesCount = messages.length;
        const hotKeywords = ['pagar', 'pix', 'comprovante', 'fechei', 'fechamos', 'boleto', 'comprar', 'cartão'];
        const hasHotKeyword = currentContent && hotKeywords.some(word => currentContent.toLowerCase().includes(word));

        // Só dispara se:
        // - Tem mais que 8 mensagens novas
        // - OU tem uma keyword "quente" de fechamento
        // - OU faz mais de 24h que não analisa e tem alguma msg nova
        const dayInMs = 24 * 60 * 60 * 1000;
        const isStale = (now.getTime() - lastAnalysis > dayInMs) && newMessagesCount > 0;

        if (newMessagesCount < 8 && !hasHotKeyword && !isStale) {
            return;
        }

        console.log(`[AI ENGINE] Disparando análise para ${leadId} (${newMessagesCount} novas msgs)...`);

        // 2. PREPARA O HISTÓRICO PARA A IA
        const historyText = messages.map((m: any) => {
            const sender = m.direction === 'INBOUND' ? 'CLIENTE' : 'VENDEDOR';
            return `[${sender}]: ${m.content}`;
        }).join('\n');

        // 3. EXECUTA O MOTOR MESTRE (Prioridade OpenRouter -> Fallback Gemini)
        const result = await runAiAnalysis(lead.workspace, historyText);

        // 4. PERSISTE A INTELIGÊNCIA
        await prisma.leadIdentity.update({
            where: { id: leadId },
            data: {
                aiIntentLevel: result.intentLevel,
                aiDealClosed: result.dealClosed,
                aiValueFloat: result.valueFloat,
                aiLossReason: result.lossReason,
                lastAiAnalysis: now,
                // Aumenta o score se o nível de intenção for quente
                score: result.intentLevel === 'Quente' ? 0.9 : lead.score
            }
        });

        console.log(`[AI ENGINE] Lead ${leadId} atualizado: ${result.intentLevel} | Fechou: ${result.dealClosed}`);

    } catch (err) {
        console.error(`[AI ENGINE] Erro ao processar inteligência do lead ${leadId}:`, err);
    }
}
