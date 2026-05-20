import shopify from "../shopify.server";

/**
 * Must match `extensions/wishmax-flow/shopify.extension.toml` (`handle`).
 * One trigger with a flexible JSON payload keeps Flow setup simpler for merchants.
 */
const TRIGGER_HANDLE = "wishmax-wishlist-activity";

/**
 * Sends Shopify Flow trigger when automation is enabled for the shop.
 * Payload keys should match trigger `settings.fields` in the extension TOML.
 */
export async function notifyFlowWishlistActivity(
  shop: string,
  enabled: boolean,
  payload: Record<string, unknown>
) {
  if (!enabled) return;
  try {
    const { admin } = await shopify.unauthenticated.admin(shop);
    const response = await admin.graphql(
      `#graphql
      mutation FlowTrigger($handle: String!, $payload: JSON!) {
        flowTriggerReceive(handle: $handle, payload: $payload) {
          userErrors { field message }
        }
      }`,
      { variables: { handle: TRIGGER_HANDLE, payload } }
    );
    const json = (await response.json()) as {
      data?: { flowTriggerReceive?: { userErrors?: { field: string[] | null; message: string }[] } };
    };
    const errs = json.data?.flowTriggerReceive?.userErrors;
    if (errs?.length) {
      console.warn("[WishmaX] flowTriggerReceive userErrors", errs);
    }
  } catch (e) {
    console.warn("[WishmaX] flowTriggerReceive failed", e);
  }
}
