import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type OrderLineLike = {
  id?: number | string;
  variant_id?: number | string;
  product_id?: number | string;
  quantity?: number | string;
  price?: string;
};

type OrderPayloadLike = {
  id?: number | string;
  customer?: { id?: number | string } | null;
  currency?: string;
  presentment_currency?: string;
  line_items?: OrderLineLike[];
};

function isPaidOrderTopic(topic: string) {
  const t = String(topic).toUpperCase();
  return t === "ORDERS_PAID" || t.includes("ORDERS/PAID");
}

/**
 * When a paid order contains a variant the customer still had on their wishlist,
 * record attribution for analytics (PDF: revenue from wishlisted products).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  if (!isPaidOrderTopic(String(topic))) {
    return new Response();
  }

  const order = payload as OrderPayloadLike;

  const customerIdRaw = order.customer?.id;
  if (customerIdRaw == null) {
    return new Response();
  }

  const customerId = String(customerIdRaw);
  const orderId = String(order.id ?? "");
  if (!orderId) return new Response();

  const currencyCode = String(order.presentment_currency || order.currency || "USD");
  const lines = order.line_items || [];

  for (const line of lines) {
    const variantId = line.variant_id != null ? String(line.variant_id) : "";
    const productId = line.product_id != null ? String(line.product_id) : "";
    const lineItemId = line.id != null ? String(line.id) : "";
    if (!variantId || !lineItemId) continue;

    const wishlisted = await prisma.wishlistItem.findUnique({
      where: { shop_customerId_variantId: { shop, customerId, variantId } },
      select: { id: true },
    });
    if (!wishlisted) continue;

    const qty = Math.max(1, Number(line.quantity || 1));
    const price = parseFloat(String(line.price ?? "0"));
    const subtotalNum = Number.isFinite(price) ? price * qty : NaN;
    const subtotal = Number.isFinite(subtotalNum) ? String(subtotalNum.toFixed(2)) : "0";

    await prisma.wishlistOrderAttribution.upsert({
      where: { shop_orderId_lineItemId: { shop, orderId, lineItemId } },
      create: {
        shop,
        orderId,
        lineItemId,
        variantId,
        productId,
        customerId,
        subtotal,
        currencyCode,
      },
      update: {
        subtotal,
        variantId,
        productId,
        currencyCode,
      },
    });
  }

  return new Response();
};
