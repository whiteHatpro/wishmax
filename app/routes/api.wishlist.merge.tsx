import type { ActionFunctionArgs } from "@remix-run/node";
import { handleWishlistPost, corsHeaders } from "../lib/wishlist-api.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    const shop = new URL(request.url).searchParams.get("shop") || "";
    return new Response(null, { status: 204, headers: corsHeaders(shop) });
  }
  const body = await request.json();
  return handleWishlistPost(request, { ...body, action: "merge" });
};
