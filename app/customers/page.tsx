import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { createCustomer } from "./actions";
import { CustomerBroadcast } from "@/components/customer-broadcast";
import { BirthdayGreetingButton } from "@/components/birthday-greeting";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { joinedAt: "desc" }
  });

  const getTier = (customer: (typeof customers)[number]) => {
    const lastVisit = customer.lastVisit ? new Date(customer.lastVisit) : null;
    const daysSinceVisit = lastVisit
      ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (customer.totalSpend >= 2000 && (daysSinceVisit === null || daysSinceVisit <= 60)) {
      return { label: "VIP", className: "bg-amber-100 text-amber-700" };
    }
    if (customer.totalSpend >= 500 && (daysSinceVisit === null || daysSinceVisit <= 90)) {
      return { label: "Active", className: "bg-emerald-100 text-emerald-700" };
    }
    return { label: "Inactive", className: "bg-slate-100 text-slate-600" };
  };
  const today = new Date();
  const birthdayCustomers = customers.filter((customer) => {
    if (!customer.birthDate) return false;
    return (
      customer.birthDate.getDate() === today.getDate() &&
      customer.birthDate.getMonth() === today.getMonth()
    );
  });

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">מועדון לקוחות</h1>
        <p className="text-slate-500">
          הרשמה למועדון לקוחות ושליחת הודעות שיווק.
        </p>
      </header>

      <Tabs defaultValue="admin">
        <TabsList>
          <TabsTrigger value="admin">הזנת נתונים</TabsTrigger>
          <TabsTrigger value="view">תצוגת משתמש</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          <Card className="mx-auto max-w-3xl">
            <h2 className="text-lg font-semibold text-slate-900">
              הוספה חדשה
            </h2>
            <form action={createCustomer} className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">שם מלא</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">טלפון</Label>
                <Input id="phone" name="phone" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalSpend">סך רכישות</Label>
                  <Input id="totalSpend" name="totalSpend" type="number" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastVisit">ביקור אחרון</Label>
                  <Input id="lastVisit" name="lastVisit" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">תאריך לידה</Label>
                <Input id="birthDate" name="birthDate" type="date" />
              </div>
              <Button type="submit">שמירת לקוח</Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="view">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                סטטוס ימי הולדת
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                לקוחות שחוגגים יום הולדת היום.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {birthdayCustomers.length === 0 && (
                  <li>אין היום ימי הולדת.</li>
                )}
                {birthdayCustomers.map((customer) => (
                  <li key={customer.id} className="flex justify-between">
                    <span className="text-slate-900">{customer.name}</span>
                    <span className="text-slate-500">{customer.phone}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <BirthdayGreetingButton
                  names={birthdayCustomers.map((customer) => customer.name)}
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                שידור ללקוחות
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                שליחת הודעה לכל לקוחות המועדון (סימולציה).
              </p>
              <div className="mt-4">
                <CustomerBroadcast />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                רשימת לקוחות
              </h2>
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <thead className="border-b border-slate-200 text-left text-slate-500">
                    <tr>
                      <th className="py-2 pr-4">שם</th>
                      <th className="py-2 pr-4">טלפון</th>
                      <th className="py-2 pr-4">אימייל</th>
                      <th className="py-2 pr-4">דירוג</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => {
                      const tier = getTier(customer);
                      return (
                        <tr key={customer.id} className="border-b border-slate-100 text-slate-700">
                          <td className="py-2 pr-4 font-medium text-slate-900">{customer.name}</td>
                          <td className="py-2 pr-4">{customer.phone}</td>
                          <td className="py-2 pr-4">{customer.email}</td>
                          <td className="py-2 pr-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${tier.className}`}
                            >
                              {tier.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
                {customers.length === 0 && (
                  <p className="mt-4 text-sm text-slate-500">
                    עדיין אין לקוחות רשומים.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

