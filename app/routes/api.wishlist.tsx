import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

function cors(shop: string) {
  return {
    "Access-Control-Allow-Origin": `https://${shop}`,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  const customerId = url.searchParams.get("customerId") || "";
  if (!shop || !customerId) return json({ error: "Missing params" }, { status: 400 });
  const items = await prisma.wishlistItem.findMany({ where: { shop, customerId }, orderBy: { addedAt: "desc" } });
  return json({ items }, { headers: cors(shop) });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    const shop = new URL(request.url).searchParams.get("shop") || "";
    return new Response(null, { status: 204, headers: cors(shop) });
  }
  const body = await request.json();
  const { action, shop, customerId, variantId } = body;
  const h = cors(shop || "");
  if (!shop || !customerId || !action) return json({ error: "Missing fields" }, { status: 400, headers: h });

  if (action === "add") {
    const item = await prisma.wishlistItem.upsert({
      where: { shop_customerId_variantId: { shop, customerId, variantId: String(variantId) } },
      update: { price: body.price, availability: body.availability ?? true },
      create: { shop, customerId, productId: body.productId, variantId: String(variantId), productTitle: body.productTitle, variantTitle: body.variantTitle, productImage: body.productImage, productHandle: body.productHandle, price: body.price, compareAtPrice: body.compareAtPrice, availability: body.availability ?? true, sourcePage: body.sourcePage },
    });
    return json({ success: true, item }, { headers: h });
  }

  if (action === "remove") {
    await prisma.wishlistItem.deleteMany({ where: { shop, customerId, variantId: String(variantId) } });
    return json({ success: true }, { headers: h });
  }

  if (action === "merge") {
    const guestItems: any[] = body.guestItems || [];
    for (const item of guestItems) {
      await prisma.wishlistItem.upsert({
        where: { shop_customerId_variantId: { shop, customerId, variantId: String(item.variantId) } },
        update: {},
        create: { shop, customerId, ...item, variantId: String(item.variantId) },
      });
    }
    return json({ success: true, merged: guestItems.length }, { headers: h });
  }

  return json({ error: "Unknown action" }, { status: 400, headers: h });
};
