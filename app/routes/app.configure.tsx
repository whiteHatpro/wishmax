import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useActionData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page, Layout, Card, FormLayout, Select, Checkbox, TextField, BlockStack, Text, Banner,
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
  const data = {
    iconStyle: formData.get("iconStyle") as string,
    unselectedColor: formData.get("unselectedColor") as string,
    selectedColor: formData.get("selectedColor") as string,
    iconSize: formData.get("iconSize") as string,
    showOnPDP: formData.get("showOnPDP") === "true",
    showOnPLP: formData.get("showOnPLP") === "true",
    showInHeader: formData.get("showInHeader") === "true",
    allowGuest: formData.get("allowGuest") === "true",
    allowShare: formData.get("allowShare") === "true",
    redirectToCart: formData.get("redirectToCart") === "true",
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
  const [unselectedColor, setUnselectedColor] = useState(config?.unselectedColor || "#000000");
  const [selectedColor, setSelectedColor] = useState(config?.selectedColor || "#e53e3e");
  const [showOnPDP, setShowOnPDP] = useState(config?.showOnPDP ?? true);
  const [showOnPLP, setShowOnPLP] = useState(config?.showOnPLP ?? true);
  const [showInHeader, setShowInHeader] = useState(config?.showInHeader ?? true);
  const [allowGuest, setAllowGuest] = useState(config?.allowGuest ?? true);
  const [allowShare, setAllowShare] = useState(config?.allowShare ?? true);
  const [redirectToCart, setRedirectToCart] = useState(config?.redirectToCart ?? true);

  const handleSave = useCallback(() => {
    const fd = new FormData();
    fd.set("iconStyle", iconStyle); fd.set("iconSize", iconSize);
    fd.set("unselectedColor", unselectedColor); fd.set("selectedColor", selectedColor);
    fd.set("showOnPDP", String(showOnPDP)); fd.set("showOnPLP", String(showOnPLP));
    fd.set("showInHeader", String(showInHeader)); fd.set("allowGuest", String(allowGuest));
    fd.set("allowShare", String(allowShare)); fd.set("redirectToCart", String(redirectToCart));
    submit(fd, { method: "post" });
  }, [iconStyle, iconSize, unselectedColor, selectedColor, showOnPDP, showOnPLP, showInHeader, allowGuest, allowShare, redirectToCart, submit]);

  return (
    <Page title="Configure WishmaX" primaryAction={{ content: "Save", onAction: handleSave, loading: isSaving }}>
      <Layout>
        {actionData?.success && (
          <Layout.Section><Banner tone="success" title="Settings saved!" /></Layout.Section>
        )}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Display Settings</Text>
              <FormLayout>
                <Select label="Icon Style" options={[{ label: "Heart Icon", value: "heart" }, { label: "Button with Text", value: "button" }]} value={iconStyle} onChange={setIconStyle} />
                <Select label="Icon Size" options={[{ label: "Small", value: "small" }, { label: "Medium", value: "medium" }, { label: "Large", value: "large" }]} value={iconSize} onChange={setIconSize} />
                <TextField label="Unselected Colour" type="color" value={unselectedColor} onChange={setUnselectedColor} autoComplete="off" helpText="Colour when product is NOT in wishlist" />
                <TextField label="Selected Colour" type="color" value={selectedColor} onChange={setSelectedColor} autoComplete="off" helpText="Colour when product IS in wishlist" />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Placement</Text>
              <FormLayout>
                <Checkbox label="Show on Product Detail Page (PDP)" checked={showOnPDP} onChange={setShowOnPDP} />
                <Checkbox label="Show on Product Listing Page (PLP / Collections)" checked={showOnPLP} onChange={setShowOnPLP} />
                <Checkbox label="Show Wishlist icon in header with count" checked={showInHeader} onChange={setShowInHeader} />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">Behaviour</Text>
              <FormLayout>
                <Checkbox label="Allow guest users (browser localStorage)" checked={allowGuest} onChange={setAllowGuest} />
                <Checkbox label="Allow customers to share their Wishlist" checked={allowShare} onChange={setAllowShare} />
                <Checkbox label="Redirect to cart after moving item to cart" checked={redirectToCart} onChange={setRedirectToCart} />
              </FormLayout>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
