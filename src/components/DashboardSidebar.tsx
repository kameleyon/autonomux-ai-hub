import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Bot, History, CreditCard, KeyRound, Settings,
} from "lucide-react";

const links = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Agents", href: "/dashboard/agents", icon: Bot },
  { label: "Run History", href: "/dashboard/runs", icon: History },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Credentials", href: "/dashboard/credentials", icon: KeyRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const DashboardSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {links.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === "/dashboard"}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-sidebar border-t border-sidebar-border flex justify-around py-2">
        {links.slice(0, 5).map((link) => {
          const active = link.href === "/dashboard"
            ? location.pathname === "/dashboard"
            : location.pathname.startsWith(link.href);
          return (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === "/dashboard"}
              className={`flex flex-col items-center gap-0.5 text-[10px] py-1 px-2 ${
                active ? "text-accent" : "text-sidebar-foreground/50"
              }`}
              activeClassName=""
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default DashboardSidebar;
