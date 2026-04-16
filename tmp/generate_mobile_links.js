
const phone = "15551797183";
const header = { "alg": "ES256", "typ": "JWT" };
const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const options = [
    {
        name: "OPÇÃO 1: Simulação Facebook Ad",
        payload: {
            "exp": Math.floor(Date.now() / 1000) + 86400,
            "phone": phone,
            "text": "Teste de Atribuição Mobile FB",
            "source_url": "https://facebook.com/kds_ads_test",
            "icebreaker": "Olá! Vi seu anúncio no Facebook (Mobile Test)",
            "app": "facebook",
            "entry_point": "ads_conversion",
            "source_id": "AD_MOBILE_FB_001",
            "context": "MOBILE_TRACKING_TEST"
        }
    },
    {
        name: "OPÇÃO 2: Simulação Instagram Ad",
        payload: {
            "exp": Math.floor(Date.now() / 1000) + 86400,
            "phone": phone,
            "text": "Teste de Atribuição Mobile IG",
            "source_url": "https://instagram.com/kds_tracker_test",
            "icebreaker": "Oi! Vim pelo Instagram!",
            "app": "instagram",
            "entry_point": "instagram_ads",
            "source_id": "AD_MOBILE_IG_002",
            "context": "INSTAGRAM_TRACKING_TEST"
        }
    },
    {
        name: "OPÇÃO 3: Cenário Botão de Site (Direct)",
        payload: {
            "exp": Math.floor(Date.now() / 1000) + 86400,
            "phone": phone,
            "text": "Teste de Atribuição Mobile Direct",
            "source_url": "https://kdstracker.com/lp-mobile-1",
            "icebreaker": "Olá, quero saber mais sobre o KDS Tracker",
            "app": "whatsapp_direct",
            "entry_point": "website_button",
            "source_id": "LP_MOBILE_V1",
            "context": "DIRECT_TRACKING_TEST"
        }
    }
];

let output = "🚀 LINKS WHATSAPP:// PROTECTO (JWT MOCK)\n\n";

options.forEach(opt => {
    const token = `${base64Url(header)}.${base64Url(opt.payload)}.KDS_MOCK_SIGNATURE`;
    const fbclid = "IwZXh" + Math.random().toString(36).substring(7);
    const url = `whatsapp://send?phone=${phone}&source=FB_Post&token=${token}&fbclid=${fbclid}`;
    
    output += `--- ${opt.name} ---\n${url}\n\n`;
});

require('fs').writeFileSync('tmp/mobile_links.txt', output);
console.log("Links gerados em tmp/mobile_links.txt");
