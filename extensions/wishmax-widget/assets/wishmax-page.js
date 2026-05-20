/**
 * WishmaX — Wishlist Page JS
 * Renders the wishlist page with saved products (guest + logged-in).
 */
(function () {
  "use strict";

  const APP_URL = window.__WISHMAX_APP_URL__ || "";
  const SHOP = window.Shopify?.shop || "";
  const CUSTOMER_ID = window.__WISHMAX_CUSTOMER_ID__;
  const GUEST_KEY = "wishmax_guest_wishlist";
  const GUEST_ID_KEY = "wishmax_guest_id";
  const EMPTY_MSG = window.__WISHMAX_EMPTY_MSG__ || "Your wishlist is empty.";

  /** Matches admin Configure + theme block */
  let pageConfig = { redirectToCart: true, allowShare: true, allowGuest: true };

  function getOrCreateGuestId() {
    try {
      let id = localStorage.getItem(GUEST_ID_KEY);
      if (!id) {
        id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(GUEST_ID_KEY, id);
      }
      return id;
    } catch (_) {
      return "guest";
    }
  }

  async function loadPageConfig() {
    if (!APP_URL || !SHOP) return;
    try {
      const res = await fetch(`${APP_URL}/api/config?shop=${encodeURIComponent(SHOP)}`);
      if (res.ok) {
        const data = await res.json();
        pageConfig.redirectToCart = data.redirectToCart !== false;
        pageConfig.allowShare = data.allowShare !== false;
        pageConfig.allowGuest = data.allowGuest !== false;
        if (data.emptyStateMessage) window.__WISHMAX_EMPTY_MSG__ = data.emptyStateMessage;

        const gf = data.googleFontFamily;
        if (gf && String(gf).trim() && !document.getElementById("wishmax-google-font-page")) {
          const link = document.createElement("link");
          link.id = "wishmax-google-font-page";
          link.rel = "stylesheet";
          const fam = encodeURIComponent(String(gf).trim()).replace(/%20/g, "+");
          link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400;600&display=swap`;
          document.head.appendChild(link);
        }
        const css = data.customCss;
        let st = document.getElementById("wishmax-inline-custom-css-page");
        if (css && String(css).trim()) {
          if (!st) {
            st = document.createElement("style");
            st.id = "wishmax-inline-custom-css-page";
            document.head.appendChild(st);
          }
          st.textContent = String(css);
        } else if (st) {
          st.remove();
        }
        const root = document.getElementById("wishmax-page-container");
        if (root && gf && String(gf).trim()) {
          root.style.fontFamily = `"${String(gf).trim().replace(/"/g, "")}", system-ui, sans-serif`;
        }
      }
    } catch (_) {
      /** keep defaults */
    }
  }

  async function track(type, extra) {
    if (!APP_URL) return;
    try {
      await fetch(`${APP_URL}/api/wishlist/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          shop: SHOP,
          customerId: CUSTOMER_ID != null ? String(CUSTOMER_ID) : null,
          guestId: CUSTOMER_ID ? null : getOrCreateGuestId(),
          sourcePage: "wishlist_page",
          ...extra,
        }),
      });
    } catch (_) {}
  }

  async function copyShareLink() {
    if (!APP_URL) return;
    try {
      let body;
      if (CUSTOMER_ID) {
        body = {
          action: "share",
          shop: SHOP,
          customerId: String(CUSTOMER_ID),
        };
      } else {
        const guestItems = await getItems();
        if (!guestItems.length) {
          alert("Your wishlist is empty — add items before sharing.");
          return;
        }
        body = {
          action: "share",
          shop: SHOP,
          guestId: getOrCreateGuestId(),
          guestItems,
        };
      }
      const res = await fetch(`${APP_URL}/api/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not create share link");
        return;
      }
      const url = data.shareUrl;
      if (url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert("Share link copied to clipboard.");
      } else if (url) {
        prompt("Copy this link:", url);
      }
    } catch (_) {
      alert("Could not create share link.");
    }
  }

  function renderShareToolbar() {
    const bar = document.createElement("div");
    bar.style.cssText = "margin-bottom:20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;";
    if (pageConfig.allowShare && APP_URL) {
      const canShareAsGuest = pageConfig.allowGuest !== false;
      if (!CUSTOMER_ID && !canShareAsGuest) {
        return bar;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Copy share link";
      btn.style.cssText =
        "padding:10px 16px;background:#fff;color:#111;border:1px solid #c9cccf;border-radius:4px;cursor:pointer;font-size:0.95rem;";
      btn.addEventListener("click", copyShareLink);
      bar.appendChild(btn);
    }
    return bar;
  }

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
        body: JSON.stringify({
          action: "remove",
          shop: SHOP,
          customerId: String(CUSTOMER_ID),
          variantId: String(variantId),
        }),
      });
    } else {
      const items = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]").filter(
        (i) => i.variantId !== String(variantId)
      );
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
      await track("wishlist_removed", { variantId: String(variantId) });
    }
  }

  async function addToCart(variantId, btn) {
    btn.disabled = true;
    btn.textContent = "Adding…";
    await track("wishlist_to_cart", { variantId: String(variantId) });
    try {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variantId, quantity: 1 }),
      });
      if (res.ok) {
        btn.textContent = "Added!";
        if (pageConfig.redirectToCart) window.location.href = "/cart";
      } else {
        const err = await res.json().catch(() => ({}));
        btn.textContent = err.description ? "Error" : "Error";
        alert(err.description || "Could not add to cart.");
      }
    } catch (_) {
      btn.textContent = "Error";
    }
  }

  async function addSelectedToCart(selectedIds) {
    if (!selectedIds.length) return;
    for (const vid of selectedIds) {
      try {
        const res = await fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: vid, quantity: 1 }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.description || "Some items could not be added.");
          return;
        }
        await track("wishlist_to_cart", { variantId: String(vid) });
      } catch (_) {}
    }
    if (pageConfig.redirectToCart) window.location.href = "/cart";
    else {
      const items = await getItems();
      renderItems(items);
    }
  }

  function renderBulkBar(onAdd) {
    const bar = document.createElement("div");
    bar.style.cssText =
      "display:flex;align-items:center;gap:16px;margin-bottom:16px;padding:12px;border:1px solid #e5e5e5;border-radius:8px;background:#fafafa;";
    const lab = document.createElement("span");
    lab.textContent = "Select products below, then:";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Add selected to cart";
    btn.style.cssText =
      "padding:8px 14px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;";
    btn.addEventListener("click", onAdd);
    bar.appendChild(lab);
    bar.appendChild(btn);
    return bar;
  }

  function renderItems(items) {
    const container = document.getElementById("wishmax-page-container");
    if (!container) return;

    const emptyCopy = window.__WISHMAX_EMPTY_MSG__ || EMPTY_MSG;

    if (items.length === 0) {
      const wrap = document.createElement("div");
      wrap.appendChild(renderShareToolbar());
      const inner = document.createElement("div");
      inner.style.textAlign = "center";
      inner.style.padding = "60px 20px";
      inner.innerHTML = `
        <p style="font-size:1.1rem;color:#6d7175;">${emptyCopy}</p>
        <a href="/collections/all" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#000;color:#fff;text-decoration:none;border-radius:4px;">Shop Now</a>`;
      wrap.appendChild(inner);
      container.innerHTML = "";
      container.appendChild(wrap);
      return;
    }

    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px;padding:24px 0;";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.style.cssText = "border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;position:relative;";
      const vid = String(item.variantId);
      card.innerHTML = `
        <label style="position:absolute;top:8px;left:8px;z-index:2;background:#fff;padding:4px;border-radius:4px;cursor:pointer;">
          <input type="checkbox" class="wishmax-select" data-variant="${vid}" checked />
        </label>
        <a href="/products/${item.productHandle}" style="display:block;">
          <img src="${item.productImage || ""}" alt="${item.productTitle}" style="width:100%;aspect-ratio:1;object-fit:cover;" loading="lazy" />
        </a>
        <div style="padding:12px;">
          <p style="font-weight:600;margin:0 0 4px;">${item.productTitle}</p>
          ${item.variantTitle ? `<p style="color:#6d7175;font-size:0.875rem;margin:0 0 4px;">${item.variantTitle}</p>` : ""}
          <p style="margin:0 0 12px;">${item.price}</p>
          ${
            item.availability
              ? `<button class="wishmax-atc" data-variant="${vid}" style="width:100%;padding:8px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-bottom:8px;">Add to Cart</button>`
              : `<button disabled style="width:100%;padding:8px;background:#e5e5e5;color:#6d7175;border:none;border-radius:4px;margin-bottom:8px;">Out of Stock</button>`
          }
          <button class="wishmax-remove" data-variant="${vid}" style="width:100%;padding:6px;background:none;border:1px solid #e5e5e5;border-radius:4px;cursor:pointer;color:#6d7175;font-size:0.875rem;">Remove</button>
        </div>`;
      grid.appendChild(card);
    });

    const toolbar = renderShareToolbar();
    const bulk = renderBulkBar(() => {
      const ids = [];
      container.querySelectorAll(".wishmax-select:checked").forEach((cb) => {
        const card = cb.closest("div[style*='border']");
        const atc = card?.querySelector(".wishmax-atc");
        if (atc) ids.push(cb.getAttribute("data-variant"));
      });
      addSelectedToCart(ids.filter(Boolean));
    });

    container.innerHTML = "";
    container.appendChild(toolbar);
    container.appendChild(bulk);
    container.appendChild(grid);

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
    await loadPageConfig();
    await track("wishlist_page_view", {});
    const items = await getItems();
    renderItems(items);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
