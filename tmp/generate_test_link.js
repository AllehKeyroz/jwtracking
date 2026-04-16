
const crypto = require('crypto');

const phone = '557799822517';
const payload = {
    exp: Math.floor(Date.now() / 1000) + 86400,
    phone: phone,
    text: "Teste de Atribuição KDS Tracker - ID: " + Math.random().toString(36).substring(7),
    source_url: "https://facebook.com/kds_ads_test",
    icebreaker: "Olá! Vi seu anúncio no Facebook e gostaria de mais informações.",
    app: "facebook",
    entry_point: "ads_conversion",
    source_id: "AD_FICTICIO_12345",
    context: "TOKEN_DE_CONTEXTO_PARA_MATCH_AUTOMATICO_KDS"
};

// Mock de JWT (Header.Payload.Signature)
const header = Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT" })).toString('base64').replace(/=/g, '');
const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '');
const signature = crypto.randomBytes(32).toString('base64').replace(/=/g, '');

const token = `${header}.${body}.${signature}`;
const fbclid = "IwZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMzUwNjg1NTMxNzI4AAEeVqeU_ZXubBswvACfnJNsgt7z8HUepoxYvqVduEbiwcrCx6Iw4ZGodoYRJ1c_aem_iJdrV3VjkQ6leiO897Mhdw";

const finalUrl = `https://api.whatsapp.com/send?phone=${phone}&source=FB_Post&token=${token}&fbclid=${fbclid}`;

console.log("\n--- LINK DE TESTE GERADO ---");
console.log(finalUrl);
console.log("----------------------------\n");
