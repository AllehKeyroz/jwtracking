import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        // Verifica se já existe o owner master
        const existingUser = await prisma.user.findUnique({
            where: { email: 'admin@kdstracker.com' }
        });

        if (existingUser) {
            return NextResponse.json({ message: 'Setup já realizado antes.' }, { status: 200 });
        }

        // Cria o Workspace Mestre
        const workspace = await prisma.workspace.create({
            data: {
                name: 'KDS Digital Hub - Workspace 1',
                customDomain: 'tracker.kds.com'
            }
        });

        // Cria o Usuário Administrador
        const hashedPassword = await bcrypt.hash('SenhaMestra123', 10);

        await prisma.user.create({
            data: {
                name: 'Administrador Supremo',
                email: 'admin@kdstracker.com',
                password: hashedPassword,
                workspaces: {
                    create: {
                        workspaceId: workspace.id,
                        role: 'OWNER'
                    }
                }
            }
        });

        // Seed: Cria um link fictício real para testes do encurtador
        await prisma.shortLink.create({
            data: {
                workspaceId: workspace.id,
                slug: 'zap',
                destinationUrl: 'https://wa.me/5511999999999?text=Teste%20do%20setup',
                clicksCount: 142
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Workspace e Usuário Admin Mestre criados com sucesso!',
            credentials: { email: 'admin@kdstracker.com', password: 'SenhaMestra123' }
        }, { status: 201 });

    } catch (err) {
        console.error('Setup Error:', err);
        return NextResponse.json({ error: 'Erro crítico na injeção do Setup.' }, { status: 500 });
    }
}
