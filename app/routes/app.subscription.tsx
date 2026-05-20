import { Page, Layout, Card, Text, BlockStack, List } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function SubscriptionPage() {
  return (
    <Page>
      <TitleBar title="Subscription" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Plans (per product brief)
              </Text>
              <List type="bullet">
                <List.Item>Bronze — $5 (starter tier; adjust in Partner Dashboard billing when you enable charges)</List.Item>
                <List.Item>
                  Built for Shopify — see{" "}
                  <a
                    href="https://shopify.dev/docs/apps/launch/built-for-shopify/requirements"
                    target="_blank"
                    rel="noreferrer"
                  >
                    requirements checklist
                  </a>
                </List.Item>
              </List>
              <Text as="p">
                Billing integration is configured in the Shopify Partner Dashboard (usage-based or recurring charge).
                This page documents the commercial intent from the WishmaX brief.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
