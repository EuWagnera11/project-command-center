import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Image as ImageIcon, ArrowRight } from "lucide-react";

import { listRealCampaigns } from "@/lib/meta-ads.functions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/meta-creatives")({
  head: () => ({
    meta: [
      { title: "Criativos Meta Ads — InstaBot" },
      { name: "description", content: "Explore AdSets e criativos de cada campanha Meta Ads." },
    ],
  }),
  component: Page,
});

function Page() {
  const campsFn = useServerFn(listRealCampaigns);
  const { data: campaigns, isLoading } = useQuery({ queryKey: ["meta-camps-real", "creatives"], queryFn: () => campsFn({ data: { days: 7 } }) });

  return (
    <div>
      <PageHeader eyebrow="Meta Ads" title="🖼️ Criativos" subtitle="Escolha uma campanha para ver seus AdSets e Ads" />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <Card className="p-12 text-center text-sm text-muted-foreground md:col-span-2 lg:col-span-3">Carregando campanhas…</Card>}
        {(campaigns ?? []).map((c) => (
          <Link key={c.id} to="/meta-creatives/$campaignId" params={{ campaignId: c.id }} className="group">
            <Card className="p-5 transition hover:border-primary/60 hover:shadow-lg">
              <div className="mb-3 flex items-center gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.ad_account_name}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{c.effective_status}</Badge>
                <Badge variant="outline">{c.objective}</Badge>
                {c.insights && <Badge variant="secondary">R$ {c.insights.spend.toFixed(2)} · {c.insights.ctr.toFixed(2)}%</Badge>}
              </div>
            </Card>
          </Link>
        ))}
        {!isLoading && (campaigns ?? []).length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
            Nenhuma campanha encontrada nas contas de anúncio conectadas.
          </Card>
        )}
      </div>
    </div>
  );
}
