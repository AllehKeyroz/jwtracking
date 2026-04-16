import { GoogleGenerativeAI } from "@google/generative-ai";

interface AiAnalysisResult {
    intentLevel: "Quente" | "Morno" | "Frio" | "Morto";
    dealClosed: boolean;
    valueFloat: number;
    lossReason: string;
}

export async function runAiAnalysis(
    workspace: {
        openRouterKey?: string | null;
        openRouterModel?: string | null;
        geminiApiKey?: string | null;
        geminiModel?: string | null;
    },
    history: string
): Promise<AiAnalysisResult> {

    const prompt = `
        Analise o histórico de conversa de WhatsApp abaixo e extraia dados estruturados.
        
        HISTÓRICO:
        ${history}

        RESPOSTA OBRIGATÓRIA EM JSON:
        {
            "intentLevel": "Quente" | "Morno" | "Frio" | "Morto",
            "dealClosed": boolean,
            "valueFloat": number,
            "lossReason": string
        }
    `;

    // 1. TENTA OPENROUTER PRIMEIRO (Prioridade do Usuário)
    if (workspace.openRouterKey) {
        try {
            console.log(`[AI MASTER] Tentando OpenRouter (${workspace.openRouterModel || 'free'})...`);
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${workspace.openRouterKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://kds-tracker.com",
                    "X-Title": "KDS Tracker"
                },
                body: JSON.stringify({
                    model: workspace.openRouterModel || "google/gemini-2.0-flash:free",
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const text = data.choices[0].message.content;
                return parseAiJson(text);
            }
            console.warn(`[AI MASTER] OpenRouter falhou (Status ${res.status}). Tentando fallback...`);
        } catch (err) {
            console.error(`[AI MASTER] Erro crítico no OpenRouter. Tentando fallback...`, err);
        }
    }

    // 2. TENTA GEMINI COMO FALLBACK
    if (workspace.geminiApiKey) {
        try {
            console.log(`[AI MASTER] Tentando Gemini Fallback (${workspace.geminiModel || 'gemini-1.5-flash'})...`);
            const genAI = new GoogleGenerativeAI(workspace.geminiApiKey);
            const model = genAI.getGenerativeModel({ model: workspace.geminiModel || "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return parseAiJson(text);
        } catch (err) {
            console.error(`[AI MASTER] Erro no Fallback Gemini.`, err);
        }
    }

    throw new Error("Nenhum motor de IA disponível ou configurado corretamente.");
}

function parseAiJson(text: string): AiAnalysisResult {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
    } catch (e) {
        console.error("[AI MASTER] Falha ao parsear JSON da IA:", text);
        return {
            intentLevel: "Morno",
            dealClosed: false,
            valueFloat: 0,
            lossReason: "Falha no parse"
        };
    }
}
