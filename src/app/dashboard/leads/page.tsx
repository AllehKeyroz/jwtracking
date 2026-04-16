import { getLeadsList } from './actions';
import LeadsView from './LeadsView';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
    const leads = await getLeadsList();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full mx-auto p-12">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-white flex items-center gap-4">
                            <span className="bg-gradient-to-br from-cyan-400 to-indigo-500 bg-clip-text text-transparent">Audiência & Leads</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg font-light max-w-2xl">
                            A base estrutural do CRM. Acompanhe a origem de hardware, os perfis pontuáveis e intercepte dados perdidos do Funil Orgânico.
                        </p>
                    </div>

                    <LeadsView initialLeads={leads} />
                </div>
            </div>
        </div>
    );
}
