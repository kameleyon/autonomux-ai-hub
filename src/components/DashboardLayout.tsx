import { Outlet } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import logo from "@/assets/logo.png";

const DashboardLayout = () => {
  return (
    <SidebarProvider>
      <div className="flex min-h-svh w-full">
        <DashboardSidebar />
        <SidebarInset>
          <header className="flex h-12 items-center border-b border-border px-4 shrink-0 gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <img src={logo} alt="Autonomux" className="w-7 h-7 shrink-0" />
            <span className="text-gradient text-lg font-medium font-display">Autonomux</span>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-x-hidden overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
