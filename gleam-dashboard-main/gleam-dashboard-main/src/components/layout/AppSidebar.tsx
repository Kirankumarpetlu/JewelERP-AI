import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, Users,
  BarChart3, Lightbulb, MessageCircle, FileText, Settings, BriefcaseBusiness,
  ChevronLeft, ChevronRight, ChevronDown
} from "lucide-react";

const navGroups = [
  {
    label: "Business",
    items: [
      { title: "Dashboard", path: "/", icon: LayoutDashboard },
      { title: "POS / Billing", path: "/pos", icon: ShoppingCart },
      { title: "Inventory", path: "/inventory", icon: Package },
      { title: "Orders", path: "/orders", icon: ClipboardList },
    ],
  },
  {
    label: "Customers",
    items: [
      { title: "Customers", path: "/customers", icon: Users },
    ],
  },
  {
    label: "Workforce",
    items: [
      { title: "Employees", path: "/employees", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "Analytics", path: "/analytics", icon: BarChart3 },
      { title: "AI Insights", path: "/ai-insights", icon: Lightbulb },
      { title: "AI Assistant", path: "/ai-assistant", icon: MessageCircle },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Reports", path: "/reports", icon: FileText },
      { title: "Settings", path: "/settings", icon: Settings },
    ],
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(navGroups.map(g => [g.label, true]))
  );

  const toggleGroup = (label: string) => {
    if (collapsed) return;
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <aside
      className={`${collapsed ? "w-[72px]" : "w-64"} relative z-10 h-screen flex flex-col transition-all duration-300 shrink-0 overflow-hidden border-r border-white/[0.1] backdrop-blur-[34px] shadow-[18px_0_70px_rgba(0,0,0,0.34)] before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.02)_16%,rgba(8,10,15,0.7)_100%)] before:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-white/[0.1] after:pointer-events-none`}
    >
      <div className="h-16 flex items-center px-4 border-b border-white/[0.06] gap-3">
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-display text-lg font-semibold gold-text whitespace-nowrap pl-1"
          >
            ERP.ai
          </motion.span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-1">
        {navGroups.map(group => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-white/60 uppercase tracking-[0.18em] hover:text-white/88 transition-colors"
              >
                {group.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openGroups[group.label] ? "" : "-rotate-90"}`} />
              </button>
            )}
            <AnimatePresence initial={false}>
              {(collapsed || openGroups[group.label]) && (
                <motion.div
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {group.items.map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${active ? "active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <button
        onClick={() => setCollapsed(c => !c)}
        className="h-12 flex items-center justify-center border-t border-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
