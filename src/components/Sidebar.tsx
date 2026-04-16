'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Link as LinkIcon, Users, Settings, Activity, LogOut, MessageSquare, Fingerprint, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils'; // Nosso tailwind merge helper

export default function Sidebar() {
    const pathname = usePathname();

    const routes = [
        {
            label: 'Visão Geral',
            icon: LayoutDashboard,
            href: '/dashboard',
        },
        {
            label: 'Links de Rastreio',
            icon: LinkIcon,
            href: '/dashboard/links',
        },
        {
            label: 'Monitor de Atribuição',
            icon: Fingerprint,
            href: '/dashboard/analytics',
        },
        {
            label: 'Leads & CRM',
            icon: Users,
            href: '/dashboard/leads',
        },
        {
            label: 'Conversas',
            icon: MessageSquare,
            href: '/dashboard/conversations',
        },
        {
            label: 'Integrações (Webhooks)',
            icon: Activity,
            href: '/dashboard/integrations',
        },
        {
            label: 'Logs de Webhook',
            icon: Terminal,
            href: '/dashboard/logs',
        },
        {
            label: 'Configurações',
            icon: Settings,
            href: '/dashboard/settings',
        },
    ];

    return (
        <aside className="w-64 flex flex-col h-full bg-[#030303] border-r border-white/5 relative z-20">
            {/* Branding Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    <span className="font-bold text-lg tracking-tight text-white drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">KDS Tracker</span>
                </Link>
            </div>

            {/* Navegação */}
            <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
                {routes.map((route) => {
                    const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);
                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-500 rounded-r-md shadow-[0_0_10px_rgba(6,182,212,1)]" />
                            )}
                            <route.icon className={cn("h-4 w-4", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
                            {route.label}
                        </Link>
                    );
                })}
            </div>

            {/* Footer Perfil Resumido */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sair do Sistema
                </button>
            </div>
        </aside>
    );
}
