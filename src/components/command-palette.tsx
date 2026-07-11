import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, ListChecks, PlusCircle, Package, CalendarDays, LineChart,
  FolderOpen, Inbox, BarChart3, ImageIcon, Bot, MessageSquare, Workflow,
  CheckCheck, FlaskConical, Sparkles, History, Building2, Link2, Zap,
  Settings, ShieldCheck, Search, Palette, KeyRound,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; group: string };

const items: Item[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Workspace" },
  { title: "Posts", url: "/posts", icon: ListChecks, group: "Workspace" },
  { title: "Agendar post", url: "/schedule", icon: PlusCircle, group: "Workspace" },
  { title: "Agendar em massa", url: "/bulk", icon: Package, group: "Workspace" },
  { title: "Calendário", url: "/calendar", icon: CalendarDays, group: "Workspace" },
  { title: "Analytics", url: "/analytics", icon: LineChart, group: "Workspace" },
  { title: "Biblioteca de mídia", url: "/media-library", icon: FolderOpen, group: "Workspace" },
  { title: "Inbox", url: "/inbox", icon: Inbox, group: "Workspace" },
  { title: "Meta Ads Dashboard", url: "/meta-dashboard", icon: BarChart3, group: "Anúncios" },
  { title: "Criativos Meta", url: "/meta-creatives", icon: ImageIcon, group: "Anúncios" },
  { title: "IA Manager", url: "/ai-manager", icon: Bot, group: "IA" },
  { title: "Chat IA", url: "/ai-chat", icon: MessageSquare, group: "IA" },
  { title: "Regras de automação", url: "/rules", icon: Workflow, group: "IA" },
  { title: "Fila de aprovação", url: "/approvals", icon: CheckCheck, group: "IA" },
  { title: "A/B Tests", url: "/ab-tests", icon: FlaskConical, group: "IA" },
  { title: "Freepik Studio", url: "/freepik-studio", icon: Sparkles, group: "IA" },
  { title: "Histórico", url: "/history", icon: History, group: "IA" },
  { title: "Agências", url: "/organizacoes", icon: Building2, group: "Agência" },
  { title: "Links do cliente", url: "/shared-links", icon: Link2, group: "Agência" },
  { title: "Quick Share", url: "/quick-share", icon: Zap, group: "Agência" },
  { title: "Configurações", url: "/settings", icon: Settings, group: "Sistema" },
  { title: "Audit Logs", url: "/audit", icon: ShieldCheck, group: "Sistema" },
];

let openFn: (() => void) | null = null;

export function CommandPaletteTrigger() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openFn?.()}
      className="hidden h-8 gap-2 pl-2 pr-3 text-xs text-muted-foreground md:inline-flex"
    >
      <Search className="h-3.5 w-3.5" />
      Buscar…
      <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
    </Button>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    openFn = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      openFn = null;
    };
  }, []);

  const groups = Array.from(new Set(items.map((i) => i.group)));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar página, ação ou configuração…" />
      <CommandList>
        <CommandEmpty>Nenhum resultado.</CommandEmpty>
        {groups.map((g, gi) => (
          <div key={g}>
            {gi > 0 && <CommandSeparator />}
            <CommandGroup heading={g}>
              {items.filter((i) => i.group === g).map((i) => (
                <CommandItem
                  key={i.url}
                  value={`${i.title} ${i.group}`}
                  onSelect={() => {
                    setOpen(false);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    navigate({ to: i.url as any });
                  }}
                >
                  <i.icon className="mr-2 h-4 w-4" />
                  {i.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Atalhos">
          <CommandItem disabled>
            Alternar sidebar <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            Abrir busca <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
