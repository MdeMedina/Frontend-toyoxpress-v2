"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === "/login";

    if (isAuthPage) {
        return <main className="flex-1 w-full h-full">{children}</main>;
    }

    return (
        <>
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-8 bg-muted/30">
                    {children}
                </main>
            </div>
        </>
    );
}
