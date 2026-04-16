import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { fingerprint_hash, phone, gpu_vendor, screen_resolution } = body;

        if (!fingerprint_hash || !phone) {
            return NextResponse.json({ error: 'Parâmetros inválidos.' }, { status: 400 });
        }

        // Garante que o hardware existe ou atualiza
        await prisma.deviceFingerprint.upsert({
            where: { id: fingerprint_hash },
            create: {
                id: fingerprint_hash,
                ipAddress: '127.0.0.1', // Aqui não temos os headers tão fáceis, o padrão assume
                gpuVendor: gpu_vendor || 'Unknown',
                screenResolution: screen_resolution || '0x0',
            },
            update: { lastSeen: new Date() }
        });

        // Força a atualização do Lead com esse Hard Hash definitivo
        const updatedLead = await prisma.leadIdentity.update({
            where: { id: phone },
            data: {
                matchedHash: fingerprint_hash,
                score: 2.0 // Score máximo de validação In-App
            }
        });

        return NextResponse.json({ status: 'Autenticado' }, { status: 200 });
    } catch (err) {
        console.error('Fatal Error Tracking In-App WebView:', err);
        return NextResponse.json({ error: 'Erro Core Tracker.' }, { status: 500 });
    }
}
