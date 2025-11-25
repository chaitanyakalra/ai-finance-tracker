import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navigation from "./Navigation";
import { Toaster } from "@/components/ui/sonner";

function Layout() {
    return (
        <div className="flex min-h-screen flex-col bg-background font-sans text-foreground md:flex-row">
            <Navigation />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
            <Toaster position="top-right" theme="dark" />
        </div>
    );
}

export default Layout;
