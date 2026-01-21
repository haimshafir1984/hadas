import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

type MonthlyBucket = {
  month: string;
  total: number;
};

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default async function FinancePage() {
  const invoices = await prisma.supplierInvoice.findMany({
    orderBy: { createdAt: "desc" }
  });

  const buckets = new Map<string, number>();
  const paymentEvents: Array<{ date: Date; amount: number }> = [];

  invoices.forEach((invoice) => {
    let dates: string[] = [];
    try {
      dates = JSON.parse(invoice.paymentDates || "[]") as string[];
    } catch {
      dates = [];
    }
    const amount =
      invoice.numberOfPayments > 0
        ? invoice.totalAmount / invoice.numberOfPayments
        : 0;
    dates.forEach((date) => {
      const parsed = new Date(date);
      paymentEvents.push({ date: parsed, amount });
      const key = formatMonthKey(parsed);
      buckets.set(key, (buckets.get(key) || 0) + amount);
    });
  });

  const monthlyTotals: MonthlyBucket[] = Array.from(buckets.entries())
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const maxTotal = Math.max(1, ...monthlyTotals.map((item) => item.total));
  const upcomingWeek = paymentEvents.filter((event) => {
    const diff = event.date.getTime() - Date.now();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">תזרים מזומנים</h1>
        <p className="text-slate-500">
          תחזית תשלומים חודשית לפי חשבוניות ספקים.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">
            תשלומים קרובים
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {upcomingWeek.length} תשלומים ב־7 הימים הקרובים.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {upcomingWeek.length === 0 && <li>אין תשלומים קרובים.</li>}
            {upcomingWeek.map((event, index) => (
              <li key={`event-${index}`} className="flex justify-between">
                <span>{event.date.toLocaleDateString("he-IL")}</span>
                <span>₪{event.amount.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            תחזית חודשית
          </h2>
          <div className="mt-4 space-y-3">
            {monthlyTotals.length === 0 && (
              <p className="text-sm text-slate-500">
                אין נתונים להצגה.
              </p>
            )}
            {monthlyTotals.map((item) => (
              <div key={item.month} className="flex items-center gap-3">
                <div className="w-20 text-sm text-slate-600">
                  {item.month}
                </div>
                <div className="h-2.5 flex-1 rounded-full bg-slate-200">
                  <div
                    className="h-2.5 rounded-full bg-indigo-500"
                    style={{ width: `${(item.total / maxTotal) * 100}%` }}
                  />
                </div>
                <div className="w-24 text-sm text-slate-700 text-left">
                  ₪{item.total.toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

