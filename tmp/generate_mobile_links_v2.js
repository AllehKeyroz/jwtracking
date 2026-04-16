
const phone = "15551797183";
const header = { "alg": "ES256", "typ": "JWT", "kid": "125" };
const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const options = [
    {
        name: "Cenário 1: Réplica Exata do Log (FB Post CTA)",
        payload: {
            "exp": Math.floor(Date.now() / 1000) + 86400,
            "phone": phone,
            "text": "Olá! Tenho interesse no KDS Tracker vindo do Post.",
            "source_url": "https://fb.me/kds-test-mobile",
            "icebreaker": "Olá! Tenho interesse no KDS Tracker vindo do Post.",
            "app": "facebook",
            "entry_point": "post_cta",
            "jid": phone + "@s.whatsapp.net",
            "lid": "1234567890@lid",
            "chat_draft": 1,
            "show_ad_attribution": 1,
            "source": "FB_Post",
            "source_id": "1523424883126255",
            "context": "MOCK_METADATA_LONG_STRING_TRACKING"
        }
    },
    {
        name: "Cenário 2: Conversão de Anúncio (Ads Conversion)",
        payload: {
            "exp": Math.floor(Date.now() / 1000) + 86400,
            "phone": phone,
            "text": "Vi seu anúncio e quero o KDS Tracker!",
            "source_url": "https://facebook.com/ads/123",
            "icebreaker": "Vi seu anúncio e quero o KDS Tracker!",
            "app": "facebook",
            "entry_point": "ads_conversion",
            "jid": phone + "@s.whatsapp.net",
            "lid": "999888777@lid",
            "chat_draft": 1,
            "show_ad_attribution": 1,
            "source": "Ads",
            "source_id": "AD_CAMPAIGN_ID_007",
            "context": "ADS_TRACKING_DATA"
        }
    }
];

let output = "🚀 LINKS ATUALIZADOS (ESTRUTURA META COMPLETA)\n\n";

options.forEach(opt => {
    const token = `${base64Url(header)}.${base64Url(opt.payload)}.KDS_MOCK_SIGNATURE`;
    const fbclid = "IwZXh" + Math.random().toString(36).substring(7);
    
    const deepLink = `whatsapp://send?phone=${phone}&source=FB_Post&token=${token}&fbclid=${fbclid}`;
    const previewLink = `https://api.whatsapp.com/send?phone=${phone}&source=FB_Post&token=${token}&fbclid=${fbclid}`;
    
    output += `--- ${opt.name} ---\n`;
    output += `📲 DEEP LINK (Abre direto o App): \n${deepLink}\n\n`;
    output += `👁️ PREVIEW LINK (Com tela de visualização): \n${previewLink}\n\n`;
});

require('fs').writeFileSync('tmp/mobile_links_v2.txt', output);
console.log("Links V2 gerados em tmp/mobile_links_v2.txt");
