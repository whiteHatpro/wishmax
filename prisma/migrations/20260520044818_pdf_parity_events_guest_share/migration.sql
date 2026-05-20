-- CreateTable
CREATE TABLE "WishlistGuestShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "itemsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customerId" TEXT,
    "guestId" TEXT,
    "productId" TEXT,
    "variantId" TEXT,
    "sourcePage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HeadlessApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WishlistConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_WishlistConfig" ("allowGuest", "allowShare", "createdAt", "iconSize", "iconStyle", "id", "redirectToCart", "selectedColor", "shop", "showInHeader", "showOnPDP", "showOnPLP", "unselectedColor", "updatedAt") SELECT "allowGuest", "allowShare", "createdAt", "iconSize", "iconStyle", "id", "redirectToCart", "selectedColor", "shop", "showInHeader", "showOnPDP", "showOnPLP", "unselectedColor", "updatedAt" FROM "WishlistConfig";
DROP TABLE "WishlistConfig";
ALTER TABLE "new_WishlistConfig" RENAME TO "WishlistConfig";
CREATE UNIQUE INDEX "WishlistConfig_shop_key" ON "WishlistConfig"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WishlistGuestShare_token_key" ON "WishlistGuestShare"("token");

-- CreateIndex
CREATE INDEX "WishlistGuestShare_shop_guestId_idx" ON "WishlistGuestShare"("shop", "guestId");

-- CreateIndex
CREATE INDEX "WishlistEvent_shop_createdAt_idx" ON "WishlistEvent"("shop", "createdAt");

-- CreateIndex
CREATE INDEX "WishlistEvent_shop_type_idx" ON "WishlistEvent"("shop", "type");

-- CreateIndex
CREATE INDEX "HeadlessApiKey_shop_idx" ON "HeadlessApiKey"("shop");
