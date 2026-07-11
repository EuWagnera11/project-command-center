import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ListChecks, PlusCircle, Package, CalendarDays,
  Settings, BarChart3, Moon, Sun, Instagram, Link2, Building2,
} from "lucide-react";

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

const nav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Posts", url: "/posts", icon: ListChecks },
  { title: "Agendar", url: "/schedule", icon: PlusCircle },
  { title: "Em Massa", url: "/bulk", icon: Package },
  { title: "Calendário", url: "/calendar", icon: CalendarDays },
] as const;

const ads = [
  { title: "Meta Ads", url: "/meta-dashboard", icon: BarChart3 },
] as const;

const agency = [
  { title: "Agências", url: "/organizacoes", icon: Building2 },
  { title: "Links do cliente", url: "/shared-links", icon: Link2 },
] as const;

const system = [
  { title: "Configurações", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggle } = useTheme();
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-ig text-white shadow-glow">
            <Instagram className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold tracking-tight">InstaBot</div>
              <div className="truncate text-[11px] font-medium text-muted-foreground">Auto-Poster</div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {[
          { label: "Workspace", items: nav },
          { label: "Anúncios", items: ads },
          { label: "Agência", items: agency },
          { label: "Sistema", items: system },
        ].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t p-3">
        {!collapsed && (
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Scheduler ativo
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">2 de 3 contas conectadas</div>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={toggle} className="justify-start gap-2">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function StatusPill({ children, tone = "default" }: { children: React.ReactNode; tone?: "success" | "warning" | "danger" | "default" }) {
  const map = {
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning-foreground border-warning/40",
    danger: "bg-destructive/10 text-destructive border-destructive/30",
    default: "bg-muted text-muted-foreground border-border",
  } as const;
  return <Badge variant="outline" className={`gap-1.5 rounded-full font-medium ${map[tone]}`}>{children}</Badge>;
}
