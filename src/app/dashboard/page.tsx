import { Activity, Target, Users, Zap, BarChart3, LinkIcon } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.workspaceId) {
        redirect('/login');
    }

    // Busca infos do workspace (Nome da Agência)
    const workspace = await prisma.workspace.findUnique({
        where: { id: session.user.workspaceId }
    });

    // Consultas Reais e Dinâmicas de Métricas Iniciais para o Painel
    const totalLinks = await prisma.shortLink.count({
        where: { workspaceId: session.user.workspaceId }
    });

    const linksData = await prisma.shortLink.findMany({
        where: { workspaceId: session.user.workspaceId },
        select: { clicksCount: true }
    });

    const totalClicks = linksData.reduce((acc, current) => acc + current.clicksCount, 0);

    return (
        <div className="p-8 sm:p-12 relative z-10 w-full max-w-7xl mx-auto">
            {/* Header Sensorial */}
            <div className="mb-12 flex flex-col gap-2">
                <h1 className="text-4xl font-extrabold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                    Olá, {session.user.name?.split(' ')[0] || 'Gestor'}.
                </h1>
                <p className="text-lg text-slate-400 font-medium tracking-wide">
                    Visão geral da sua conta {workspace?.name || 'Central'}.
                </p>
            </div>

            {/* Grid de Metrificação (Métricas Reais do Sistema) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatsCard
                    title="Matchs de Lead"
                    value="-"
                    trend="Aguardando Captação..."
                    trendUp={true}
                    icon={Activity}
                    gradient="from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-400"
                />
                <StatsCard
                    title="Recuperação de Conversões"
                    value="-"
                    trend="Configuração pendente"
                    trendUp={true}
                    icon={BarChart3}
                    gradient="from-purple-500/20 to-transparent border-purple-500/30 text-purple-400"
                />
                <StatsCard
                    title="Cliques Totais (Hits)"
                    value={totalClicks.toString()}
                    trend="Todos os Links"
                    trendUp={true}
                    icon={Users}
                    gradient="from-slate-700/50 to-transparent border-slate-700/80 text-slate-300"
                />
                <StatsCard
                    title="Links Ativos"
                    value={totalLinks.toString()}
                    trend="Hospedados"
                    trendUp={true}
                    icon={LinkIcon}
                    gradient="from-emerald-500/20 to-transparent border-emerald-500/30 text-emerald-400"
                />
            </div>

            {/* Placeholder de Gráfico/Timeline Avançada */}
            <div className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-[20px]" />

                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-300 mb-2">Relatório de Identidade Cruzada em Tempo Real</h2>
                    <p className="text-sm text-slate-500">Módulo de Gráficos aguardando ingestão inicial via Firebase Array.</p>
                </div>
            </div>
        </div>
    );
}

// Sub-Componente Visual Rápido para Re-uso Otimizado
function StatsCard({
    title, value, trend, icon: Icon, trendUp, gradient
}: {
    title: string; value: string; trend: string; icon: any; trendUp: boolean; gradient: string;
}) {
    return (
        <div className={`p-6 rounded-2xl border bg-gradient-to-br ${gradient} backdrop-blur-md relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-default`}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-slate-400">{title}</h3>
                <span className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-4 h-4" />
                </span>
            </div>
            <div>
                <h2 className="text-4xl font-bold text-white tracking-tight mb-2">{value}</h2>
                <p className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${trendUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trend}
                </p>
            </div>
        </div>
    );
}
