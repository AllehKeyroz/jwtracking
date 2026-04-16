import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

// Tipagem para aceitar custom fields do GodMode
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            workspaceId: string;
            role: string;
        } & import("next-auth").DefaultSession["user"]
    }
    interface User {
        workspaceId: string;
        role: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Preencha todos os campos.");
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { workspaces: { include: { workspace: true } } }
                });

                if (!user) {
                    throw new Error("E-mail não encontrado ou inválido.");
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    throw new Error("Senha incorreta.");
                }

                // Se o usuário não tiver workspaces, não deixa logar via credentials simples
                if (user.workspaces.length === 0) {
                    throw new Error("Usuário não atrelado a nenhum Workspace.");
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    // Guardamos o id do primeiro workspace como ativo para MVP (dá pra evoluir depois)
                    workspaceId: user.workspaces[0].workspaceId,
                    role: user.workspaces[0].role
                };
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.workspaceId = user.workspaceId;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                // @ts-ignore
                session.user.workspaceId = token.workspaceId;
                // @ts-ignore
                session.user.role = token.role;
                // @ts-ignore
                session.user.id = token.sub;
            }
            return session;
        }
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60 // 30 Dias
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_super_secret_for_dev_mode"
};
