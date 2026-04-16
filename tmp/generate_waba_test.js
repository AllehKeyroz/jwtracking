
const phone = "5511987106941";
const header = { "alg": "ES256", "typ": "JWT" };
const payload = {
    "exp": Math.floor(Date.now() / 1000) + 86400, // +1 dia
    "phone": phone,
    "text": "Teste de Atribuição KDS Tracker",
    "source_url": "https://facebook.com/kds_ads_test",
    "icebreaker": "Olá! Vi seu anúncio no Facebook",
    "app": "facebook",
    "entry_point": "ads_conversion",
    "source_id": "AD_KDS_REAL_MATCH",
    "context": "TOKEN_DE_CONTEXTO_KDS"
};

const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const token = `${base64Url(header)}.${base64Url(payload)}.KDS_MOCK_SIGNATURE`;

const finalUrl = `https://api.whatsapp.com/send?phone=${phone}&source=FB_Post&token=${token}&fbclid=IwZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMzUwNjg1NTMxNzI4AAEeVqeU_ZXubBswvACfnJNsgt7z8HUepoxYvqVduEbiwcrCx6Iw4ZGodoYRJ1c_aem_iJdrV3VjkQ6leiO897Mhdw`;

console.log("\n--- LINK PARA TESTE DE ATRIBUIÇÃO WABA ---");
console.log(finalUrl);
console.log("------------------------------------------\n");
