import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  FormLayout,
  Select,
  Checkbox,
  TextField,
  BlockStack,
  Text,
  Banner,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const config = await prisma.wishlistConfig.findUnique({ where: { shop: session.shop } });
  return json({ config });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const hover = (formData.get("hoverColor") as string)?.trim();
  const googleFont = (formData.get("googleFontFamily") as string)?.trim();
  const customCssRaw = (formData.get("customCss") as string) ?? "";
  const data = {
    iconStyle: formData.get("iconStyle") as string,
    unselectedColor: formData.get("unselectedColor") as string,
    selectedColor: formData.get("selectedColor") as string,
    iconSize: formData.get("iconSize") as string,
    mobileIconSize: formData.get("mobileIconSize") as string,
    showOnPDP: formData.get("showOnPDP") === "true",
    showOnPLP: formData.get("showOnPLP") === "true",
    showOnCart: formData.get("showOnCart") === "true",
    showInHeader: formData.get("showInHeader") === "true",
    allowGuest: formData.get("allowGuest") === "true",
    allowShare: formData.get("allowShare") === "true",
    redirectToCart: formData.get("redirectToCart") === "true",
    emptyStateMessage: (formData.get("emptyStateMessage") as string) || "Your wishlist is empty.",
    wishlistPageHandle: (formData.get("wishlistPageHandle") as string) || "wishlist",
    buttonText: (formData.get("buttonText") as string) || "Add to Wishlist",
    selectedButtonText: (formData.get("selectedButtonText") as string) || "Saved ♥",
    hoverColor: hover || null,
    flowAutomationEnabled: formData.get("flowAutomationEnabled") === "true",
    requireApiKeyForMutations: formData.get("requireApiKeyForMutations") === "true",
    customCss: customCssRaw.trim() ? customCssRaw : null,
    fullWidthButtonOnPdp: formData.get("fullWidthButtonOnPdp") === "true",
    plpIconPlacement: (formData.get("plpIconPlacement") as string) || "top_right",
    googleFontFamily: googleFont || null,
  };
  await prisma.wishlistConfig.upsert({ where: { shop }, update: data, create: { shop, ...data } });
  return json({ success: true });
};

export default function Configure() {
  const { config } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const [iconStyle, setIconStyle] = useState(config?.iconStyle || "heart");
  const [iconSize, setIconSize] = useState(config?.iconSize || "medium");
  const [mobileIconSize, setMobileIconSize] = useState(config?.mobileIconSize || "medium");
  const [unselectedColor, setUnselectedColor] = useState(config?.unselectedColor || "#000000");
  const [selectedColor, setSelectedColor] = useState(config?.selectedColor || "#e53e3e");
  const [hoverColor, setHoverColor] = useState(config?.hoverColor || "");
  const [showOnPDP, setShowOnPDP] = useState(config?.showOnPDP ?? true);
  const [showOnPLP, setShowOnPLP] = useState(config?.showOnPLP ?? true);
  const [showOnCart, setShowOnCart] = useState(config?.showOnCart ?? true);
  const [showInHeader, setShowInHeader] = useState(config?.showInHeader ?? true);
  const [allowGuest, setAllowGuest] = useState(config?.allowGuest ?? true);
  const [allowShare, setAllowShare] = useState(config?.allowShare ?? true);
  const [redirectToCart, setRedirectToCart] = useState(config?.redirectToCart ?? true);
  const [emptyStateMessage, setEmptyStateMessage] = useState(
    config?.emptyStateMessage || "Your wishlist is empty."
  );
  const [wishlistPageHandle, setWishlistPageHandle] = useState(config?.wishlistPageHandle || "wishlist");
  const [buttonText, setButtonText] = useState(config?.buttonText || "Add to Wishlist");
  const [selectedButtonText, setSelectedButtonText] = useState(config?.selectedButtonText || "Saved ♥");
  const [flowAutomationEnabled, setFlowAutomationEnabled] = useState(config?.flowAutomationEnabled ?? true);
  const [requireApiKeyForMutations, setRequireApiKeyForMutations] = useState(
    config?.requireApiKeyForMutations ?? false
  );
  const [customCss, setCustomCss] = useState(config?.customCss || "");
  const [fullWidthButtonOnPdp, setFullWidthButtonOnPdp] = useState(config?.fullWidthButtonOnPdp ?? false);
  const [plpIconPlacement, setPlpIconPlacement] = useState(config?.plpIconPlacement || "top_right");
  const [googleFontFamily, setGoogleFontFamily] = useState(config?.googleFontFamily || "");

  const handleSave = useCallback(() => {
    const fd = new FormData();
    fd.set("iconStyle", iconStyle);
    fd.set("iconSize", iconSize);
    fd.set("mobileIconSize", mobileIconSize);
    fd.set("unselectedColor", unselectedColor);
    fd.set("selectedColor", selectedColor);
    fd.set("hoverColor", hoverColor);
    fd.set("showOnPDP", String(showOnPDP));
    fd.set("showOnPLP", String(showOnPLP));
    fd.set("showOnCart", String(showOnCart));
    fd.set("showInHeader", String(showInHeader));
    fd.set("allowGuest", String(allowGuest));
    fd.set("allowShare", String(allowShare));
    fd.set("redirectToCart", String(redirectToCart));
    fd.set("emptyStateMessage", emptyStateMessage);
    fd.set("wishlistPageHandle", wishlistPageHandle);
    fd.set("buttonText", buttonText);
    fd.set("selectedButtonText", selectedButtonText);
    fd.set("flowAutomationEnabled", String(flowAutomationEnabled));
    fd.set("requireApiKeyForMutations", String(requireApiKeyForMutations));
    fd.set("customCss", customCss);
    fd.set("fullWidthButtonOnPdp", String(fullWidthButtonOnPdp));
    fd.set("plpIconPlacement", plpIconPlacement);
    fd.set("googleFontFamily", googleFontFamily);
    submit(fd, { method: "post" });
  }, [
    iconStyle,
    iconSize,
    mobileIconSize,
    unselectedColor,
    selectedColor,
    hoverColor,
    showOnPDP,
    showOnPLP,
    showOnCart,
    showInHeader,
    allowGuest,
    allowShare,
    redirectToCart,
    emptyStateMessage,
    wishlistPageHandle,
    buttonText,
    selectedButtonText,
    flowAutomationEnabled,
    requireApiKeyForMutations,
    customCss,
    fullWidthButtonOnPdp,
    plpIconPlacement,
    googleFontFamily,
    submit,
  ]);

  return (
    <Page
      title="Configure WishmaX"
      primaryAction={{ content: "Save", onAction: handleSave, loading: isSaving }}
    >
      <Layout>
        {actionData?.success && (
          <Layout.Section>
            <Banner tone="success" title="Settings saved!" />
          </Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Display Settings
              </Text>
              <FormLayout>
                <Select
                  label="Icon Style"
                  options={[
                    { label: "Heart Icon", value: "heart" },
                    { label: "Button with Text", value: "button" },
                  ]}
                  value={iconStyle}
                  onChange={setIconStyle}
                />
                <Select
                  label="Icon Size"
                  options={[
                    { label: "Small", value: "small" },
                    { label: "Medium", value: "medium" },
                    { label: "Large", value: "large" },
                  ]}
                  value={iconSize}
                  onChange={setIconSize}
                />
                <Select
                  label="Mobile icon size"
                  options={[
                    { label: "Small", value: "small" },
                    { label: "Medium", value: "medium" },
                    { label: "Large", value: "large" },
                  ]}
                  value={mobileIconSize}
                  onChange={setMobileIconSize}
                />
                <TextField
                  label="Button label (button style)"
                  value={buttonText}
                  onChange={setButtonText}
                  autoComplete="off"
                />
                <TextField
                  label="Selected button label"
                  value={selectedButtonText}
                  onChange={setSelectedButtonText}
                  autoComplete="off"
                />
                <TextField
                  label="Unselected Colour"
                  type="color"
                  value={unselectedColor}
                  onChange={setUnselectedColor}
                  autoComplete="off"
                  helpText="Colour when product is NOT in wishlist"
                />
                <TextField
                  label="Selected Colour"
                  type="color"
                  value={selectedColor}
                  onChange={setSelectedColor}
                  autoComplete="off"
                  helpText="Colour when product IS in wishlist"
                />
                <TextField
                  label="Hover colour (optional)"
                  type="color"
                  value={hoverColor}
                  onChange={setHoverColor}
                  autoComplete="off"
                  helpText="Theme may still vary; applied when set"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Placement
              </Text>
              <FormLayout>
                <Checkbox label="Show on Product Detail Page (PDP)" checked={showOnPDP} onChange={setShowOnPDP} />
                <Checkbox
                  label="Show on Product Listing Page (PLP / Collections)"
                  checked={showOnPLP}
                  onChange={setShowOnPLP}
                />
                <Checkbox label="Show on Cart page" checked={showOnCart} onChange={setShowOnCart} />
                <Checkbox
                  label="Show Wishlist icon in header with count"
                  checked={showInHeader}
                  onChange={setShowInHeader}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Advanced theme
              </Text>
              <Text tone="subdued" as="p">
                Storefront reads these via <code>/api/config</code> (App embed must be enabled). Custom CSS is appended as a
                single <code>&lt;style&gt;</code> block—scope selectors with <code>.wishmax-btn</code> where possible.
              </Text>
              <FormLayout>
                <Select
                  label="PLP / collection wishlist icon position"
                  options={[
                    { label: "Top right", value: "top_right" },
                    { label: "Top left", value: "top_left" },
                    { label: "Bottom right", value: "bottom_right" },
                    { label: "Bottom left", value: "bottom_left" },
                  ]}
                  value={plpIconPlacement}
                  onChange={setPlpIconPlacement}
                />
                <Checkbox
                  label="Full-width wishlist button on PDP (button style only)"
                  checked={fullWidthButtonOnPdp}
                  onChange={setFullWidthButtonOnPdp}
                />
                <TextField
                  label="Google Font family (optional)"
                  value={googleFontFamily}
                  onChange={setGoogleFontFamily}
                  autoComplete="off"
                  placeholder="e.g. DM Sans"
                  helpText="Loads from Google Fonts and applies to wishlist buttons."
                />
                <TextField
                  label="Custom CSS (optional)"
                  value={customCss}
                  onChange={setCustomCss}
                  multiline={6}
                  autoComplete="off"
                  helpText="Example: .wishmax-btn--plp { opacity: 0.9; }"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Wishlist page (defaults)
              </Text>
              <Text tone="subdued" as="p">
                Merchants still create the Page in Online Store and add the &quot;WishmaX wishlist page&quot; block.
                Use these as defaults for the storefront script and documentation.
              </Text>
              <FormLayout>
                <TextField
                  label="Suggested page handle"
                  value={wishlistPageHandle}
                  onChange={setWishlistPageHandle}
                  autoComplete="off"
                  helpText="e.g. wishlist → /pages/wishlist"
                />
                <TextField
                  label="Empty state message"
                  value={emptyStateMessage}
                  onChange={setEmptyStateMessage}
                  multiline={2}
                  autoComplete="off"
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Behaviour
              </Text>
              <FormLayout>
                <Checkbox
                  label="Allow guest users (browser localStorage)"
                  checked={allowGuest}
                  onChange={setAllowGuest}
                />
                <Checkbox
                  label="Allow customers to share their Wishlist"
                  checked={allowShare}
                  onChange={setAllowShare}
                />
                <Checkbox
                  label="Redirect to cart after moving item to cart"
                  checked={redirectToCart}
                  onChange={setRedirectToCart}
                />
                <Checkbox
                  label="Send events to Shopify Flow (requires Flow trigger deployed)"
                  checked={flowAutomationEnabled}
                  onChange={setFlowAutomationEnabled}
                />
                <Checkbox
                  label="Require API key for wishlist mutations"
                  helpText="When enabled, POST /api/wishlist* must include a valid X-Wishmax-Key (or Authorization: Bearer …). Create keys under API Details. GET endpoints stay public for the storefront."
                  checked={requireApiKeyForMutations}
                  onChange={setRequireApiKeyForMutations}
                />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
