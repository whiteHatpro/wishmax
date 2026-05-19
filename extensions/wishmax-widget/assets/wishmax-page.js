/**
 * WishmaX — Wishlist Page JS
 * Renders the /wishlist page with saved products.
 */
(function () {
  "use strict";

  const APP_URL = window.__WISHMAX_APP_URL__ || "";
  const SHOP = window.Shopify?.shop || "";
  const CUSTOMER_ID = window.__WISHMAX_CUSTOMER_ID__;
  const GUEST_KEY = "wishmax_guest_wishlist";

  function getItems() {
    if (CUSTOMER_ID) {
      return fetch(`${APP_URL}/api/wishlist?shop=${SHOP}&customerId=${CUSTOMER_ID}`)
        .then((r) => r.json())
        .then((d) => d.items || []);
    }
    try {
      return Promise.resolve(JSON.parse(localStorage.getItem(GUEST_KEY) || "[]"));
    } catch (_) {
      return Promise.resolve([]);
    }
  }

  async function removeItem(variantId) {
    if (CUSTOMER_ID) {
      await fetch(`${APP_URL}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", shop: SHOP, customerId: String(CUSTOMER_ID), variantId: String(variantId) }),
      });
    } else {
      const items = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]").filter(
        (i) => i.variantId !== String(variantId)
      );
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    }
  }

  async function addToCart(variantId, btn) {
    btn.disabled = true;
    btn.textContent = "Adding…";
    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      });
      if (res.ok) {
        btn.textContent = "Added!";
        const config = window.__WISHMAX_CONFIG__ || {};
        if (config.redirectToCart) window.location.href = "/cart";
      } else {
        btn.textContent = "Error";
      }
    } catch (_) {
      btn.textContent = "Error";
    }
  }

  function renderItems(items) {
    const container = document.getElementById("wishmax-page-container");
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
          <p style="font-size:1.1rem;color:#6d7175;">Your wishlist is empty.</p>
          <a href="/collections/all" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">Shop Now</a>
        </div>`;
      return;
    }

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;padding:24px 0;";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.style.cssText = "border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;position:relative;";
      card.innerHTML = `
        <a href="/products/${item.productHandle}" style="display:block;">
          <img src="${item.productImage || ''}" alt="${item.productTitle}" style="width:100%;aspect-ratio:1;object-fit:cover;" loading="lazy" />
        </a>
        <div style="padding:12px;">
          <p style="font-weight:600;margin:0 0 4px;">${item.productTitle}</p>
          ${item.variantTitle ? `<p style="color:#6d7175;font-size:0.875rem;margin:0 0 4px;">${item.variantTitle}</p>` : ""}
          <p style="margin:0 0 12px;">${item.price}</p>
          ${item.availability
            ? `<button class="wishmax-atc" data-variant="${item.variantId}" style="width:100%;padding:8px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-bottom:8px;">Add to Cart</button>`
            : `<button disabled style="width:100%;padding:8px;background:#e5e5e5;color:#6d7175;border:none;border-radius:4px;margin-bottom:8px;">Out of Stock</button>`
          }
          <button class="wishmax-remove" data-variant="${item.variantId}" style="width:100%;padding:6px;background:none;border:1px solid #e5e5e5;border-radius:4px;cursor:pointer;color:#6d7175;font-size:0.875rem;">Remove</button>
        </div>`;
      grid.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(grid);

    // Bind events
    container.querySelectorAll(".wishmax-atc").forEach((btn) => {
      btn.addEventListener("click", () => addToCart(btn.dataset.variant, btn));
    });

    container.querySelectorAll(".wishmax-remove").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await removeItem(btn.dataset.variant);
        const card = btn.closest("div[style*='border']");
        card?.remove();
        if (!container.querySelector(".wishmax-remove")) renderItems([]);
      });
    });
  }

  async function init() {
    const items = await getItems();
    renderItems(items);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
