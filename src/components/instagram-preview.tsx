import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function InstagramPreview({
  username = "wagner.constanteads",
  avatarUrl,
  imageUrl,
  caption,
  className,
}: {
  username?: string;
  avatarUrl?: string;
  imageUrl: string;
  caption: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border bg-card shadow-lg", className)}>
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <div className="rounded-full bg-gradient-ig p-0.5">
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-background bg-muted">
            {avatarUrl && <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{username}</div>
          <div className="truncate text-[11px] text-muted-foreground">Patrocinado · Agora</div>
        </div>
      </div>
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center gap-4 px-3 pt-2 text-foreground">
        <Heart className="h-5 w-5" />
        <MessageCircle className="h-5 w-5" />
        <Send className="h-5 w-5" />
        <Bookmark className="ml-auto h-5 w-5" />
      </div>
      <div className="px-3 py-2 text-sm">
        <div className="text-xs font-semibold">1.234 curtidas</div>
        <div className="mt-1 line-clamp-3 text-sm">
          <span className="font-semibold">{username}</span> <span className="text-muted-foreground">{caption}</span>
        </div>
      </div>
    </div>
  );
}
