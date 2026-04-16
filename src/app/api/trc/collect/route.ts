import { NextResponse } from 'next/server';
import { getAdminDb, getAdminRtdb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
    try {
        const adminDb = getAdminDb();
        const adminRtdb = getAdminRtdb();
        
        if (!adminDb || !adminRtdb) {
            return NextResponse.json({ 
                success: false, 
                error: 'Firebase not configured' 
            }, { status: 503 });
        }

        const data = await req.json();
        const { hash, vid, url, referrer, params, screen, timezone, event } = data;

        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        const fgptPayload = {
            ip,
            userAgent,
            screen,
            timezone,
            lastSeen: new Date().toISOString(),
            updatedAt: adminDb.collection('anything').doc().id
        };

        if (hash && hash !== 'unknown') {
            const fgptRef = adminDb.collection('fingerprints').doc(hash);
            await fgptRef.set(fgptPayload, { merge: true });
        }

        if (hash) {
            const rtdbRef = adminRtdb.ref(`fuzzy_queue/${hash}`);
            await rtdbRef.set({
                ip,
                timestamp: Date.now(),
                lastUrl: url
            });
        }

        if (params && (params.fbclid || params.gclid || params.ttclid || params.utm_source)) {
            await adminDb.collection('clicks').add({
                fingerprint_hash: hash || 'unknown',
                click_id: params.fbclid || params.gclid || params.ttclid || null,
                traffic_source: params.utm_source || (params.fbclid ? 'meta' : (params.gclid ? 'google' : 'organic')),
                utm_campaign: params.utm_campaign || null,
                ip_address: ip,
                vid_cookie: vid,
                clicked_at: new Date().toISOString(),
            });
        }

        if (event === 'WA_CLICK') {
            await adminRtdb.ref(`intent_clicks/${hash}`).set({
                timestamp: Date.now(),
                targetUrl: url
            });
        }

        return NextResponse.json({ success: true, timestamp: Date.now() }, { status: 200 });

    } catch (error) {
        console.error('KDS_TRACKER GET COLLECT ERR:', error);
        return NextResponse.json({ success: false, error: 'Bad Payload' }, { status: 400 });
    }
}