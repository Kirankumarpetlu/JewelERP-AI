import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout() {
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="orb-float absolute -left-24 top-10 h-96 w-96 rounded-full bg-white/[0.12] blur-[120px]" />
        <div className="orb-float-delayed absolute right-[-7rem] top-[-4rem] h-[30rem] w-[30rem] rounded-full bg-slate-300/10 blur-[130px]" />
        <div className="pulse-drift absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-200/8 blur-[140px]" />
        <div className="orb-float-delayed absolute left-[34%] top-[18%] h-72 w-72 rounded-full bg-blue-200/5 blur-[110px]" />
        <div className="dynamic-mesh mesh-drift absolute inset-0 opacity-35" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_18%),linear-gradient(145deg,rgba(3,3,3,0.78),rgba(7,12,19,0.48),rgba(2,2,2,0.92))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,rgba(255,255,255,0.015)_72%,rgba(255,255,255,0.05))]" />
      </div>
      <AppSidebar />
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
