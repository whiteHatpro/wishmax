import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { logWishlistEvent, resolveSharedItems } from "../lib/wishlist-api.server";

type Row = {
  variantId: string;
  productTitle: string;
  variantTitle: string | null;
  productImage: string | null;
  productHandle: string;
  price: string;
  availability: boolean;
};

export const meta: MetaFunction = () => [
  { title: "Shared wishlist" },
  { name: "robots", content: "noindex,nofollow" },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const token = params.token;
  if (!token) throw new Response("Not found", { status: 404 });
  try {
    const { shop, items } = await resolveSharedItems(token);
    void logWishlistEvent({ shop, type: "share_visit", sourcePage: "shared_page" });
    const rows: Row[] = items.map((item) => ({
      variantId: String(item.variantId ?? ""),
      productTitle: String(item.productTitle ?? ""),
      variantTitle: item.variantTitle ?? null,
      productImage: item.productImage ?? null,
      productHandle: String(item.productHandle ?? ""),
      price: String(item.price ?? ""),
      availability: item.availability !== false,
    }));
    const storeBase = `https://${shop}`;
    return json<{ shop: string; storeBase: string; rows: Row[] }>({
      shop,
      storeBase,
      rows,
    });
  } catch (e) {
    if (e instanceof Response) throw e;
    throw new Response("Not found", { status: 404 });
  }
};

export default function ShareWishlist() {
  const { storeBase, rows, shop } = useLoaderData<typeof loader>();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px", fontFamily: "system-ui,sans-serif" }}>
      <p style={{ color: "#6d7175", fontSize: 14, marginBottom: 8 }}>{shop}</p>
      <h1 style={{ fontSize: 28, marginBottom: 24 }}>Shared wishlist</h1>

      {rows.length === 0 ? (
        <p style={{ color: "#6d7175" }}>This wishlist is empty.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: 24,
          }}
        >
          {rows.map((item) => (
            <div
              key={item.variantId}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <a href={`${storeBase}/products/${item.productHandle}`} style={{ display: "block" }}>
                <img
                  src={item.productImage || ""}
                  alt={item.productTitle}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                  loading="lazy"
                />
              </a>
              <div style={{ padding: 12 }}>
                <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{item.productTitle}</p>
                {item.variantTitle ? (
                  <p style={{ color: "#6d7175", fontSize: 14, margin: "0 0 4px" }}>{item.variantTitle}</p>
                ) : null}
                <p style={{ margin: "0 0 12px" }}>{item.price}</p>
                <p style={{ fontSize: 13, margin: "0 0 8px", color: item.availability ? "#008060" : "#6d7175" }}>
                  {item.availability ? "In stock" : "Out of stock"}
                </p>
                {item.availability ? (
                  <a
                    href={`${storeBase}/cart/add?id=${encodeURIComponent(item.variantId)}&quantity=1`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      padding: "10px 8px",
                      background: "#000",
                      color: "#fff",
                      textDecoration: "none",
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Add to cart
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    style={{
                      width: "100%",
                      padding: "10px 8px",
                      background: "#e5e5e5",
                      color: "#6d7175",
                      border: "none",
                      borderRadius: 4,
                      cursor: "not-allowed",
                    }}
                  >
                    Out of stock
                  </button>
                )}
                <a
                  href={`${storeBase}/products/${item.productHandle}`}
                  style={{
                    display: "block",
                    marginTop: 8,
                    textAlign: "center",
                    fontSize: 14,
                    color: "#2c6ecb",
                  }}
                >
                  View product
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
