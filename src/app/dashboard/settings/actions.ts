'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { analyzeLeadConversation } from "@/lib/gemini";

export async function getWorkspaceSettings() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return null;

    try {
        return await prisma.workspace.findUnique({
            where: { id: session.user.workspaceId },
            select: {
                name: true,
                geminiApiKey: true,
                geminiModel: true,
                openRouterKey: true,
                openRouterModel: true
            }
        });
    } catch (e) {
        console.error("Erro Prisma ao buscar settings (provavelmente schema desatualizado):", e);
        // Fallback básico
        return await prisma.workspace.findUnique({
            where: { id: session.user.workspaceId },
            select: { name: true }
        }) as any;
    }
}

export async function testGeminiConnection(apiKey: string, model: string) {
    try {
        await analyzeLeadConversation(apiKey, "__TEST_CONNECTION__", model);
        return { success: true };
    } catch (e: any) {
        throw new Error(e.message || "Falha no teste do Gemini.");
    }
}

export async function testOpenRouterConnection(apiKey: string, model: string) {
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://kds-tracker.com",
                "X-Title": "KDS Tracker"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "ping" }],
                max_tokens: 5
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || "Erro no OpenRouter");
        }

        return { success: true };
    } catch (e: any) {
        throw new Error(e.message || "Falha no teste do OpenRouter.");
    }
}

export async function updateWorkspaceAiSettings(data: {
    geminiApiKey?: string,
    geminiModel?: string,
    openRouterKey?: string,
    openRouterModel?: string
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    await prisma.workspace.update({
        where: { id: session.user.workspaceId },
        data: {
            geminiApiKey: data.geminiApiKey,
            geminiModel: data.geminiModel,
            openRouterKey: data.openRouterKey,
            openRouterModel: data.openRouterModel
        }
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
}
