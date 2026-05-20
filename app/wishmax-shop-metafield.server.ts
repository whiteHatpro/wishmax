import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

const NAMESPACE = "wishmax";
const KEY = "app_url";

/** Normalizes app base URL so metafield compare + theme fetch stay consistent */
function canonicalAppUrl(raw: string) {
  return raw.trim().replace(/\/+$/, "");
}

async function graphqlJson(admin: AdminApiContext, query: string, variables?: Record<string, unknown>) {
  const response = await admin.graphql(query, variables ? { variables } : undefined);
  return response.json();
}

async function ensureMetafieldDefinition(admin: AdminApiContext) {
  const result = await graphqlJson(
    admin,
    `#graphql
    mutation WishmaxEnsureShopMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        userErrors { field message code }
      }
    }`,
    {
      definition: {
        name: "WishmaX App URL",
        namespace: NAMESPACE,
        key: KEY,
        description: "Base URL for the WishmaX app (used by the storefront extension).",
        type: "single_line_text_field",
        ownerType: "SHOP",
        access: { storefront: "PUBLIC_READ" },
      },
    },
  ) as {
    data?: {
      metafieldDefinitionCreate: { userErrors: { message: string; code?: string }[] };
    };
    errors?: { message: string }[];
  };

  if (result.errors?.length) {
    console.warn("[wishmax] metafieldDefinitionCreate request errors", result.errors);
    return false;
  }
  const ue = result.data?.metafieldDefinitionCreate?.userErrors || [];
  if (
    ue.some(
      (e) =>
        !/\balready exists\b|duplicate|already been taken|TAKEN|DEFINITION_ALREADY_EXISTS/i.test(
          `${e.code || ""} ${e.message}`,
        ),
    )
  ) {
    console.warn("[wishmax] metafieldDefinitionCreate userErrors", ue);
    return false;
  }
  return true;
}

async function setShopMetafield(admin: AdminApiContext, shopGid: string, appUrl: string) {
  return graphqlJson(
    admin,
    `#graphql
    mutation WishmaxSetShopAppUrl($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { id namespace key value }
        userErrors { field message code }
      }
    }`,
    {
      metafields: [
        {
          ownerId: shopGid,
          namespace: NAMESPACE,
          key: KEY,
          type: "single_line_text_field",
          value: appUrl,
        },
      ],
    },
  ) as {
    data?: {
      metafieldsSet: { userErrors: { message: string; code?: string }[] };
    };
    errors?: { message: string }[];
  };
}

function setFailedNeedingDefinition(
  payload: NonNullable<Awaited<ReturnType<typeof setShopMetafield>>>,
) {
  if (payload.errors?.length) {
    const text = payload.errors.map((e) => e.message).join(" ");
    return /definition|Definition|INVALID/i.test(text);
  }
  const ue = payload.data?.metafieldsSet?.userErrors || [];
  const text = ue.map((e) => `${e.code || ""} ${e.message}`).join(" ");
  return (
    ue.length > 0 && /definition|INVALID|OWNER|namespace|ACCESS/i.test(text)
  );
}

/**
 * Writes `shop.metafields.wishmax.app_url` for the storefront theme extension
 * (Liquid reads `shop.metafields.wishmax.app_url`). Requires `write_metafields`.
 */
export async function syncWishmaxShopAppUrl(admin: AdminApiContext, rawAppUrl: string) {
  const appUrl = canonicalAppUrl(rawAppUrl || "");
  if (!appUrl) return;

  try {
    const shopPayload = await graphqlJson(
      admin,
      `#graphql
      query WishmaxShopAppUrlSync {
        shop {
          id
          metafield(namespace: "${NAMESPACE}", key: "${KEY}") {
            id
            value
          }
        }
      }`,
    ) as {
      data?: {
        shop: { id: string; metafield: { value: string } | null };
      };
      errors?: { message: string }[];
    };

    if (shopPayload.errors?.length) {
      console.warn("[wishmax] shop query errors", shopPayload.errors);
      return;
    }

    const shop = shopPayload.data?.shop;
    if (!shop?.id) return;

    const current = shop.metafield?.value || "";
    if (canonicalAppUrl(current) === appUrl) return;

    let result = await setShopMetafield(admin, shop.id, appUrl);
    if (setFailedNeedingDefinition(result)) {
      await ensureMetafieldDefinition(admin);
      result = await setShopMetafield(admin, shop.id, appUrl);
    }

    if (result.errors?.length) {
      console.warn("[wishmax] metafieldsSet errors", result.errors);
      return;
    }
    const setErrors = result.data?.metafieldsSet?.userErrors || [];
    if (setErrors.length > 0) {
      console.warn("[wishmax] metafieldsSet userErrors", setErrors);
    }
  } catch (e) {
    console.warn("[wishmax] syncWishmaxShopAppUrl failed", e);
  }
}
