import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Instagram, ExternalLink, RefreshCw, Heart, MessageCircle, Film, Images } from "lucide-react";
import { toast } from "sonner";

import { listInstagramPosts, refreshInstagramProfile, listInstagramProfiles } from "@/lib/instagram.functions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { relativeTime } from "@/lib/format";

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "Posts — InstaBot" },
      { name: "description", content: "Publicações reais do Instagram conectado via Meta Graph API." },
    ],
  }),
  component: PostsPage,
});

function PostsPage() {
  const listPostsFn = useServerFn(listInstagramPosts);
  const listProfilesFn = useServerFn(listInstagramProfiles);
  const refreshFn = useServerFn(refreshInstagramProfile);

  const { data: profiles } = useQuery({
    queryKey: ["ig-profiles"],
    queryFn: () => listProfilesFn(),
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ig-posts"],
    queryFn: () => listPostsFn({ data: { limit: 30 } }),
  });

  const profile = profiles?.[0];
  const posts = data?.posts ?? [];

  async function handleRefresh() {
    if (!profile) return;
    toast.info("Sincronizando com Instagram...");
    try {
      await refreshFn({ data: { igBusinessId: profile.ig_business_id } });
      await refetch();
      toast.success("Perfil atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao sincronizar");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Publicações"
        title="Posts do Instagram"
        subtitle="Dados reais puxados via Meta Graph API"
        actions={
          <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
        }
      />

      <div className="space-y-6 p-6">
        {profile && (
          <Card className="flex flex-wrap items-center gap-4 p-4">
            <img
              src={profile.profile_picture_url ?? ""}
              alt={profile.ig_username}
              className="h-16 w-16 rounded-full border-2 border-primary/40 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-primary" />
                <span className="font-semibold">@{profile.ig_username}</span>
                <Badge variant="secondary" className="text-xs">Business</Badge>
              </div>
              <div className="mt-0.5 truncate text-sm text-muted-foreground">{profile.ig_name}</div>
            </div>
            <div className="flex gap-6 text-sm">
              <Stat label="Seguidores" value={profile.followers_count?.toLocaleString("pt-BR") ?? "—"} />
              <Stat label="Posts" value={String(profile.media_count ?? "—")} />
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Nenhum post encontrado. Publique algo no Instagram e clique em Sincronizar.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((p) => (
              <Card key={p.id} className="overflow-hidden transition hover:shadow-md">
                <div className="relative aspect-square bg-muted">
                  {p.media_url && (
                    <img
                      src={p.thumbnail_url ?? p.media_url}
                      alt={p.caption.slice(0, 80)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute right-2 top-2">
                    <Badge className="bg-black/60 text-white backdrop-blur">
                      {p.media_type === "VIDEO" ? <Film className="mr-1 h-3 w-3" /> :
                        p.media_type === "CAROUSEL_ALBUM" ? <Images className="mr-1 h-3 w-3" /> :
                          <Instagram className="mr-1 h-3 w-3" />}
                      {p.media_type === "CAROUSEL_ALBUM" ? "Carrossel" : p.media_type === "VIDEO" ? "Reel" : "Foto"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <p className="mb-3 line-clamp-2 text-sm">{p.caption || <em className="text-muted-foreground">sem legenda</em>}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {p.like_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {p.comments_count}</span>
                    </div>
                    <span>{relativeTime(p.timestamp)}</span>
                  </div>
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver no Instagram <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
