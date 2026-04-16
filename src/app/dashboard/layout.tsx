import Sidebar from '@/components/Sidebar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="h-screen flex overflow-hidden bg-background text-foreground relative">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-900/10 via-background to-background pointer-events-none z-0"></div>
                {children}
            </main>
        </div>
    );
}
