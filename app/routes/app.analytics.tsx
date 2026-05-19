import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, Text, BlockStack, InlineStack, DataTable, EmptyState } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const totalItems = await prisma.wishlistItem.count({ where: { shop } });
  const uniqueCustomers = await prisma.wishlistItem.groupBy({ by: ["customerId"], where: { shop }, _count: true });
  const topProducts = await prisma.wishlistItem.groupBy({
    by: ["productId", "productTitle"], where: { shop },
    _count: { productId: true }, orderBy: { _count: { productId: "desc" } }, take: 10,
  });
  const outOfStock = await prisma.wishlistItem.count({ where: { shop, availability: false } });
  return json({ totalItems, uniqueCustomers: uniqueCustomers.length, topProducts, outOfStock });
};

export default function Analytics() {
  const { totalItems, uniqueCustomers, topProducts, outOfStock } = useLoaderData<typeof loader>();
  return (
    <Page title="Analytics">
      <Layout>
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Card><BlockStack gap="200"><Text variant="headingMd" as="h2">Total Wishlist Items</Text><Text variant="heading2xl" as="p">{totalItems}</Text></BlockStack></Card>
            <Card><BlockStack gap="200"><Text variant="headingMd" as="h2">Unique Customers</Text><Text variant="heading2xl" as="p">{uniqueCustomers}</Text></BlockStack></Card>
            <Card><BlockStack gap="200"><Text variant="headingMd" as="h2">Out-of-Stock Items</Text><Text variant="heading2xl" as="p">{outOfStock}</Text><Text tone="subdued" as="p">Hidden demand</Text></BlockStack></Card>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Most Wishlisted Products</Text>
              {topProducts.length === 0
                ? <EmptyState heading="No data yet" image=""><p>Data appears once customers use the Wishlist.</p></EmptyState>
                : <DataTable columnContentTypes={["text", "numeric"]} headings={["Product", "Wishlist Adds"]} rows={topProducts.map(p => [p.productTitle, String(p._count.productId)])} />
              }
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
