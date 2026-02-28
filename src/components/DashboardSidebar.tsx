import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import {
  LayoutDashboard, Bot, History, CreditCard, KeyRound, Settings, LogOut, Sun, Moon, ChevronUp, BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


const links = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Agents", href: "/dashboard/agents", icon: Bot },
  { label: "Run History", href: "/dashboard/runs", icon: History },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { label: "Credentials", href: "/dashboard/credentials", icon: KeyRound },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const statusConfig = {
  connected: { color: "bg-success", label: "Live" },
  reconnecting: { color: "bg-warning animate-pulse", label: "Reconnecting..." },
  disconnected: { color: "bg-destructive", label: "Disconnected" },
} as const;

const DashboardSidebar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const realtimeStatus = useRealtimeStatus();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("autonomux-theme", dark ? "dark" : "light");
  }, [dark]);

  const initials = user?.email?.charAt(0).toUpperCase() ?? "U";
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User";

  return (
    <Sidebar collapsible="icon">
      {/* Spacer to align with header height */}
      <SidebarHeader className="h-12 shrink-0" />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton asChild tooltip={link.label}>
                    <NavLink
                      to={link.href}
                      end={link.href === "/dashboard"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                    >
                      <link.icon className="shrink-0" />
                      <span>{link.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: status + user menu */}
      <SidebarFooter>
        {/* Realtime status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-sidebar-foreground/50">
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig[realtimeStatus].color}`} />
              {!collapsed && <span>{statusConfig[realtimeStatus].label}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">Real-time connection status</TooltipContent>
        </Tooltip>

        <SidebarSeparator />

        {/* User dropdown */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-medium shrink-0">
                    {initials}
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate leading-tight">{displayName}</p>
                      <p className="text-xs text-sidebar-foreground/50 truncate leading-tight">{user?.email}</p>
                    </div>
                  )}
                  {!collapsed && <ChevronUp className="ml-auto shrink-0 opacity-50" />}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuItem onClick={() => setDark(!dark)}>
                  {dark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  {dark ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => { await signOut(); navigate("/"); }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
};

export default DashboardSidebar;
