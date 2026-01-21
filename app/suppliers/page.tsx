import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { createSupplier, logSupplierInvoice } from "./actions";
import { SupplierInvoiceModal } from "@/components/supplier-invoice-modal";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" }
  });

  const invoices = await prisma.supplierInvoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true }
  });

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">ספקים</h1>
        <p className="text-slate-500">
          ניהול פרטי ספקים, חשבוניות ותשלומים עתידיים.
        </p>
      </header>

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin">הזנת נתונים</TabsTrigger>
          <TabsTrigger value="view">תצוגת משתמש</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <div className="mx-auto max-w-5xl space-y-4">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                הוספה חדשה
              </h2>
              <form action={createSupplier} className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name">שם ספק</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">איש קשר</Label>
                  <Input id="contactPerson" name="contactPerson" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input id="phone" name="phone" required />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit">שמירת ספק</Button>
                </div>
              </form>
            </Card>

            <Card>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    חשבוניות ספקים
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    רישום חשבונית עם תשלומים עתידיים והעלאת תמונה.
                  </p>
                </div>
                <SupplierInvoiceModal suppliers={suppliers} action={logSupplierInvoice} />
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="view">
          <Card className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-slate-900">
              חשבוניות אחרונות
            </h2>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <thead className="border-b border-slate-200 text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">ספק</th>
                    <th className="py-2 pr-4">תאריך חשבונית</th>
                    <th className="py-2 pr-4">סכום</th>
                    <th className="py-2 pr-4">תשלומים</th>
                    <th className="py-2 pr-4">תשלומים קרובים</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const dates = Array.isArray(invoice.paymentDates)
                      ? (invoice.paymentDates as string[])
                      : [];
                    const paymentAmount =
                      invoice.numberOfPayments > 0
                        ? invoice.totalAmount / invoice.numberOfPayments
                        : 0;
                    return (
                      <tr key={invoice.id} className="border-b border-slate-100 text-slate-700">
                        <td className="py-2 pr-4 font-medium text-slate-900">
                          {invoice.supplier.name}
                        </td>
                        <td className="py-2 pr-4">
                          {new Date(invoice.invoiceDate).toLocaleDateString("he-IL")}
                        </td>
                        <td className="py-2 pr-4">₪{invoice.totalAmount.toFixed(0)}</td>
                        <td className="py-2 pr-4">{invoice.numberOfPayments}</td>
                        <td className="py-2 pr-4">
                          <ul className="space-y-1 text-sm text-slate-600">
                            {dates.map((date, index) => (
                              <li key={`${invoice.id}-${index}`}>
                                {new Date(date).toLocaleDateString("he-IL")} · ₪
                                {paymentAmount.toFixed(0)}
                              </li>
                            ))}
                            {dates.length === 0 && <li>לא הוגדרו תשלומים</li>}
                          </ul>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              {invoices.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">
                  עדיין אין חשבוניות רשומות.
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

