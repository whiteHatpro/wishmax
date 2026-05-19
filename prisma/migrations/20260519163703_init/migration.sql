-- CreateTable
CREATE TABLE "WishlistConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "iconStyle" TEXT NOT NULL DEFAULT 'heart',
    "unselectedColor" TEXT NOT NULL DEFAULT '#000000',
    "selectedColor" TEXT NOT NULL DEFAULT '#e53e3e',
    "iconSize" TEXT NOT NULL DEFAULT 'medium',
    "showOnPDP" BOOLEAN NOT NULL DEFAULT true,
    "showOnPLP" BOOLEAN NOT NULL DEFAULT true,
    "showInHeader" BOOLEAN NOT NULL DEFAULT true,
    "allowGuest" BOOLEAN NOT NULL DEFAULT true,
    "allowShare" BOOLEAN NOT NULL DEFAULT true,
    "redirectToCart" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistConfig_shop_key" ON "WishlistConfig"("shop");

-- CreateIndex
CREATE INDEX "WishlistItem_shop_customerId_idx" ON "WishlistItem"("shop", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_shop_customerId_variantId_key" ON "WishlistItem"("shop", "customerId", "variantId");
