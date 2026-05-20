-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistConfig" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "iconStyle" TEXT NOT NULL DEFAULT 'heart',
    "unselectedColor" TEXT NOT NULL DEFAULT '#000000',
    "selectedColor" TEXT NOT NULL DEFAULT '#e53e3e',
    "iconSize" TEXT NOT NULL DEFAULT 'medium',
    "showOnPDP" BOOLEAN NOT NULL DEFAULT true,
    "showOnPLP" BOOLEAN NOT NULL DEFAULT true,
    "showOnCart" BOOLEAN NOT NULL DEFAULT true,
    "showInHeader" BOOLEAN NOT NULL DEFAULT true,
    "allowGuest" BOOLEAN NOT NULL DEFAULT true,
    "allowShare" BOOLEAN NOT NULL DEFAULT true,
    "redirectToCart" BOOLEAN NOT NULL DEFAULT true,
    "emptyStateMessage" TEXT NOT NULL DEFAULT 'Your wishlist is empty.',
    "wishlistPageHandle" TEXT NOT NULL DEFAULT 'wishlist',
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Wishlist',
    "selectedButtonText" TEXT NOT NULL DEFAULT 'Saved ♥',
    "hoverColor" TEXT,
    "mobileIconSize" TEXT NOT NULL DEFAULT 'medium',
    "flowAutomationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requireApiKeyForMutations" BOOLEAN NOT NULL DEFAULT false,
    "customCss" TEXT,
    "fullWidthButtonOnPdp" BOOLEAN NOT NULL DEFAULT false,
    "plpIconPlacement" TEXT NOT NULL DEFAULT 'top_right',
    "googleFontFamily" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productTitle" TEXT NOT NULL,
    "variantTitle" TEXT,
    "productImage" TEXT,
    "productHandle" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "compareAtPrice" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "sourcePage" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistShare" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistGuestShare" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WishlistGuestShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistEvent" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT,
    "guestId" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "sourcePage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeadlessApiKey" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeadlessApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistOrderAttribution" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "subtotal" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistOrderAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistConfig_shop_key" ON "WishlistConfig"("shop");

-- CreateIndex
CREATE INDEX "WishlistItem_shop_customerId_idx" ON "WishlistItem"("shop", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shop_customerId_variantId_key" ON "WishlistItem"("shop", "customerId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistShare_token_key" ON "WishlistShare"("token");

-- CreateIndex
CREATE INDEX "WishlistShare_shop_idx" ON "WishlistShare"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistShare_shop_customerId_key" ON "WishlistShare"("shop", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistGuestShare_token_key" ON "WishlistGuestShare"("token");

-- CreateIndex
CREATE INDEX "WishlistGuestShare_shop_guestId_idx" ON "WishlistGuestShare"("shop", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistGuestShare_shop_guestId_key" ON "WishlistGuestShare"("shop", "guestId");

-- CreateIndex
CREATE INDEX "WishlistEvent_shop_createdAt_idx" ON "WishlistEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "WishlistEvent_shop_type_idx" ON "WishlistEvent"("shop", "type");

-- CreateIndex
CREATE INDEX "HeadlessApiKey_shop_idx" ON "HeadlessApiKey"("shop");

-- CreateIndex
CREATE INDEX "WishlistOrderAttribution_shop_createdAt_idx" ON "WishlistOrderAttribution"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "WishlistOrderAttribution_shop_customerId_variantId_idx" ON "WishlistOrderAttribution"("shop", "customerId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistOrderAttribution_shop_orderId_lineItemId_key" ON "WishlistOrderAttribution"("shop", "orderId", "lineItemId");
