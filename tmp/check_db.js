const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Click Sessions...");
    const clicks = await prisma.clickSession.findMany({
        orderBy: { clickedAt: 'desc' },
        take: 5,
        include: { fingerprint: true }
    });
    console.log(JSON.stringify(clicks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
