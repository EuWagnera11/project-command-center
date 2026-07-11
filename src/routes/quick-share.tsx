import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/quick-share")({
  head: () => ({
    meta: [
      { title: "Quick Share — InstaBot" },
      { name: "description", content: "Gere links de compartilhamento e QR codes para contas Meta Ads." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: accounts } = useQuery({ queryKey: ["meta-accounts"], queryFn: () => api.metaAccounts() });
  const [qrFor, setQrFor] = useState<{ name: string; url: string } | null>(null);

  const buildLink = (accountId: string) =>
    `${window.location.origin}/client/${btoa(`meta:${accountId}`)}`;

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <div>
      <PageHeader eyebrow="Compartilhamento" title="⚡ Quick Share" subtitle="Gere links rápidos e QR codes por conta Meta Ads" />
      <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        {(accounts ?? []).map((a) => {
          const url = buildLink(a.id);
          return (
            <Card key={a.id} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-ig text-white">
                  <Share2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.business_name}</div>
                </div>
                <Badge variant="outline">{a.currency}</Badge>
              </div>

              <div className="mb-3 rounded-md border bg-muted/40 p-2 font-mono text-[11px] break-all">
                {url}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(url)}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
                </Button>
                <Button size="sm" onClick={() => setQrFor({ name: a.name, url })}>
                  <QrCode className="mr-1 h-3.5 w-3.5" /> QR Code
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>{qrFor?.name}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrFor && (
              <div className="rounded-lg bg-white p-4">
                <QRCodeCanvas value={qrFor.url} size={200} />
              </div>
            )}
            <p className="text-center text-xs text-muted-foreground break-all">{qrFor?.url}</p>
            <Button variant="outline" size="sm" onClick={() => qrFor && copy(qrFor.url)}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copiar link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
