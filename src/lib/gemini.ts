import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeLeadConversation(apiKey: string, history: string, modelName: string = "gemini-3-flash-latest") {
    if (!apiKey) throw new Error("API Key do Gemini não configurada.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-3-flash-latest" });

    const prompt = `
        Você é um analista de vendas especialista em CRM e rastreamento.
        Analise o histórico de conversa entre um Vendedor e um Lead de WhatsApp abaixo e extraia dados estruturados.

        HISTÓRICO:
        ${history}

        REGRAS DE EXTRAÇÃO:
        1. Intent_Level: "Quente" (interessado/perto de pagar), "Morno" (tirando dúvidas), "Frio" (desinteressado), "Morto" (parou de responder/recusou).
        2. Deal_Closed: true se houve fechamento ou pagamento confirmado, false caso contrário.
        3. Value_Float: Valor numérico da venda se mencionado. Se não souber, use 0.
        4. Loss_Reason: Se o lead esfriou ou morreu, diga o motivo (ex: "Preço", "Não responde", "Dúvida técnica").

        Sua resposta DEVE ser estritamente um JSON no formato:
        {
            "intentLevel": string,
            "dealClosed": boolean,
            "valueFloat": number,
            "lossReason": string
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Se for modo teste, não tenta parsear JSON
        if (history === "__TEST_CONNECTION__") {
            return { success: true, text };
        }

        // Limpeza de Markdown se a IA retornar ```json ... ```
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Erro na análise do Gemini:", error);
        // Tratamento amigável para erro 404 (modelo não encontrado)
        if (error.message?.includes("404") || error.message?.includes("not found")) {
            throw new Error(`O modelo "${modelName}" não foi encontrado para esta API Key ou região. Tente usar "gemini-1.5-flash-latest".`);
        }
        throw error;
    }
}
