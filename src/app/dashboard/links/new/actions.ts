'use server';

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createTrackLink(formData: FormData) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.workspaceId) {
            return { error: 'Autenticação falhou. Acesso Restrito ao seu Workspace.' };
        }

        const slug = formData.get('slug') as string;
        const destinationUrl = formData.get('destinationUrl') as string;
        const rotatorRaw = formData.get('rotatorUrls') as string;

        if (!slug || !destinationUrl) {
            return { error: 'Preencha todos os parâmetros corretamente.' };
        }

        // Normalização extrema (Sem espaços, sempre lowercase)
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

        // Verifica Colisão Global de Rotas
        const existing = await prisma.shortLink.findUnique({
            where: { slug: cleanSlug }
        });

        if (existing) {
            return { error: 'Este Slug (URL Curta) já está em uso. Escolha outro.' };
        }

        let rotatorUrlsCleaned: string | null = null;

        const appendUtms = (url: string) => {
            try {
                const u = new URL(url);
                if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'kds_tracker');
                if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'shortlink');
                return u.toString();
            } catch {
                return url;
            }
        };

        const finalDestinationUrl = appendUtms(destinationUrl.trim());

        if (rotatorRaw && rotatorRaw.trim() !== '') {
            const lines = rotatorRaw.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.startsWith('http'))
                .map(line => appendUtms(line)); // Aplica UTM automática no Round Robin

            if (lines.length > 0) {
                rotatorUrlsCleaned = lines.join(',');
            }
        }

        await prisma.shortLink.create({
            data: {
                workspaceId: session.user.workspaceId,
                slug: cleanSlug,
                destinationUrl: finalDestinationUrl,
                rotatorUrls: rotatorUrlsCleaned,
                rotatorIndex: 0,
                isActive: true,
                clicksCount: 0
            }
        });

        return { success: true };
    } catch (err) {
        console.error('Error in createTrackLink Server Action:', err);
        return { error: 'Falha interna ao tentar salvar o link no banco de dados.' };
    }
}
