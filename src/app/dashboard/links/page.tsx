import { getLinks } from './actions';
import LinksView from './LinksView';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
    const links = await getLinks();

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 overflow-y-auto w-full mx-auto p-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-white flex items-center gap-4">
                            <span className="bg-gradient-to-br from-cyan-400 to-emerald-500 bg-clip-text text-transparent">Links de Rastreio</span>
                        </h1>
                        <p className="text-slate-400 mt-2 text-lg font-light max-w-2xl">
                            The Tracklink Maker. Crie e gerencie os portais de entrada. Cada clique gerará o Hash WebGL para proteger o Lead no Cérebro Fuzzy.
                        </p>
                    </div>

                    <LinksView initialLinks={links} />
                </div>
            </div>
        </div>
    );
}
