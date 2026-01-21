import Link from "next/link";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { isLowStock } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, invoices, recentOut] = await Promise.all([
    prisma.product.findMany(),
    prisma.supplierInvoice.findMany(),
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

  const lowStockCount = products.filter((product) => isLowStock(product)).length;
  const recentOutSet = new Set(recentOut.map((entry) => entry.productId));
  const deadStockCount = products.filter((product) => !recentOutSet.has(product.id)).length;

  const paymentsDueThisWeek = invoices.reduce((count, invoice) => {
    let dates: string[] = [];
    try {
      dates = JSON.parse(invoice.paymentDates || "[]") as string[];
    } catch {
      dates = [];
    }
    return (
      count +
      dates.filter((date) => {
        const diff = new Date(date).getTime() - Date.now();
        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
      }).length
    );
  }, 0);
  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">
          לוח בקרה
        </h1>
        <p className="text-slate-500">
          ניהול מרוכז של מלאי, עובדים ומועדון לקוחות.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">ניהול מלאי</h2>
          <p className="mt-2 text-sm text-slate-500">
            ניהול כניסות, יציאות והתראות מלאי.
          </p>
          <Link
            className="mt-4 inline-flex text-sm text-slate-700 underline"
            href="/inventory"
          >
            מעבר לניהול מלאי
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">ניהול עובדים</h2>
          <p className="mt-2 text-sm text-slate-500">
            מכירות, בונוסים ומשמרות.
          </p>
          <Link
            className="mt-4 inline-flex text-sm text-slate-700 underline"
            href="/employees"
          >
            מעבר לניהול עובדים
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">מועדון לקוחות</h2>
          <p className="mt-2 text-sm text-slate-500">
            מועדון לקוחות ושידורי שיווק.
          </p>
          <Link
            className="mt-4 inline-flex text-sm text-slate-700 underline"
            href="/customers"
          >
            מעבר למועדון לקוחות
          </Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">ספקים</h2>
          <p className="mt-2 text-sm text-slate-500">
            מעקב חשבוניות ותשלומים לספקים.
          </p>
          <Link
            className="mt-4 inline-flex text-sm text-slate-700 underline"
            href="/suppliers"
          >
            מעבר לספקים
          </Link>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-slate-500">מלאי נמוך</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {lowStockCount}
          </p>
          <p className="text-sm text-slate-500">פריטים דורשים טיפול עכשיו.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-500">תשלומים קרובים</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {paymentsDueThisWeek}
          </p>
          <p className="text-sm text-slate-500">תשלומים ב־7 הימים הקרובים.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-500">מלאי מת</h3>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {deadStockCount}
          </p>
          <p className="text-sm text-slate-500">פריטים ללא מכירה ב־60 יום.</p>
        </Card>
      </section>
    </>
  );
}

