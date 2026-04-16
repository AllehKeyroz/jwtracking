import { analyzeLeadConversation } from "./gemini";

export async function analyzeWithFallback(params: {
    history: string,
    geminiKey?: string | null,
    geminiModel?: string | null,
    orKey?: string | null,
    orModel?: string | null
}) {
    const isTest = params.history === "__TEST_CONNECTION__";
    const testPrompt = "Responda apenas com a palavra 'OK' se você estiver funcionando.";

    const analysisPrompt = `
        Analise esta conversa e extraia exatamente este JSON:
        {
            "intentLevel": "Quente" | "Morno" | "Frio" | "Morto",
            "dealClosed": boolean,
            "valueFloat": number,
            "lossReason": string
        }
        Conversa:
        ${params.history}
    `;

    // 1. Tentar OpenRouter primeiro
    if (params.orKey && params.orModel) {
        try {
            console.log(`[AI] Tentando OpenRouter (${params.orModel})...`);
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${params.orKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://kds-tracker.com",
                    "X-Title": "KDS Tracker"
                },
                body: JSON.stringify({
                    model: params.orModel,
                    messages: [
                        { role: "system", content: "Você é um analista JSON. Responda apenas o objeto JSON solicitado." },
                        { role: "user", content: isTest ? testPrompt : analysisPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (res.ok) {
                const data = await res.json();
                const content = data.choices[0].message.content;
                if (isTest) return { success: true, text: content };
                return JSON.parse(content);
            }
            console.warn("[AI] OpenRouter falhou (status != 200). Tentando fallback para Gemini...");
        } catch (e) {
            console.error("[AI] Erro no OpenRouter, tentando fallback...", e);
        }
    }

    // 2. Fallback para Gemini
    if (params.geminiKey) {
        console.log(`[AI] Usando Gemini (${params.geminiModel || 'default'})...`);
        return await analyzeLeadConversation(
            params.geminiKey,
            params.history,
            params.geminiModel || "gemini-3-flash-latest"
        );
    }

    throw new Error("Nenhuma IA configurada para este workspace (Gemini ou OpenRouter).");
}
