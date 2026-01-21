-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "birthDate" DATETIME;

-- CreateTable
CREATE TABLE "DailyTarget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "targetAmount" REAL NOT NULL,
    "bonusReward" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "department" TEXT NOT NULL DEFAULT 'לא משויך',
    "model" TEXT NOT NULL DEFAULT 'לא משויך',
    "size" TEXT NOT NULL DEFAULT 'כללי',
    "maxStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "currentStock", "id", "maxStock", "name", "sku", "updatedAt") SELECT "createdAt", "currentStock", "id", "maxStock", "name", "sku", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DailyTarget_date_key" ON "DailyTarget"("date");
