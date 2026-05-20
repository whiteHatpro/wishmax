import { Page, Layout, Card, Text, BlockStack, List } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function FaqsPage() {
  return (
    <Page>
      <TitleBar title="FAQs / Contact" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Common questions
              </Text>
              <List>
                <List.Item>
                  <strong>Wishlist URL</strong> — Create an Online Store page (e.g. handle{" "}
                  <code>wishlist</code>) and add the &quot;WishmaX wishlist page&quot; app block.
                </List.Item>
                <List.Item>
                  <strong>Sharing</strong> — Logged-in customers use &quot;Copy share link&quot; on the wishlist page;
                  guests generate a snapshot link from the same button when guests are enabled.
                </List.Item>
                <List.Item>
                  <strong>Shopify Flow</strong> — Enable &quot;Send events to Shopify Flow&quot; in Configure and deploy
                  the Flow trigger extension; then build workflows in the Flow app.
                </List.Item>
                <List.Item>
                  <strong>Guest data</strong> — Stored in the browser; merge runs after login. Clearing browser data
                  clears the guest list.
                </List.Item>
              </List>
              <Text as="p">
                For app review readiness, follow{" "}
                <a
                  href="https://shopify.dev/docs/apps/launch/app-store-review/pass-app-review"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pass the App Store review
                </a>
                .
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
