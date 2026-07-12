import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { listRealAdSetsWithAds } from "@/lib/meta-ads.functions";
import { listRealCampaigns } from "@/lib/meta-ads.functions";
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
  const adsetsFn = useServerFn(listRealAdSetsWithAds);
  const campsFn = useServerFn(listRealCampaigns);
  const { data: campaigns } = useQuery({ queryKey: ["meta-camps-real", "creatives"], queryFn: () => campsFn({ data: { days: 7 } }) });
  const { data: adsets, isLoading } = useQuery({
    queryKey: ["adsets-real", campaignId],
    queryFn: () => adsetsFn({ data: { campaignId } }),
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
                <Badge variant="outline">R$ {adset.daily_budget.toFixed(2)}/dia</Badge>
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
                    <a
                      href={`https://business.facebook.com/adsmanager/manage/ads?selected_ad_ids=${ad.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      Ver no Ads Manager <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </Card>
              ))}
              {ads.length === 0 && <div className="text-sm text-muted-foreground">Nenhum ad neste conjunto.</div>}
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
