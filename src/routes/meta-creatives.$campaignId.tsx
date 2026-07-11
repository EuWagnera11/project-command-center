import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/meta-creatives/$campaignId")({
  head: () => ({
    meta: [
      { title: "AdSets & Criativos — InstaBot" },
      { name: "description", content: "Preview visual dos criativos da campanha." },
    ],
  }),
  component: Page,
});

function Page() {
  const { campaignId } = Route.useParams();
  const { data: campaigns } = useQuery({ queryKey: ["meta-campaigns"], queryFn: () => api.metaCampaigns() });
  const { data: adsets, isLoading } = useQuery({
    queryKey: ["adsets-with-ads", campaignId],
    queryFn: () => api.campaignAdsetsWithAds(campaignId),
  });
  const campaign = campaigns?.find((c) => c.id === campaignId);

  return (
    <div>
      <PageHeader
        eyebrow="Criativos"
        title={campaign?.name ?? "Campanha"}
        subtitle={campaign?.ad_account_name}
        actions={
          <Button asChild variant="outline">
            <Link to="/meta-creatives"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
          </Button>
        }
      />

      <div className="space-y-8 p-6">
        {isLoading && <div className="text-sm text-muted-foreground">Carregando criativos…</div>}
        {(adsets ?? []).map(({ adset, ads }) => (
          <div key={adset.id}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-lg font-semibold">{adset.name}</h3>
              <Badge variant="outline">{adset.status}</Badge>
              {adset.daily_budget != null && (
                <Badge variant="outline">R$ {adset.daily_budget}/dia</Badge>
              )}
              <span className="ml-auto text-sm text-muted-foreground">
                {ads.length} {ads.length === 1 ? "criativo" : "criativos"}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ads.map((ad) => (
                <Card key={ad.id} className="overflow-hidden">
                  <div className="aspect-square overflow-hidden bg-muted">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">Sem preview</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1 truncate text-sm font-medium">{ad.name}</div>
                      <Badge variant="outline" className="text-[10px]">{ad.status}</Badge>
                    </div>
                    {ad.title && <p className="mt-1 truncate text-xs font-medium">{ad.title}</p>}
                    {ad.body && <p className="line-clamp-2 text-[11px] text-muted-foreground">{ad.body}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {!isLoading && (adsets ?? []).length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">Nenhum AdSet encontrado nesta campanha.</Card>
        )}
      </div>
    </div>
  );
}
