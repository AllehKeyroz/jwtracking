import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PortalClient from './PortalClient';

export default async function KDSLinkPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params;

    const link = await prisma.shortLink.findUnique({
        where: { slug: resolvedParams.slug },
        include: { workspace: true }
    });

    if (!link || !link.isActive) {
        return notFound();
    }

    // Lógica de Roteador (Round Robin)
    let finalDestination = link.destinationUrl;

    if (link.rotatorUrls) {
        const urls = link.rotatorUrls.split(',').map((u: string) => u.trim());
        if (urls.length > 0) {
            const nextIndex = (link.rotatorIndex + 1) % urls.length;
            finalDestination = urls[link.rotatorIndex % urls.length];

            // Atualiza o índice de forma silenciosa e rápida no banco
            // Não bloqueia o render
            prisma.shortLink.update({
                where: { id: link.id },
                data: { rotatorIndex: nextIndex }
            }).catch((e: any) => console.error("Rotator Error", e));
        }
    }

    return (
        <PortalClient
            slug={link.slug}
            workspaceId={link.workspaceId}
            destination={finalDestination}
        />
    );
}
