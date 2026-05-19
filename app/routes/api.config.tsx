import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop") || "";
  if (!shop) return json({ error: "Missing shop" }, { status: 400 });
  const config = await prisma.wishlistConfig.findUnique({ where: { shop } });
  const headers = { "Access-Control-Allow-Origin": `https://${shop}`, "Cache-Control": "public, max-age=60" };
  return json(config || { iconStyle: "heart", unselectedColor: "#000000", selectedColor: "#e53e3e", iconSize: "medium", showOnPDP: true, showOnPLP: true, showInHeader: true, allowGuest: true, allowShare: true, redirectToCart: true }, { headers });
};
