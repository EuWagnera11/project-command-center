import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";
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
  const { data: campaigns } = useQuery({ queryKey: ["meta-campaigns"], queryFn: () => api.metaCampaigns() });

  return (
    <div>
      <PageHeader eyebrow="Meta Ads" title="🖼️ Criativos" subtitle="Escolha uma campanha para ver seus AdSets e Ads" />
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
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
              <div className="flex gap-2">
                <Badge variant="outline">{c.status}</Badge>
                <Badge variant="outline">{c.objective}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
