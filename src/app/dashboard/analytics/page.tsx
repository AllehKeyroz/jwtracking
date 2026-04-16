import { getRecentTrackingData } from './actions';
import TrackingAnalyticsView from './TrackingAnalyticsView';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
    const data = await getRecentTrackingData();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full mx-auto p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-12">
                        <h1 className="text-4xl font-black text-white flex items-center gap-4">
                            <span className="bg-gradient-to-br from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Analytics & Atribuição</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg font-light max-w-2xl">
                            A camada de transparência do Cérebro Fuzzy. Veja em tempo real cada clique e como a identidade de hardware está sendo construída para o match.
                        </p>
                    </div>

                    <TrackingAnalyticsView initialData={data} />
                </div>
            </div>
        </div>
    );
}
