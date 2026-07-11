import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { relativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, refetch } = useQuery({
    queryKey: ["notifications", "bell"],
    queryFn: () => api.listNotifications(20),
    refetchInterval: 30_000,
  });
  const unread = notifications?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle>Notificações</SheetTitle>
          <Button variant="ghost" size="sm" onClick={async () => { await api.clearNotifications(); toast.success("Limpo"); refetch(); }}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        </SheetHeader>
        <ul className="mt-4 space-y-2">
          {(notifications ?? []).map((n, i) => (
            <li key={i} className="rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  n.level === "error" ? "bg-destructive" : n.level === "warn" ? "bg-warning" : "bg-success"
                }`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{n.title}</div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(n.timestamp)}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{n.message}</div>
                </div>
              </div>
            </li>
          ))}
          {(!notifications || notifications.length === 0) && (
            <li className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Sem notificações no momento.
            </li>
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
