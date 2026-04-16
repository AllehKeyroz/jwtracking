import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getConversationLeads } from "./actions";
import ChatView from "./ChatView";

export default async function ConversationsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const leads = await getConversationLeads();

    return (
        <div className="w-full flex h-[calc(100vh-64px)] overflow-hidden bg-[#030303]">
            <ChatView initialLeads={leads} />
        </div>
    );
}
