-- CreateTable
CREATE TABLE "WishlistShare" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WishlistShare_token_key" ON "WishlistShare"("token");

-- CreateIndex
CREATE INDEX "WishlistShare_shop_idx" ON "WishlistShare"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistShare_shop_customerId_key" ON "WishlistShare"("shop", "customerId");
