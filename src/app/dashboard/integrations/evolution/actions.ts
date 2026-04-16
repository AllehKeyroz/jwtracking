'use server';

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveEvolutionGateway(url: string, apiKey: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    // Cria uma conexão MASTER oculta ou verifica se já tem
    let connection = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });

    const tokenPayload = `${url}|${apiKey}`;

    if (!connection) {
        await prisma.whatsAppConnection.create({
            data: {
                workspaceId: session.user.workspaceId,
                name: 'Gateway Principal Evolution',
                provider: 'EVOLUTION',
                token: tokenPayload,
                instanceId: 'master_setup', // Flag
                isActive: true
            }
        });
    } else {
        await prisma.whatsAppConnection.updateMany({
            where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' },
            data: { token: tokenPayload }
        });
    }

    revalidatePath('/dashboard/integrations/evolution');
    return { success: true };
}

export async function getEvolutionConnections() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) return null;

    const connections = await prisma.whatsAppConnection.findMany({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });

    return connections;
}

export async function createEvolutionInstance(instanceName: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const master = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });

    if (!master || !master.token) throw new Error("Gateway não configurado.");
    const [url, apiKey] = master.token.split('|');

    // Remove white spaces or invalid chars from instance name for the API ID
    const apiInstanceId = instanceName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000);

    // Call Evolution API /instance/create
    const res = await fetch(`${url}/instance/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
        },
        body: JSON.stringify({
            instanceName: apiInstanceId,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS"
        })
    });

    if (!res.ok) {
        console.error("Evolution Create Instance Error", await res.text());
        throw new Error("Falha ao criar instância na Evolution API.");
    }

    // Set Webhook automatically for this new instance!
    const webhookRes = await fetch(`${url}/webhook/set/${apiInstanceId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey
        },
        body: JSON.stringify({
            webhook: {
                enabled: true,
                url: `${process.env.NEXTAUTH_URL || 'https://app.kdstracker.com'}/api/webhooks/evolution?workspaceKey=${session.user.workspaceId}`,
                byEvents: false,
                base64: false,
                events: ["MESSAGES_UPSERT"]
            }
        })
    });

    // Save strictly as an operative instance in our DB
    await prisma.whatsAppConnection.create({
        data: {
            workspaceId: session.user.workspaceId,
            name: instanceName,
            provider: 'EVOLUTION',
            token: master.token,
            instanceId: apiInstanceId,
            isActive: true
        }
    });

    revalidatePath('/dashboard/integrations/evolution');
    return { success: true, apiInstanceId };
}

// Fetch instance status from API
export async function getEvolutionInstanceStatus(apiInstanceId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const master = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });
    if (!master || !master.token) throw new Error("Gateway não configurado.");
    const [url, apiKey] = master.token.split('|');

    try {
        const res = await fetch(`${url}/instance/connectionState/${apiInstanceId}`, {
            headers: { 'apikey': apiKey },
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data = await res.json();
        // data.instance.state => "open", "connecting", "close", etc.
        return data?.instance?.state || 'unknown';
    } catch {
        return 'error';
    }
}

// Generates the Base64 QR Code
export async function getEvolutionQrCode(apiInstanceId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const master = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });
    if (!master || !master.token) throw new Error("Gateway não configurado.");
    const [url, apiKey] = master.token.split('|');

    const res = await fetch(`${url}/instance/connect/${apiInstanceId}`, {
        headers: { 'apikey': apiKey },
        cache: 'no-store'
    });

    if (!res.ok) throw new Error("Falha ao puxar QR Code");

    const data = await res.json();
    return data?.base64 || null;
}

export async function deleteEvolutionInstance(id: string, apiInstanceId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const master = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });

    if (master?.token) {
        const [url, apiKey] = master.token.split('|');
        // Delete from Evo
        try {
            await fetch(`${url}/instance/delete/${apiInstanceId}`, {
                method: 'DELETE',
                headers: { 'apikey': apiKey }
            });
        } catch (e) { }
    }

    // Delete from DB
    await prisma.whatsAppConnection.delete({
        where: { id }
    });

    revalidatePath('/dashboard/integrations/evolution');
    return { success: true };
}

export async function syncEvolutionInstances() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) throw new Error("Não autorizado");

    const master = await prisma.whatsAppConnection.findFirst({
        where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
    });

    if (!master || !master.token) throw new Error("Gateway não configurado.");
    const [url, apiKey] = master.token.split('|');

    try {
        const res = await fetch(`${url}/instance/fetchInstances`, {
            method: 'GET',
            headers: { 'apikey': apiKey },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error();

        const instancesData = await res.json();

        const existingConnections = await prisma.whatsAppConnection.findMany({
            where: { workspaceId: session.user.workspaceId, provider: 'EVOLUTION' }
        });

        const existingIds = new Set(existingConnections.map((c: any) => c.instanceId));

        if (Array.isArray(instancesData)) {
            for (const item of instancesData) {
                // Evolution API varies slightly in responses, attempt common paths
                const apiInstanceId = item?.instance?.instanceName || item?.name || item?.instanceName;

                if (apiInstanceId && apiInstanceId !== 'master_setup') {

                    // SEMPRE forçar a inscrição do Webhook (Útil se o NGrok mudar ou der pau!)
                    try {
                        await fetch(`${url}/webhook/set/${apiInstanceId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': apiKey
                            },
                            body: JSON.stringify({
                                webhook: {
                                    enabled: true,
                                    url: `${process.env.NEXTAUTH_URL || 'https://app.kdstracker.com'}/api/webhooks/evolution?workspaceKey=${session.user.workspaceId}`,
                                    byEvents: false,
                                    base64: false,
                                    events: ["MESSAGES_UPSERT"]
                                }
                            })
                        });
                    } catch (e) { }

                    // Apenas insere no nosso BD se não existir
                    if (!existingIds.has(apiInstanceId)) {
                        await prisma.whatsAppConnection.create({
                            data: {
                                workspaceId: session.user.workspaceId,
                                name: apiInstanceId,
                                provider: 'EVOLUTION',
                                token: master.token,
                                instanceId: apiInstanceId,
                                isActive: true
                            }
                        });
                    }
                }
            }
        }
    } catch (err) {
        throw new Error("Falha ao sincronizar as instâncias. A API Evolution está online?");
    }

    revalidatePath('/dashboard/integrations/evolution');
    return { success: true };
}
