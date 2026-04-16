import prisma from './prisma';

export async function logWebhook(provider: 'WABA' | 'EVOLUTION', payload: any, workspaceId?: string | null) {
  try {
    const event = provider === 'EVOLUTION' ? payload?.event : (payload?.object || 'waba_event');
    
    await prisma.webhookLog.create({
      data: {
        provider,
        workspaceId: workspaceId || null,
        event: typeof event === 'string' ? event : 'unknown',
        payload: JSON.stringify(payload)
      }
    });
  } catch (err) {
    console.error(`[LOG WEBHOOK ERROR] Falha ao registrar log de ${provider}:`, err);
  }
}
