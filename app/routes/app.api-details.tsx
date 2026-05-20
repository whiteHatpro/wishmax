import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { randomBytes } from "node:crypto";
import { useLoaderData, useActionData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Banner,
  DataTable,
  InlineStack,
  Button,
  TextField,
  EmptyState,
} from "@shopify/polaris";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { hashKey } from "../lib/headless-auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const [keys, config] = await Promise.all([
    prisma.headlessApiKey.findMany({
      where: { shop: session.shop },
      orderBy: { createdAt: "desc" },
    }),
    prisma.wishlistConfig.findUnique({
      where: { shop: session.shop },
      select: { requireApiKeyForMutations: true },
    }),
  ]);
  const appUrl = process.env.SHOPIFY_APP_URL || "";
  return json({
    keys,
    appUrl,
    requireApiKeyForMutations: config?.requireApiKeyForMutations ?? false,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const fd = await request.formData();
  const intent = String(fd.get("intent") || "");

  if (intent === "create") {
    const label = String(fd.get("label") || "API key").slice(0, 120);
    const raw = `wmx_${randomBytes(32).toString("hex")}`;
    const prefix = raw.slice(0, 10);
    await prisma.headlessApiKey.create({
      data: {
        shop,
        label,
        keyPrefix: `${prefix}…`,
        keyHash: hashKey(raw),
      },
    });
    return json({ ok: true, plaintextKey: raw, label });
  }

  if (intent === "revoke") {
    const id = String(fd.get("id") || "");
    if (!id) return json({ ok: false, error: "Missing id" }, { status: 400 });
    await prisma.headlessApiKey.deleteMany({ where: { shop, id } });
    return json({ ok: true, revoked: true });
  }

  return json({ ok: false }, { status: 400 });
};

export default function ApiDetailsPage() {
  const { keys, appUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const [label, setLabel] = useState("Headless storefront");

  return (
    <Page
      title="API Details"
      subtitle="WishmaX storefront and server endpoints (see requirements PDF)."
      primaryAction={{ content: "Documentation", url: "https://shopify.dev/docs/api", external: true }}
    >
      <Layout>
        {actionData && "plaintextKey" in actionData && actionData.plaintextKey && (
          <Layout.Section>
            <Banner title="Copy your new key now" tone="warning">
              <p>
                This secret is shown once. Store it in your password manager. Key:{" "}
                <code style={{ wordBreak: "break-all" }}>{actionData.plaintextKey}</code>
              </p>
            </Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Base URL
              </Text>
              <Text as="p">
                Your app origin (tunnel in dev): <code>{appUrl || "(set SHOPIFY_APP_URL)"}</code>
              </Text>
              <Text variant="headingMd" as="h2">
                Public storefront endpoints
              </Text>
              <Text as="p">
                • <code>GET /api/config?shop=&#123;shop&#125;.myshopify.com</code>
                <br />• <code>GET /api/wishlist?shop=…&amp;customerId=…</code>
                <br />• <code>POST /api/wishlist</code> with JSON <code>action</code> (add/remove/merge/share)
                <br />• PDF-style aliases: <code>/api/wishlist/add</code>, <code>/remove</code>, <code>/merge</code>,{" "}
                <code>/share</code>
                <br />• <code>GET /api/wishlist/share/&#123;token&#125;</code> (shared list JSON)
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Headless API keys
              </Text>
              <Text tone="subdued" as="p">
                Keys are stored hashed. Use for future authenticated integrations; storefront CORS continues to use the
                shop domain.
              </Text>
              {keys.length === 0 ? (
                <EmptyState heading="No keys yet" image="">
                  <p>Create a key for your integration team.</p>
                </EmptyState>
              ) : (
                <DataTable
                  columnContentTypes={["text", "text", "text"]}
                  headings={["Label", "Prefix", "Created"]}
                  rows={keys.map((k) => [
                    k.label,
                    k.keyPrefix,
                    new Date(k.createdAt).toLocaleDateString(),
                  ])}
                />
              )}
              <InlineStack gap="300" blockAlign="end">
                <div style={{ flex: 1, maxWidth: 320 }}>
                  <TextField label="Label" value={label} onChange={setLabel} autoComplete="off" />
                </div>
                <Button
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("intent", "create");
                    fd.set("label", label);
                    submit(fd, { method: "post" });
                  }}
                >
                  Generate key
                </Button>
              </InlineStack>
              {keys.map((k) => (
                <form key={k.id} method="post" style={{ display: "inline" }}>
                  <input type="hidden" name="intent" value="revoke" />
                  <input type="hidden" name="id" value={k.id} />
                  <Button tone="critical" submit size="slim">
                    Revoke {k.label}
                  </Button>
                </form>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
