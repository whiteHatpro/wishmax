import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { corsHeaders, handleWishlistGet, handleWishlistPost } from "../lib/wishlist-api.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const customerId = url.searchParams.get("customerId") || "";
  return handleWishlistGet(shop, customerId);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    const shop = new URL(request.url).searchParams.get("shop") || "";
    return new Response(null, { status: 204, headers: corsHeaders(shop) });
  }
  const body = await request.json();
  return handleWishlistPost(request, body);
};
