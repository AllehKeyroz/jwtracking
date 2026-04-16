import { Activity, ShieldCheck, DatabaseZap, Globe, ChevronRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative">

      {/* Label Neon Topo */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm font-medium mb-8 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
        <Activity size={16} className="animate-pulse" />
        <span>KDS Tracker | Inteligência Ativa</span>
      </div>

      {/* Título Monumental */}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 bg-gradient-to-br from-white via-slate-300 to-slate-600 bg-clip-text text-transparent">
        Conecte seus Anúncios
        <br />
        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]">Direto às Vendas no WhatsApp</span>
      </h1>

      <p className="max-w-xl text-lg text-slate-400 mb-10 leading-relaxed font-light">
        A plataforma definitiva de rastreamento. Saiba exatamente qual campanha, anúncio e palavra-chave trouxe o cliente para o seu WhatsApp, sem depender de ferramentas vulneráveis à bloqueios.
      </p>

      {/* Cards de Benefícios Comerciais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl cursor-default">
        <div className="group relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden hover:border-cyan-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Globe className="text-cyan-400 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Visão 360 Graus</h3>
          <p className="text-sm text-slate-400">Nossa tecnologia acompanha o usuário desde o primeiro clique na rede social até a primeira mensagem trocada.</p>
        </div>

        <div className="group relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden hover:border-purple-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <ShieldCheck className="text-purple-400 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Imunidade Ativa</h3>
          <p className="text-sm text-slate-400">Diferente do Analytics tradicional, nosso rastreador opera na base da sua loja, superando limitações modernas da Apple e navegadores.</p>
        </div>

        <div className="group relative p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <DatabaseZap className="text-emerald-400 mb-4" size={32} />
          <h3 className="text-xl font-bold mb-2">Dados em Tempo Real</h3>
          <p className="text-sm text-slate-400">Devolva os dados de quem realmente tem intenção de compra para as inteligências do Facebook e Google Ads na mesma hora.</p>
        </div>
      </div>

      <button className="mt-14 inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-semibold text-black bg-white rounded-full hover:bg-slate-200 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
        Acessar Dashboards
        <ChevronRight size={18} />
      </button>

    </div>
  )
}
