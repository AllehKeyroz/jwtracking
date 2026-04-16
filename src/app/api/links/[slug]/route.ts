import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, context: { params: { slug: string } }) {
    try {
        const slug = context.params?.slug;

        if (!slug) {
            return NextResponse.json({ error: 'Falta parâmetro letal (slug).' }, { status: 400 });
        }

        // Busca o Destino final diretamente no SQLite
        const trackLink = await prisma.shortLink.findUnique({
            where: { slug }
        });

        if (!trackLink || !trackLink.isActive) {
            return NextResponse.json({ error: 'Acesso Restrito: Rota Destruída ou Inativa.' }, { status: 404 });
        }

        // ===============
        // Round Robin Engine
        // ===============
        const listUrls = [trackLink.destinationUrl];
        if (trackLink.rotatorUrls) {
            const splitted = trackLink.rotatorUrls.split(',');
            listUrls.push(...splitted);
        }

        const targetIndex = trackLink.rotatorIndex % listUrls.length;
        const selectedUrl = listUrls[targetIndex];

        // Incrementa Hit e avança a fila do Round Robin
        await prisma.shortLink.update({
            where: { id: trackLink.id },
            data: {
                clicksCount: { increment: 1 },
                rotatorIndex: { increment: 1 }
            }
        });

        return NextResponse.json({
            destination_url: selectedUrl,
            workspace_id: trackLink.workspaceId
        }, { status: 200 });
    } catch (err) {
        console.error('Core Motor SQLite Link Error:', err);
        return NextResponse.json({ error: 'Pane no Sistema GodMode.' }, { status: 500 });
    }
}
