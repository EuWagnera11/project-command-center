import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar, StatusPill } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsBell } from "@/components/notifications-bell";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-90"
          >
            Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Algo quebrou.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente recarregar ou volte para o painel.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Dashboard — InstaBot" },
      { name: "description", content: "Visão geral: posts agendados, publicações, campanhas Meta Ads e alertas em tempo real." },
      { name: "author", content: "InstaBot" },
      { property: "og:title", content: "Dashboard — InstaBot" },
      { property: "og:description", content: "Visão geral: posts agendados, publicações, campanhas Meta Ads e alertas em tempo real." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Dashboard — InstaBot" },
      { name: "twitter:description", content: "Visão geral: posts agendados, publicações, campanhas Meta Ads e alertas em tempo real." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/35deb810-f04f-4587-929f-cd6b429b9eb1/id-preview-07a713d1--ad3ed95f-ca75-492d-9181-6d25af06d3b3.lovable.app-1783760805179.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/35deb810-f04f-4587-929f-cd6b429b9eb1/id-preview-07a713d1--ad3ed95f-ca75-492d-9181-6d25af06d3b3.lovable.app-1783760805179.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = pathname.startsWith("/client/");

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {isPublic ? (
          <>
            <Outlet />
            <Toaster position="bottom-right" richColors />
          </>
        ) : (
          <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
                  <SidebarTrigger />
                  <div className="hidden items-center gap-2 sm:flex">
                    <StatusPill tone="success">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                      </span>
                      Scheduler Ativo
                    </StatusPill>
                    <StatusPill tone="success">Meta Ads · 60s</StatusPill>
                    <StatusPill tone="warning">IG 2/3</StatusPill>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <CommandPaletteTrigger />
                    <span className="hidden text-xs text-muted-foreground sm:inline">Atualizado agora</span>
                    <NotificationsBell />
                  </div>
                </header>
                <main className="min-w-0 flex-1">
                  <Outlet />
                </main>
                <CommandPalette />
              </div>
            </div>
            <Toaster position="bottom-right" richColors />
          </SidebarProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
