import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import DashboardSidebar from "./DashboardSidebar";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
