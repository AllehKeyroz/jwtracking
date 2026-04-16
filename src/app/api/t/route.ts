import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Adicionando headers CORS para permitir que o script em QUALQUER landing page chame essa API
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Se o browser do lead mandar OPTIONS preflight
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Destruturando payload pesado extraído pelo Pixel JS (tracker.js)
        const {
            fingerprint_hash,
            gpu_vendor,
            screen_resolution,
            fbclid,
            gclid,
            utm_source,
            utm_campaign,
            workspace_key,
        } = body;

        // Pegamos o IP e User-Agent vindos cruzados do Next Request (Mais seguro impossível adulterar)
        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        if (!fingerprint_hash) {
            return NextResponse.json({ error: 'Fingerprint faltando.' }, { status: 400, headers: corsHeaders });
        }

        // ============================================
        // BUSCA OU CRIA O WORKSPACE (Para fins de Dev local, usaremos o Primeiro SE passar 'DEV_WORKSPACE')
        // Na vida real o cara tem que passar a key certa na Tag do Google Tag Manager
        // ============================================
        let targetWorkspaceId = workspace_key;

        if (workspace_key === 'DEV_WORKSPACE') {
            const firstWorkspace = await prisma.workspace.findFirst();
            if (firstWorkspace) targetWorkspaceId = firstWorkspace.id;
        }

        if (!targetWorkspaceId) {
            return NextResponse.json({ error: 'Nenhum Workspace conectado.' }, { status: 400, headers: corsHeaders });
        }

        // ============================================
        // 1. REGISTRA OU ATUALIZA O DISPOSITIVO (HARDWARE FINGERPRINT)
        // ============================================
        const device = await prisma.deviceFingerprint.upsert({
            where: { id: fingerprint_hash },
            create: {
                id: fingerprint_hash,
                ipAddress: ipAddress,
                gpuVendor: gpu_vendor || 'Unknown',
                screenResolution: screen_resolution || '0x0',
            },
            update: {
                lastSeen: new Date(),
                ipAddress: ipAddress, // Atualiza IP se o cara rodou da rede 3G pra Wifi
            }
        });

        // ============================================
        // 2. REGISTRA O CLICK / SESSÃO ATRIBUÍDA A ESTE DISPOSITIVO E CONTA ADS
        // Aqui mapeamos se o cara clicou de um anuncio do face (fbclid) ou Google (gclid)
        // ============================================
        let trafficSrc = 'Organic';
        let clickIdentifier = null;

        if (fbclid) { trafficSrc = 'Meta Ads'; clickIdentifier = fbclid; }
        else if (gclid) { trafficSrc = 'Google Ads'; clickIdentifier = gclid; }
        else if (utm_source) { trafficSrc = utm_source; }

        await prisma.clickSession.create({
            data: {
                workspaceId: targetWorkspaceId,
                fingerprintHash: device.id,
                clickId: clickIdentifier,
                trafficSource: trafficSrc,
                utmCampaign: utm_campaign || null,
            }
        });

        // Retorna sucesso e manda soltar pacote cego (CORS aberto)
        return NextResponse.json({ status: 'Tracked', hash: device.id }, { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('Fatal Error Tracking API:', error);
        return NextResponse.json({ error: 'Erro Core Tracker.' }, { status: 500, headers: corsHeaders });
    }
}
