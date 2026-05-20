import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

const DEFAULTS = {
  iconStyle: "heart",
  unselectedColor: "#000000",
  selectedColor: "#e53e3e",
  iconSize: "medium",
  mobileIconSize: "medium",
  showOnPDP: true,
  showOnPLP: true,
  showOnCart: true,
  showInHeader: true,
  allowGuest: true,
  allowShare: true,
  redirectToCart: true,
  emptyStateMessage: "Your wishlist is empty.",
  wishlistPageHandle: "wishlist",
  buttonText: "Add to Wishlist",
  selectedButtonText: "Saved ♥",
  flowAutomationEnabled: true,
  customCss: "",
  fullWidthButtonOnPdp: false,
  plpIconPlacement: "top_right",
  googleFontFamily: "",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  if (!shop) return json({ error: "Missing shop" }, { status: 400 });
  const config = await prisma.wishlistConfig.findUnique({ where: { shop } });
  const merged = { ...DEFAULTS, ...(config ? { ...config } : {}) };
  const headers = { "Access-Control-Allow-Origin": `https://${shop}`, "Cache-Control": "public, max-age=60" };
  return json(merged, { headers });
};
