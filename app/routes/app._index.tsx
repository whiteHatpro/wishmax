import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page, Layout, Card, Text, BlockStack, InlineStack, Button, Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const config = await prisma.wishlistConfig.findUnique({ where: { shop } });
  const wishlistCount = await prisma.wishlistItem.count({ where: { shop } });
  return json({ config, wishlistCount });
};

export default function Index() {
  const { config, wishlistCount } = useLoaderData<typeof loader>();
  return (
    <Page title="WishmaX">
      <Layout>
        {!config && (
          <Layout.Section>
            <Banner title="Complete your setup" tone="info" action={{ content: "Configure now", url: "/app/configure" }}>
              <p>Enable the Wishlist widget on your store.</p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Card>
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">Total Wishlist Items</Text>
                <Text variant="heading2xl" as="p">{wishlistCount}</Text>
                <Text tone="subdued" as="p">Across all customers</Text>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Quick Actions</Text>
              <InlineStack gap="300" wrap>
                <Button url="/app/configure" variant="primary">Configure Wishlist</Button>
                <Button url="/app/analytics">View Analytics</Button>
                <Button url="/app/api-details">API Details</Button>
                <Button url="/app/subscription">Subscription</Button>
                <Button url="/app/faqs">FAQs</Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
