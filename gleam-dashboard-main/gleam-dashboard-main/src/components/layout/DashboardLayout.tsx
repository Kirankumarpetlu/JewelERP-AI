import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen w-full bg-background" style={{ background: 'radial-gradient(ellipse at 20% 50%, hsl(270 30% 8%) 0%, hsl(240 10% 6%) 60%), radial-gradient(ellipse at 80% 20%, hsl(43 30% 8%) 0%, transparent 50%)' }}>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
