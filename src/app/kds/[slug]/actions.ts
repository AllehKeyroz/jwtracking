'use server';

import prisma from '@/lib/prisma';

export async function registerClick(data: {
    slug: string;
    workspaceId: string;
    fingerprintHash: string;
    gpuVendor: string;
    screenResolution: string;
    userAgent?: string | null;
    os?: string | null;
    deviceType?: string | null;
    deviceModel?: string | null;
    clickId: string | null;
    trafficSource: string | null;
    utmMedium?: string | null;
    utmCampaign: string | null;
    utmTerm?: string | null;
    utmContent?: string | null;
    phone?: string | null;
}) {
    console.log(`[TRACKING] Registering click for slug: ${data.slug}, Model: ${data.deviceModel}`);

    try {
        // 1. Assegurar ou Atualizar Hardware
        await prisma.deviceFingerprint.upsert({
            where: { id: data.fingerprintHash },
            update: {
                lastSeen: new Date(),
                userAgent: data.userAgent,
                os: data.os,
                deviceModel: data.deviceModel
            },
            create: {
                id: data.fingerprintHash,
                gpuVendor: data.gpuVendor,
                screenResolution: data.screenResolution,
                userAgent: data.userAgent,
                os: data.os,
                deviceType: data.deviceType,
                deviceModel: data.deviceModel,
                ipAddress: 'pending'
            }
        });

        // 2. Lead Match
        if (data.phone) {
            const cleanPhone = data.phone.replace(/\D/g, '');
            if (cleanPhone.length >= 8) {
                await prisma.leadIdentity.upsert({
                    where: { id: cleanPhone },
                    update: {
                        matchedHash: data.fingerprintHash,
                        workspaceId: data.workspaceId
                    },
                    create: {
                        id: cleanPhone,
                        workspaceId: data.workspaceId,
                        matchedHash: data.fingerprintHash,
                        score: 0
                    }
                });
            }
        }

        // 3. Click Session
        await prisma.clickSession.create({
            data: {
                workspaceId: data.workspaceId,
                linkSlug: data.slug,
                fingerprintHash: data.fingerprintHash,
                clickId: data.clickId,
                trafficSource: data.trafficSource,
                utmMedium: data.utmMedium,
                utmCampaign: data.utmCampaign,
                utmTerm: data.utmTerm,
                utmContent: data.utmContent
            }
        });

        // 4. Update Counter
        await prisma.shortLink.update({
            where: { slug: data.slug },
            data: { clicksCount: { increment: 1 } }
        });

        return { success: true };
    } catch (error) {
        console.error("[TRACKING ERROR]", error);
        return { success: false, error: String(error) };
    }
}
