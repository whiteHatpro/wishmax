import { json } from "@remix-run/node";
import { randomBytes } from "node:crypto";
import type { WishlistItem } from "@prisma/client";
import prisma from "../db.server";
import { notifyFlowWishlistActivity } from "./flow-trigger.server";
import { getApiKeyFromRequest, verifyHeadlessApiKey } from "./headless-auth.server";

export function corsHeaders(shop: string) {
  return {
    "Access-Control-Allow-Origin": `https://${shop}`,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Wishmax-Guest-Id, X-Wishmax-Key",
  };
}

function isTruthyCustomerId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id !== "null" && id !== "undefined";
}

export async function logWishlistEvent(data: {
  shop: string;
  type: string;
  customerId?: string | null;
  guestId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  sourcePage?: string | null;
}) {
  await prisma.wishlistEvent.create({
    data: {
      shop: data.shop,
      type: data.type,
      customerId: data.customerId ?? undefined,
      guestId: data.guestId ?? undefined,
      productId: data.productId ?? undefined,
      variantId: data.variantId ?? undefined,
      sourcePage: data.sourcePage ?? undefined,
    },
  });
}

async function getConfig(shop: string) {
  return prisma.wishlistConfig.findUnique({ where: { shop } });
}

function guestItemsToWishlistShape(
  shop: string,
  raw: Record<string, unknown>[]
): Partial<WishlistItem>[] {
  return raw.map((item) => ({
    id: `guest-${item.variantId}`,
    shop,
    customerId: "guest",
    productId: String(item.productId ?? ""),
    variantId: String(item.variantId ?? ""),
    productTitle: String(item.productTitle ?? "Product"),
    variantTitle: item.variantTitle != null ? String(item.variantTitle) : null,
    productImage: item.productImage != null ? String(item.productImage) : null,
    productHandle: String(item.productHandle ?? ""),
    price: String(item.price ?? ""),
    compareAtPrice: item.compareAtPrice != null ? String(item.compareAtPrice) : null,
    availability: item.availability !== false,
    sourcePage: item.sourcePage != null ? String(item.sourcePage) : null,
    addedAt: item.addedAt ? new Date(String(item.addedAt)) : new Date(),
  })) as Partial<WishlistItem>[];
}

export async function handleWishlistGet(shop: string, customerId: string) {
  if (!shop || !customerId) return json({ error: "Missing params" }, { status: 400 });
  const items = await prisma.wishlistItem.findMany({
    where: { shop, customerId },
    orderBy: { addedAt: "desc" },
  });
  return json({ items }, { headers: corsHeaders(shop) });
}

/** Shared POST handler for /api/wishlist and PDF-style /api/wishlist/* aliases */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleWishlistPost(request: Request, body: Record<string, any>) {
  const { action, shop } = body;
  const h = corsHeaders(shop || "");
  const customerIdRaw = body.customerId;
  const customerId = isTruthyCustomerId(customerIdRaw) ? String(customerIdRaw) : null;
  const guestId = body.guestId != null ? String(body.guestId) : null;

  if (!shop || !action) return json({ error: "Missing fields" }, { status: 400, headers: h });

  const cfg = await getConfig(shop);

  const presentedKey = getApiKeyFromRequest(request);
  const requireKey = cfg?.requireApiKeyForMutations === true;
  if (requireKey || presentedKey !== null) {
    const valid = await verifyHeadlessApiKey(shop, presentedKey);
    if (!valid) {
      return json(
        { error: requireKey ? "API key required" : "Invalid API key" },
        { status: 401, headers: h }
      );
    }
  }

  if (action === "add") {
    if (!customerId) return json({ error: "customerId required for add" }, { status: 400, headers: h });
    const variantId = String(body.variantId ?? "");
    if (!variantId) return json({ error: "variantId required" }, { status: 400, headers: h });

    const item = await prisma.wishlistItem.upsert({
      where: { shop_customerId_variantId: { shop, customerId, variantId } },
      update: {
        price: body.price,
        availability: body.availability ?? true,
        productTitle: body.productTitle,
        variantTitle: body.variantTitle,
        productImage: body.productImage,
        productHandle: body.productHandle,
        compareAtPrice: body.compareAtPrice,
        sourcePage: body.sourcePage,
      },
      create: {
        shop,
        customerId,
        productId: String(body.productId ?? ""),
        variantId,
        productTitle: body.productTitle ?? "",
        variantTitle: body.variantTitle ?? null,
        productImage: body.productImage ?? null,
        productHandle: body.productHandle ?? "",
        price: body.price ?? "",
        compareAtPrice: body.compareAtPrice ?? null,
        availability: body.availability ?? true,
        sourcePage: body.sourcePage ?? null,
      },
    });
    await logWishlistEvent({
      shop,
      type: "wishlist_added",
      customerId,
      productId: String(body.productId ?? ""),
      variantId,
      sourcePage: body.sourcePage ?? null,
    });
    if (cfg?.flowAutomationEnabled !== false) {
      await notifyFlowWishlistActivity(shop, true, {
        eventtype: "wishlist_added",
        customerid: customerId,
        variantid: variantId,
        productid: String(body.productId ?? ""),
        sourcepage: body.sourcePage ?? "",
      });
    }
    return json({ success: true, item }, { headers: h });
  }

  if (action === "remove") {
    if (!customerId) return json({ error: "customerId required for remove" }, { status: 400, headers: h });
    await prisma.wishlistItem.deleteMany({
      where: { shop, customerId, variantId: String(body.variantId ?? "") },
    });
    await logWishlistEvent({
      shop,
      type: "wishlist_removed",
      customerId,
      variantId: String(body.variantId ?? ""),
      sourcePage: body.sourcePage ?? null,
    });
    if (cfg?.flowAutomationEnabled !== false) {
      await notifyFlowWishlistActivity(shop, true, {
        eventtype: "wishlist_removed",
        customerid: customerId,
        variantid: String(body.variantId ?? ""),
      });
    }
    return json({ success: true }, { headers: h });
  }

  if (action === "merge") {
    if (!customerId) return json({ error: "customerId required for merge" }, { status: 400, headers: h });
    const guestItems: Record<string, unknown>[] = body.guestItems || [];
    for (const gi of guestItems) {
      const vid = String((gi as { variantId?: string }).variantId ?? "");
      if (!vid) continue;
      await prisma.wishlistItem.upsert({
        where: { shop_customerId_variantId: { shop, customerId, variantId: vid } },
        update: {},
        create: {
          shop,
          customerId,
          productId: String((gi as { productId?: string }).productId ?? ""),
          variantId: vid,
          productTitle: String((gi as { productTitle?: string }).productTitle ?? ""),
          variantTitle: (gi as { variantTitle?: string }).variantTitle ?? null,
          productImage: (gi as { productImage?: string }).productImage ?? null,
          productHandle: String((gi as { productHandle?: string }).productHandle ?? ""),
          price: String((gi as { price?: string }).price ?? ""),
          compareAtPrice: (gi as { compareAtPrice?: string }).compareAtPrice ?? null,
          availability: (gi as { availability?: boolean }).availability ?? true,
          sourcePage: (gi as { sourcePage?: string }).sourcePage ?? null,
        },
      });
    }
    await logWishlistEvent({
      shop,
      type: "guest_merge",
      customerId,
      sourcePage: "merge",
    });
    return json({ success: true, merged: guestItems.length }, { headers: h });
  }

  if (action === "share") {
    if (cfg && cfg.allowShare === false) {
      return json({ error: "Sharing is disabled for this store." }, { status: 403, headers: h });
    }
    const origin = new URL(request.url).origin;

    if (customerId) {
      const token = randomBytes(24).toString("hex");
      const share = await prisma.wishlistShare.upsert({
        where: { shop_customerId: { shop, customerId } },
        create: { shop, customerId, token },
        update: {},
      });
      await logWishlistEvent({ shop, type: "wishlist_shared", customerId, sourcePage: "share" });
      if (cfg?.flowAutomationEnabled !== false) {
        await notifyFlowWishlistActivity(shop, true, {
          eventtype: "wishlist_shared",
          customerid: customerId,
          sharetoken: share.token,
        });
      }
      return json({ success: true, shareUrl: `${origin}/share/${share.token}` }, { headers: h });
    }

    if (guestId && cfg?.allowGuest !== false) {
      const guestItems: Record<string, unknown>[] = body.guestItems || [];
      if (guestItems.length === 0) {
        return json({ error: "guestItems required for guest share" }, { status: 400, headers: h });
      }
      const token = randomBytes(24).toString("hex");
      const snapshot = JSON.stringify(guestItems);
      const share = await prisma.wishlistGuestShare.upsert({
        where: { shop_guestId: { shop, guestId } },
        create: { shop, guestId, token, itemsJson: snapshot },
        update: { itemsJson: snapshot },
      });
      await logWishlistEvent({ shop, type: "wishlist_shared", guestId, sourcePage: "share_guest" });
      if (cfg?.flowAutomationEnabled !== false) {
        await notifyFlowWishlistActivity(shop, true, {
          eventtype: "wishlist_shared_guest",
          guestid: guestId,
          sharetoken: share.token,
        });
      }
      return json({ success: true, shareUrl: `${origin}/share/${share.token}` }, { headers: h });
    }

    return json({ error: "Share requires customerId or guestId + guestItems" }, { status: 400, headers: h });
  }

  return json({ error: "Unknown action" }, { status: 400, headers: h });
}

export async function resolveSharedItems(token: string): Promise<{
  shop: string;
  items: Partial<WishlistItem>[];
}> {
  const share = await prisma.wishlistShare.findUnique({ where: { token } });
  if (share) {
    const items = await prisma.wishlistItem.findMany({
      where: { shop: share.shop, customerId: share.customerId },
      orderBy: { addedAt: "desc" },
    });
    return { shop: share.shop, items };
  }
  const guestShare = await prisma.wishlistGuestShare.findUnique({ where: { token } });
  if (guestShare) {
    try {
      const parsed = JSON.parse(guestShare.itemsJson) as Record<string, unknown>[];
      return {
        shop: guestShare.shop,
        items: guestItemsToWishlistShape(guestShare.shop, parsed),
      };
    } catch {
      return { shop: guestShare.shop, items: [] };
    }
  }
  throw new Response("Not found", { status: 404 });
}
