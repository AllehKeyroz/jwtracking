import { NextResponse } from 'next/server';
import { adminDb, adminRtdb } from '@/lib/firebase/admin';

// POST /api/trc/collect
export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { hash, vid, url, referrer, params, screen, timezone, event } = data;

        // Pega o IP real do cliente via Headerm do Next.js / Vercel / Cloudflare
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        // Construção do Payload do Fingerprint
        const fgptPayload = {
            ip,
            userAgent,
            screen,
            timezone,
            lastSeen: new Date().toISOString(),
            updatedAt: adminDb.collection('anything').doc().id // Dummy pra pegar o obj Timestamp depois
        };

        // 1. Salvar ou Atualizar O Registro de Fingerprint Mestre no FIRESTORE
        if (hash && hash !== 'unknown') {
            const fgptRef = adminDb.collection('fingerprints').doc(hash);
            await fgptRef.set(fgptPayload, { merge: true });
        }

        // 2. Filas de Curto Prazo no RTDB (O "Fuzzy Queue" para Identity Bridging rápido)
        // Usaremos RTDB p/ cruzar IPs e Hardwares rapidamento quando a mensagem WA bater.
        if (hash) {
            const rtdbRef = adminRtdb.ref(`fuzzy_queue/${hash}`);
            await rtdbRef.set({
                ip,
                timestamp: Date.now(),
                // TODO: Passar o workspace_id via URL do script (Ex: /px.js?ws=123)
                // workspace_id: params.ws || 'UNKNOWN',
                lastUrl: url
            });
        }

        // 3. Salvar a Sessão de Clique se tiver UTMs ou FBCLID
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

        // 4. Se for o Disparo de WA_CLICK (Ponte Pré-Form/Intent)
        if (event === 'WA_CLICK') {
            // Nós podemos disparar um evento na timeline do adminDb ou flag no RTDB:
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
