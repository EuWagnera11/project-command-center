import { createFileRoute } from "@tanstack/react-router";

const GRAPH = "https://graph.facebook.com/v21.0";

async function g(path: string, params: Record<string, string>) {
  const token = process.env.META_ACCESS_TOKEN!;
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const r = await fetch(url.toString());
  return r.json();
}

export const Route = createFileRoute("/api/diag-meta")({
  server: {
    handlers: {
      GET: async () => {
        const [pages, businesses, me] = await Promise.all([
          g("/me/accounts", { fields: "id,name,instagram_business_account{id,username,name}", limit: "200" }),
          g("/me/businesses", { fields: "id,name" }),
          g("/me", { fields: "id,name" }),
        ]);
        return new Response(JSON.stringify({ me, pages, businesses }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
