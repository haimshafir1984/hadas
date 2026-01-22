import { prisma } from "@/lib/prisma";
import { isLowStock, lowStockThreshold } from "@/lib/inventory";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { addStock, createProduct, recordSale } from "./actions";
import { InventoryOcrUpload } from "@/components/inventory-ocr";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { SaleBarcodeHelper } from "@/components/sale-barcode-helper";

export const dynamic = "force-dynamic";

type InventoryPageProps = {
  searchParams?: { department?: string; model?: string; barcode?: string };
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const [products, suppliers, recentOut] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: { supplier: true }
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.inventoryTransaction.findMany({
      where: {
        type: "OUT",
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        }
      },
      select: { productId: true }
    })
  ]);

  const departments = Array.from(
    new Set(products.map((product) => product.department).filter(Boolean))
  );
  const models = Array.from(
    new Set(products.map((product) => product.model).filter(Boolean))
  );

  const selectedDepartment = searchParams?.department ?? "all";
  const selectedModel = searchParams?.model ?? "all";
  const selectedBarcode = searchParams?.barcode?.trim() ?? "";

  const filteredProducts = products.filter((product) => {
    if (selectedDepartment !== "all" && product.department !== selectedDepartment) {
      return false;
    }
    if (selectedModel !== "all" && product.model !== selectedModel) {
      return false;
    }
    if (selectedBarcode && product.barcode !== selectedBarcode) {
      return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const ratioA = a.maxStock ? a.currentStock / a.maxStock : 0;
    const ratioB = b.maxStock ? b.currentStock / b.maxStock : 0;
    return ratioA - ratioB;
  });

  const recentOutSet = new Set(recentOut.map((entry) => entry.productId));
  const deadStock = products.filter((product) => !recentOutSet.has(product.id));

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">ניהול מלאי</h1>
        <p className="text-slate-500">
          ניהול מלאי עם התראות חוסרים בזמן אמת.
        </p>
      </header>

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin">הזנת נתונים</TabsTrigger>
          <TabsTrigger value="view">תצוגת משתמש</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                הוספה חדשה
              </h2>
              <form action={createProduct} className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מוצר</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">מק״ט</Label>
                  <Input id="sku" name="sku" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">ברקוד</Label>
                  <Input id="barcode" name="barcode" />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="department">מחלקה</Label>
                    <Input id="department" name="department" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">דגם</Label>
                    <Input id="model" name="model" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size">מידה</Label>
                    <Input id="size" name="size" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplierId">בחר ספק</Label>
                  <select
                    id="supplierId"
                    name="supplierId"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                  >
                    <option value="">ללא ספק</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">מלאי מקסימלי</Label>
                    <Input
                      id="maxStock"
                      name="maxStock"
                      type="number"
                      min="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="initialStock">מלאי התחלתי</Label>
                    <Input
                      id="initialStock"
                      name="initialStock"
                      type="number"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                </div>
                <Button type="submit">שמירת מוצר</Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                תנועות מלאי
              </h2>
              <div className="mt-4 grid gap-4">
                <form action={addStock} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    הוספת מלאי (כניסה)
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="addProduct">מוצר</Label>
                    <select
                      id="addProduct"
                      name="productId"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                      required
                    >
                      <option value="">בחר</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addQty">כמות</Label>
                    <Input id="addQty" name="quantity" type="number" min="1" />
                  </div>
                  <Button type="submit" variant="secondary">
                    הוסף מלאי
                  </Button>
                </form>

                <form action={recordSale} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    רישום מכירה (יציאה)
                  </h3>
                  <div className="space-y-2">
                    <Label>סריקת ברקוד למכירה</Label>
                    <SaleBarcodeHelper
                      products={products.map((product) => ({
                        id: product.id,
                        name: product.name,
                        barcode: product.barcode
                      }))}
                      productSelectId="saleProduct"
                      quantityInputId="saleQty"
                      barcodeInputId="saleBarcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleProduct">מוצר</Label>
                    <select
                      id="saleProduct"
                      name="productId"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                      required
                    >
                      <option value="">בחר</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleQty">כמות</Label>
                    <Input id="saleQty" name="quantity" type="number" min="1" />
                  </div>
                  <Button type="submit" variant="outline">
                    שמור מכירה
                  </Button>
                </form>
              </div>
            </Card>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                העלאת חשבונית
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                העלה תמונת חשבונית לצורך חילוץ פריטים אוטומטי.
              </p>
              <div className="mt-4">
                <InventoryOcrUpload />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="view">
          <Card className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-slate-900">
              תצוגת מלאי
            </h2>
            <form
              id="inventoryFilters"
              method="get"
              className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="departmentFilter">מחלקה</Label>
                <select
                  id="departmentFilter"
                  name="department"
                  defaultValue={selectedDepartment}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                >
                  <option value="all">הכל</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelFilter">דגם</Label>
                <select
                  id="modelFilter"
                  name="model"
                  defaultValue={selectedModel}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                >
                  <option value="all">הכל</option>
                  {models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcodeFilter">ברקוד</Label>
                <Input
                  id="barcodeFilter"
                  name="barcode"
                  defaultValue={selectedBarcode}
                  placeholder="סרוק או הזן ברקוד"
                />
              </div>
              <Button type="submit">סינון</Button>
            </form>
            <div className="mt-4">
              <BarcodeScanner inputId="barcodeFilter" formId="inventoryFilters" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <thead className="border-b border-slate-200 text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">מוצר</th>
                    <th className="py-2 pr-4">מק״ט</th>
                    <th className="py-2 pr-4">ברקוד</th>
                    <th className="py-2 pr-4">מחלקה</th>
                    <th className="py-2 pr-4">דגם</th>
                    <th className="py-2 pr-4">מידה</th>
                    <th className="py-2 pr-4">ספק</th>
                    <th className="py-2 pr-4">מלאי נוכחי</th>
                    <th className="py-2 pr-4">מדד מלאי</th>
                    <th className="py-2 pr-4">התראת מלאי נמוך</th>
                    <th className="py-2 pr-4">פעולות מהירות</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => {
                    const lowStock = isLowStock(product);
                    const threshold = lowStockThreshold(product.maxStock);
                    const ratio = Math.min(
                      100,
                      Math.round((product.currentStock / product.maxStock) * 100)
                    );
                    const status =
                      ratio <= 10 ? "critical" : ratio <= 30 ? "warning" : "ok";
                    const rowClass =
                      status === "critical"
                        ? "bg-red-50 text-red-700"
                        : status === "warning"
                          ? "bg-amber-50 text-amber-700"
                          : "border-b border-slate-100 text-slate-700";
                    return (
                      <tr
                        key={product.id}
                        className={rowClass}
                      >
                        <td className="py-2 pr-4 font-medium text-slate-900">
                          {product.name}
                        </td>
                        <td className="py-2 pr-4">{product.sku}</td>
                        <td className="py-2 pr-4">{product.barcode ?? "-"}</td>
                        <td className="py-2 pr-4">{product.department}</td>
                        <td className="py-2 pr-4">{product.model}</td>
                        <td className="py-2 pr-4">{product.size}</td>
                        <td className="py-2 pr-4">
                          {product.supplier?.name ?? "לא הוגדר"}
                        </td>
                        <td className="py-2 pr-4">{product.currentStock}</td>
                        <td className="py-2 pr-4">
                          <div className="h-2.5 w-40 rounded-full bg-slate-200">
                            <div
                              className={`h-2.5 rounded-full ${
                                status === "critical"
                                  ? "bg-red-500"
                                  : status === "warning"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2 pr-4">
                          {status === "critical"
                            ? `התראת מלאי נמוך (סף ${threshold})`
                            : status === "warning"
                              ? "אזהרה"
                              : "תקין"}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex gap-2">
                            <form action={addStock}>
                              <input type="hidden" name="productId" value={product.id} />
                              <input type="hidden" name="quantity" value="1" />
                              <Button type="submit" variant="outline">
                                +1
                              </Button>
                            </form>
                            <form action={recordSale}>
                              <input type="hidden" name="productId" value={product.id} />
                              <input type="hidden" name="quantity" value="1" />
                              <Button type="submit" variant="outline">
                                -1
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-slate-900">
              מלאי מת (60 ימים ללא מכירה)
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              פריטים שלא נמכרו ב־60 הימים האחרונים.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {deadStock.length === 0 && (
                <p className="text-sm text-slate-500">אין מלאי מת כרגע.</p>
              )}
              {deadStock.map((product) => (
                <div
                  key={`dead-${product.id}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <span className="font-semibold text-slate-900">{product.name}</span>{" "}
                  · {product.sku}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

