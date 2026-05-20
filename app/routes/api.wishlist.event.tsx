import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { corsHeaders, logWishlistEvent } from "../lib/wishlist-api.server";

/**
 * Storefront analytics for guests (and optional page views) without mutating wishlist rows.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    const shop = new URL(request.url).searchParams.get("shop") || "";
    return new Response(null, { status: 204, headers: corsHeaders(shop) });
  }
  const body = await request.json();
  const shop = String(body.shop || "");
  const type = String(body.type || "");
  if (!shop || !type) {
    return json({ error: "Missing shop or type" }, { status: 400, headers: corsHeaders(shop) });
  }
  await logWishlistEvent({
    shop,
    type,
    customerId: body.customerId ?? null,
    guestId: body.guestId ?? null,
    productId: body.productId ?? null,
    variantId: body.variantId ?? null,
    sourcePage: body.sourcePage ?? null,
  });
  return json({ ok: true }, { headers: corsHeaders(shop) });
};
