/**
 * WishmaX — Theme-agnostic Wishlist Widget
 * Works for both guest users (localStorage) and logged-in customers (API).
 */
(function () {
  "use strict";

  const APP_URL = window.__WISHMAX_APP_URL__ || "";
  const SHOP = window.Shopify?.shop || "";
  const CUSTOMER_ID = window.__WISHMAX_CUSTOMER_ID__ || null;
  const GUEST_KEY = "wishmax_guest_wishlist";
  const GUEST_ID_KEY = "wishmax_guest_id";

  // ─── Config ───────────────────────────────────────────────────────────────

  let config = {
    iconStyle: "heart",
    selectedColor: "#e53e3e",
    unselectedColor: "#000000",
    iconSize: "medium",
    mobileIconSize: "medium",
    showOnPDP: true,
    showOnPLP: true,
    showOnCart: true,
    showInHeader: true,
    allowGuest: true,
    allowShare: true,
    redirectToCart: true,
    buttonText: "Add to Wishlist",
    selectedButtonText: "Saved ♥",
    hoverColor: "",
    customCss: "",
    fullWidthButtonOnPdp: false,
    plpIconPlacement: "top_right",
    googleFontFamily: "",
  };

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
      return "guest-unknown";
    }
  }

  async function loadConfig() {
    try {
      const res = await fetch(`${APP_URL}/api/config?shop=${SHOP}`);
      if (res.ok) config = { ...config, ...(await res.json()) };
    } catch (_) {}
  }

  function fontStack() {
    const f = config.googleFontFamily;
    if (!f || !String(f).trim()) return null;
    return `"${String(f).trim().replace(/"/g, "")}", system-ui, sans-serif`;
  }

  function injectGoogleFontLink() {
    const name = config.googleFontFamily;
    if (!name || !String(name).trim()) return;
    const id = "wishmax-google-font";
    if (document.getElementById(id)) return;
    const fam = encodeURIComponent(name.trim()).replace(/%20/g, "+");
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@400;600&display=swap`;
    document.head.appendChild(link);
  }

  function applyCustomCssBlock() {
    const raw = config.customCss;
    const id = "wishmax-inline-custom-css";
    const el = document.getElementById(id);
    if (!raw || !String(raw).trim()) {
      if (el) el.remove();
      return;
    }
    let styleEl = el;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = String(raw);
  }

  function applyTypographyToButton(btn) {
    const fs = fontStack();
    if (fs) btn.style.fontFamily = fs;
  }

  function applyAdvancedTheme() {
    injectGoogleFontLink();
    applyCustomCssBlock();
    document.querySelectorAll(".wishmax-btn").forEach(applyTypographyToButton);
  }

  function getPlpPositionCss() {
    const p = String(config.plpIconPlacement || "top_right").toLowerCase();
    const base = "position:absolute;z-index:10;";
    switch (p) {
      case "top_left":
        return base + "top:8px;left:8px;right:auto;bottom:auto;";
      case "bottom_right":
        return base + "bottom:8px;right:8px;top:auto;left:auto;";
      case "bottom_left":
        return base + "bottom:8px;left:8px;top:auto;right:auto;";
      default:
        return base + "top:8px;right:8px;bottom:auto;left:auto;";
    }
  }

  async function trackEvent(type, extra) {
    if (!APP_URL || !SHOP) return;
    try {
      const body = {
        type,
        shop: SHOP,
        guestId: CUSTOMER_ID ? null : getOrCreateGuestId(),
        customerId: CUSTOMER_ID ? String(CUSTOMER_ID) : null,
        ...extra,
      };
      await fetch(`${APP_URL}/api/wishlist/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (_) {}
  }

  // ─── Storage helpers ──────────────────────────────────────────────────────

  function getGuestWishlist() {
    try {
      return JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
    } catch (_) {
      return [];
    }
  }

  function saveGuestWishlist(items) {
    localStorage.setItem(GUEST_KEY, JSON.stringify(items));
  }

  // ─── API helpers ──────────────────────────────────────────────────────────

  async function apiAction(action, payload) {
    const res = await fetch(`${APP_URL}/api/wishlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, shop: SHOP, customerId: String(CUSTOMER_ID), ...payload }),
    });
    return res.json();
  }

  async function fetchLoggedInWishlist() {
    const res = await fetch(`${APP_URL}/api/wishlist?shop=${SHOP}&customerId=${CUSTOMER_ID}`);
    const data = await res.json();
    return data.items || [];
  }

  // In-memory set of variantIds in wishlist (for quick lookup)
  let wishlistSet = new Set();

  async function refreshWishlistSet() {
    if (CUSTOMER_ID) {
      const items = await fetchLoggedInWishlist();
      wishlistSet = new Set(items.map((i) => String(i.variantId)));
    } else {
      wishlistSet = new Set(getGuestWishlist().map((i) => String(i.variantId)));
    }
  }

  // ─── Toggle wishlist ──────────────────────────────────────────────────────

  async function toggleWishlist(button, productData) {
    const { variantId } = productData;
    const isInWishlist = wishlistSet.has(String(variantId));

    setButtonState(button, "loading");

    try {
      if (isInWishlist) {
        // Remove
        if (CUSTOMER_ID) {
          await apiAction("remove", { variantId: String(variantId), sourcePage: productData.sourcePage });
        } else {
          const items = getGuestWishlist().filter((i) => i.variantId !== String(variantId));
          saveGuestWishlist(items);
          await trackEvent("wishlist_removed", {
            variantId: String(variantId),
            productId: String(productData.productId || ""),
            sourcePage: productData.sourcePage || "",
          });
        }
        wishlistSet.delete(String(variantId));
        setButtonState(button, "default");
      } else {
        // Add
        if (CUSTOMER_ID) {
          await apiAction("add", { ...productData, variantId: String(variantId) });
        } else if (config.allowGuest) {
          const items = getGuestWishlist();
          if (!items.some((i) => i.variantId === String(variantId))) {
            items.push({ ...productData, variantId: String(variantId), addedAt: new Date().toISOString() });
            saveGuestWishlist(items);
            await trackEvent("wishlist_added", {
              variantId: String(variantId),
              productId: String(productData.productId || ""),
              sourcePage: productData.sourcePage || "",
            });
          }
        }
        wishlistSet.add(String(variantId));
        setButtonState(button, "selected");
      }
    } catch (_) {
      setButtonState(button, "error");
      setTimeout(() => setButtonState(button, isInWishlist ? "selected" : "default"), 2000);
    }

    updateAllButtons();
  }

  // ─── Button rendering ─────────────────────────────────────────────────────

  const ICON_SIZES = { small: "18px", medium: "24px", large: "32px" };

  function effectiveIconSize() {
    const isNarrow = window.matchMedia && window.matchMedia("(max-width: 749px)").matches;
    const key = isNarrow ? config.mobileIconSize || config.iconSize : config.iconSize;
    return key || "medium";
  }

  function heartSVG(filled, color, sizeKey) {
    const sz = ICON_SIZES[sizeKey] || "24px";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 24 24"
      fill="${filled ? color : "none"}" stroke="${color}" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" style="display:block">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;
  }

  function setButtonState(button, state) {
    const isSelected = state === "selected";
    const color = isSelected ? config.selectedColor : config.unselectedColor;
    const sz = effectiveIconSize();

    if (config.iconStyle === "heart") {
      button.innerHTML =
        state === "loading"
          ? `<span style="display:inline-block;width:${ICON_SIZES[sz]};height:${ICON_SIZES[sz]};opacity:0.5">${heartSVG(false, color, sz)}</span>`
          : heartSVG(isSelected, color, sz);
    } else {
      button.textContent = isSelected ? config.selectedButtonText || "Saved ♥" : config.buttonText || "Add to Wishlist";
      button.style.background = isSelected ? config.selectedColor : "";
      button.style.color = isSelected ? "#fff" : "";
    }

    button.setAttribute("aria-label", isSelected ? "Remove from Wishlist" : "Add to Wishlist");
    button.dataset.state = state;
  }

  function bindHover(button) {
    if (!config.hoverColor || config.iconStyle !== "heart") return;
    button.addEventListener("mouseenter", () => {
      if (button.dataset.state === "default") {
        button.innerHTML = heartSVG(false, config.hoverColor, effectiveIconSize());
      }
    });
    button.addEventListener("mouseleave", () => {
      if (button.dataset.state === "default") {
        setButtonState(button, "default");
      }
    });
  }

  function createWishlistButton(productData) {
    const btn = document.createElement("button");
    btn.className = `wishmax-btn wishmax-btn--${config.iconStyle}`;
    btn.setAttribute("aria-label", "Add to Wishlist");
    btn.dataset.variantId = String(productData.variantId);
    btn.style.cssText = "background:none;border:none;cursor:pointer;padding:4px;line-height:1;";

    const inWishlist = wishlistSet.has(String(productData.variantId));
    setButtonState(btn, inWishlist ? "selected" : "default");
    bindHover(btn);
    applyTypographyToButton(btn);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pdpForm = document.querySelector('form[action*="/cart/add"]');
      if (pdpForm && productData.sourcePage === "pdp") {
        const vidInput = pdpForm.querySelector('[name="id"]');
        if (vidInput && vidInput.tagName === "SELECT") {
          const opt = vidInput.selectedOptions && vidInput.selectedOptions[0];
          if (!opt || opt.disabled) {
            alert("Please select an available product variant first.");
            return;
          }
        }
      }
      toggleWishlist(btn, productData);
    });

    return btn;
  }

  function updateAllButtons() {
    document.querySelectorAll(".wishmax-btn").forEach((btn) => {
      const variantId = btn.dataset.variantId;
      if (variantId) {
        const inWishlist = wishlistSet.has(String(variantId));
        setButtonState(btn, inWishlist ? "selected" : "default");
        applyTypographyToButton(btn);
      }
    });
  }

  // ─── Inject into PDP ──────────────────────────────────────────────────────

  function injectPDP() {
    if (!config.showOnPDP) return;
    if (document.querySelector(".wishmax-btn--pdp")) return;

    const meta = document.querySelector('meta[name="product-id"]');
    const productId = meta?.content || window.__WISHMAX_PRODUCT_ID__;
    if (!productId) return;

    const addToCartForm = document.querySelector('form[action*="/cart/add"]');
    if (!addToCartForm) return;

    const variantInput = addToCartForm.querySelector('[name="id"]');
    const variantId = variantInput?.value || productId;

    const productData = {
      productId: String(productId),
      variantId: String(variantId),
      productTitle: document.title.split(" – ")[0],
      productImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") || "",
      productHandle: window.location.pathname.replace("/products/", "").split("?")[0],
      price: document.querySelector('[class*="price"]')?.textContent?.trim() || "",
      sourcePage: "pdp",
    };

    const btn = createWishlistButton(productData);
    btn.classList.add("wishmax-btn--pdp");
    btn.style.marginTop = "8px";

    const wrapper = document.createElement("div");
    wrapper.className = "wishmax-pdp-wrapper";
    let wrapStyle = "display:flex;align-items:center;margin-top:8px;";
    if (config.fullWidthButtonOnPdp && config.iconStyle === "button") {
      wrapStyle += "width:100%;max-width:100%;";
      btn.style.width = "100%";
      btn.style.maxWidth = "100%";
      btn.style.boxSizing = "border-box";
    }
    wrapper.style.cssText = wrapStyle;
    wrapper.appendChild(btn);

    addToCartForm.parentNode?.insertBefore(wrapper, addToCartForm.nextSibling);

    addToCartForm.addEventListener("change", () => {
      const newVariantId = addToCartForm.querySelector('[name="id"]')?.value;
      if (newVariantId && newVariantId !== btn.dataset.variantId) {
        btn.dataset.variantId = String(newVariantId);
        productData.variantId = String(newVariantId);
        setButtonState(btn, wishlistSet.has(String(newVariantId)) ? "selected" : "default");
      }
    });
  }

  // ─── Inject into PLP / Collection ─────────────────────────────────────────

  function injectPLP() {
    if (!config.showOnPLP) return;

    document.querySelectorAll("[data-product-id],[data-product-handle],.product-item,.product-card,.grid__item").forEach((card) => {
      if (card.querySelector(".wishmax-btn--plp")) return;

      const productId = card.dataset.productId || card.querySelector("[data-product-id]")?.dataset.productId;
      const variantId = card.dataset.variantId || productId;
      if (!productId) return;

      const img = card.querySelector("img");
      const imgWrapper = img?.closest("a, .product__media, .card__media, [class*='image']") || img?.parentElement;
      if (!imgWrapper) return;

      imgWrapper.style.position = "relative";

      const productData = {
        productId: String(productId),
        variantId: String(variantId),
        productTitle: card.querySelector("[class*='title'], h3, h2")?.textContent?.trim() || "",
        productImage: img?.src || "",
        productHandle: card.querySelector("a[href*='/products/']")?.pathname.replace("/products/", "").split("?")[0] || "",
        price: card.querySelector("[class*='price']")?.textContent?.trim() || "",
        sourcePage: "plp",
      };

      const btn = createWishlistButton(productData);
      btn.classList.add("wishmax-btn--plp");
      btn.style.cssText += getPlpPositionCss();

      imgWrapper.appendChild(btn);
    });
  }

  // ─── Cart page ────────────────────────────────────────────────────────────

  async function injectCart() {
    if (!config.showOnCart) return;
    if (!window.location.pathname.includes("/cart")) return;
    if (document.querySelector(".wishmax-cart-done")) return;

    let cart;
    try {
      const res = await fetch("/cart.js");
      cart = await res.json();
    } catch (_) {
      return;
    }

    const rows = document.querySelectorAll(".cart-item, tr.cart-item, [data-cart-item]");
    cart.items.forEach((line, index) => {
      const row = rows[index];
      if (!row || row.querySelector(".wishmax-btn--cart")) return;

      const productData = {
        productId: String(line.product_id),
        variantId: String(line.variant_id),
        productTitle: line.title,
        productImage: line.image,
        productHandle: typeof line.url === "string" ? line.url.replace("/products/", "").split("?")[0] : "",
        price: line.presentment_price != null ? String(line.presentment_price) : "",
        sourcePage: "cart",
      };

      const btn = createWishlistButton(productData);
      btn.classList.add("wishmax-btn--cart");
      btn.style.cssText += "margin-left:8px;vertical-align:middle;";

      const anchor = row.querySelector("td:last-of-type, .cart-item__details, .cart-item__totals") || row;
      anchor.appendChild(btn);
    });

    const marker = document.createElement("div");
    marker.className = "wishmax-cart-done";
    marker.style.display = "none";
    document.body.appendChild(marker);
  }

  // ─── Header counter ───────────────────────────────────────────────────────

  function updateHeaderCount() {
    if (!config.showInHeader) return;

    const count = wishlistSet.size;
    let badge = document.querySelector(".wishmax-header-count");

    if (!badge) {
      const headerLink = document.querySelector('.wishmax-header-link, a[href="/wishlist"]');
      if (!headerLink) return;
      badge = document.createElement("span");
      badge.className = "wishmax-header-count";
      badge.style.cssText =
        "display:inline-flex;align-items:center;justify-content:center;background:#e53e3e;color:#fff;border-radius:50%;font-size:11px;min-width:16px;height:16px;padding:0 3px;margin-left:2px;";
      headerLink.appendChild(badge);
    }

    badge.textContent = String(count);
    badge.style.display = count > 0 ? "inline-flex" : "none";
  }

  // ─── Guest → logged-in merge ──────────────────────────────────────────────

  async function mergeGuestWishlist() {
    if (!CUSTOMER_ID) return;
    const guestItems = getGuestWishlist();
    if (guestItems.length === 0) return;

    try {
      await apiAction("merge", { guestItems });
      localStorage.removeItem(GUEST_KEY);
    } catch (_) {}
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  async function init() {
    await loadConfig();
    applyAdvancedTheme();
    await mergeGuestWishlist();
    await refreshWishlistSet();

    injectPDP();
    injectPLP();
    injectCart();
    applyAdvancedTheme();
    updateHeaderCount();

    const observer = new MutationObserver(() => {
      injectPLP();
      injectCart();
      updateHeaderCount();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
