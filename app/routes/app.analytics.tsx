import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  DataTable,
  EmptyState,
  Button,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const url = new URL(request.url);
  const endParam = url.searchParams.get("end");
  const startParam = url.searchParams.get("start");
  const end = endParam ? endOfDay(new Date(endParam)) : endOfDay(new Date());
  const defaultStart = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const start = startParam ? startOfDay(new Date(startParam)) : startOfDay(defaultStart);

  const whereDate = { shop, createdAt: { gte: start, lte: end } };

  const [
    adds,
    removes,
    shared,
    shareVisits,
    pageViews,
    wishlistToCart,
    guestMerge,
  ] = await Promise.all([
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "wishlist_added" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "wishlist_removed" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "wishlist_shared" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "share_visit" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "wishlist_page_view" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "wishlist_to_cart" } }),
    prisma.wishlistEvent.count({ where: { ...whereDate, type: "guest_merge" } }),
  ]);

  const guestAddRows = await prisma.wishlistEvent.findMany({
    where: {
      shop,
      createdAt: { gte: start, lte: end },
      type: "wishlist_added",
      guestId: { not: null },
    },
    select: { guestId: true },
    distinct: ["guestId"],
  });
  const guestWishlistUsers = guestAddRows.length;

  const custAddRows = await prisma.wishlistEvent.findMany({
    where: {
      shop,
      createdAt: { gte: start, lte: end },
      type: "wishlist_added",
      customerId: { not: null },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const loggedInWishlistUsers = custAddRows.length;

  const wishlistToCartRate =
    adds > 0 ? `${((wishlistToCart / adds) * 100).toFixed(1)}%` : "—";

  const addRemoveRatio = removes > 0 ? (adds / removes).toFixed(2) : "—";

  const topProducts = await prisma.wishlistItem.groupBy({
    by: ["productId", "productTitle"],
    where: { shop },
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: 10,
  });

  const outOfStock = await prisma.wishlistItem.count({ where: { shop, availability: false } });
  const totalItems = await prisma.wishlistItem.count({ where: { shop } });

  // B3 — Attributed revenue from wishlisted variants paid in date range.
  const attributionRows = await prisma.wishlistOrderAttribution.findMany({
    where: { shop, createdAt: { gte: start, lte: end } },
    select: { subtotal: true, currencyCode: true },
  });
  let attributedRevenue = 0;
  const currencyCounts: Record<string, number> = {};
  for (const row of attributionRows) {
    const v = parseFloat(row.subtotal);
    if (Number.isFinite(v)) {
      attributedRevenue += v;
      const c = row.currencyCode || "USD";
      currencyCounts[c] = (currencyCounts[c] ?? 0) + 1;
    }
  }
  const attributedOrders = attributionRows.length;
  const attributedCurrency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "USD";

  // B5 — Source page breakdown for wishlist_added events in the date range.
  const sourceRows = await prisma.wishlistEvent.groupBy({
    by: ["sourcePage"],
    where: { shop, createdAt: { gte: start, lte: end }, type: "wishlist_added" },
    _count: { _all: true },
  });
  const sourceBreakdown = sourceRows
    .map((r) => ({
      sourcePage: r.sourcePage ?? "unknown",
      count: r._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  // B6 — Average wishlist items per logged-in customer (all-time, this shop).
  const uniqueCustomers = await prisma.wishlistItem.findMany({
    where: { shop },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const uniqueCustomerCount = uniqueCustomers.length;
  const avgItemsPerUser =
    uniqueCustomerCount > 0 ? (totalItems / uniqueCustomerCount).toFixed(2) : "—";

  return json({
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    adds,
    removes,
    shared,
    shareVisits,
    pageViews,
    wishlistToCart,
    guestMerge,
    guestWishlistUsers,
    loggedInWishlistUsers,
    wishlistToCartRate,
    addRemoveRatio,
    topProducts,
    outOfStock,
    totalItems,
    attributedRevenue: attributedRevenue.toFixed(2),
    attributedOrders,
    attributedCurrency,
    sourceBreakdown,
    avgItemsPerUser,
    uniqueCustomerCount,
  });
};

export default function Analytics() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Analytics">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Date range
              </Text>
              <form method="get" style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-end" }}>
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    Start
                  </Text>
                  <input
                    name="start"
                    type="date"
                    defaultValue={data.start}
                    style={{ marginTop: 8, padding: "8px", borderRadius: 8, border: "1px solid #c9cccf" }}
                  />
                </div>
                <div>
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    End
                  </Text>
                  <input
                    name="end"
                    type="date"
                    defaultValue={data.end}
                    style={{ marginTop: 8, padding: "8px", borderRadius: 8, border: "1px solid #c9cccf" }}
                  />
                </div>
                <Button submit>Apply</Button>
              </form>
              <Text tone="subdued" as="p">
                Events are recorded when customers use the storefront (add/remove/share) and when shared links are
                opened. Enable Flow in Configure to forward activity to Shopify Flow.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Total wishlist adds
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.adds}
                </Text>
                <Text tone="subdued" as="p">
                  In selected date range
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Guest wishlist users
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.guestWishlistUsers}
                </Text>
                <Text tone="subdued" as="p">
                  Unique guest IDs with ≥1 add (range)
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Logged-in wishlist users
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.loggedInWishlistUsers}
                </Text>
                <Text tone="subdued" as="p">
                  Unique customers with ≥1 add (range)
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Wishlist → cart (events)
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.wishlistToCartRate}
                </Text>
                <Text tone="subdued" as="p">
                  wishlist_to_cart ÷ adds: {data.wishlistToCart} / {data.adds}
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Add/remove ratio
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.addRemoveRatio}
                </Text>
                <Text tone="subdued" as="p">
                  Adds ÷ removes (range)
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Shared wishlists
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.shared}
                </Text>
                <Text tone="subdued" as="p">
                  Share link generated
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Shared link visits
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.shareVisits}
                </Text>
                <Text tone="subdued" as="p">
                  Opens of read-only share pages
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Wishlist page views
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.pageViews}
                </Text>
                <Text tone="subdued" as="p">
                  Storefront page block loads
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Guest → login merge
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.guestMerge}
                </Text>
                <Text tone="subdued" as="p">
                  Merge events (range)
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Active wishlist rows
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.totalItems}
                </Text>
                <Text tone="subdued" as="p">
                  All time (current DB)
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Out-of-stock rows
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.outOfStock}
                </Text>
                <Text tone="subdued" as="p">
                  Current snapshot
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Attributed revenue
                </Text>
                <Text variant="heading2xl" as="p">
                  {`${data.attributedCurrency} ${data.attributedRevenue}`}
                </Text>
                <Text tone="subdued" as="p">
                  Sum of paid line items where the customer had the variant on
                  their wishlist · {data.attributedOrders} line(s) in range
                </Text>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Avg wishlist items / user
                </Text>
                <Text variant="heading2xl" as="p">
                  {data.avgItemsPerUser}
                </Text>
                <Text tone="subdued" as="p">
                  Total active rows ÷ unique customers: {data.totalItems} /{" "}
                  {data.uniqueCustomerCount}
                </Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Most wishlisted products
              </Text>
              {data.topProducts.length === 0 ? (
                <EmptyState heading="No data yet" image="">
                  <p>Data appears once customers use the Wishlist.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "numeric"]}
                  headings={["Product", "Wishlist rows"]}
                  rows={data.topProducts.map((p) => [p.productTitle, String(p._count.productId)])}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Wishlist adds by source page
              </Text>
              <Text tone="subdued" as="p">
                Where `wishlist_added` events originated in the selected range.
                `unknown` covers events without a `sourcePage` (older clients or
                server-side adds).
              </Text>
              {data.sourceBreakdown.length === 0 ? (
                <EmptyState heading="No add events yet" image="">
                  <p>Source breakdown appears after storefront adds in range.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "numeric"]}
                  headings={["Source page", "Adds"]}
                  rows={data.sourceBreakdown.map((r) => [r.sourcePage, String(r.count)])}
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
