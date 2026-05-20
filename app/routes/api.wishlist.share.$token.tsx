import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { resolveSharedItems } from "../lib/wishlist-api.server";

/** PDF-style JSON: GET /api/wishlist/share/{token} */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const token = params.token;
  if (!token) throw new Response("Not found", { status: 404 });
  try {
    const { shop, items } = await resolveSharedItems(token);
    return json({
      shop,
      items: items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        productImage: i.productImage,
        productHandle: i.productHandle,
        price: i.price,
        compareAtPrice: i.compareAtPrice,
        availability: i.availability,
      })),
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    throw new Response("Not found", { status: 404 });
  }
};
