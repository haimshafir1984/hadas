import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import {
  getDailyTarget,
  getEmployeeDailyHours,
  getEmployeeDailySales,
  getEmployeeMonthlyStats
} from "@/lib/employee";
import { createEmployee, logSale, logShift, setDailyTarget, clockIn, clockOut } from "./actions";
import { Activity, TrendingUp, Trophy, Wallet } from "lucide-react";
import { DailyTasks } from "@/components/daily-tasks";

type EmployeesPageProps = {
  searchParams?: { employeeId?: string };
};

export const dynamic = "force-dynamic";

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" }
  });

  const selectedId = Number(searchParams?.employeeId || employees[0]?.id);
  const selectedEmployee = employees.find((employee) => employee.id === selectedId);
  const stats = selectedEmployee
    ? await getEmployeeMonthlyStats(selectedEmployee.id)
    : null;
  const dailySales = selectedEmployee
    ? await getEmployeeDailySales(selectedEmployee.id)
    : null;
  const dailyHours = selectedEmployee
    ? await getEmployeeDailyHours(selectedEmployee.id)
    : null;
  const dailyTarget = await getDailyTarget();
  const dailyProgress =
    dailyTarget && dailySales !== null
      ? Math.min(100, Math.round((dailySales / dailyTarget.targetAmount) * 100))
      : 0;
  const minHoursForBonus = 4;
  const isDailyBonusReached =
    dailyTarget &&
    dailySales !== null &&
    dailySales >= dailyTarget.targetAmount &&
    (dailyHours ?? 0) >= minHoursForBonus;

  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const existingTasks = selectedEmployee
    ? await prisma.dailyTask.findMany({
        where: {
          employeeId: selectedEmployee.id,
          date: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        orderBy: { id: "asc" }
      })
    : [];

  if (selectedEmployee && existingTasks.length === 0) {
    const defaultTasks = [
      "פתיחת קופה",
      "סידור מדף ראשי",
      "בדיקת מלאי חם",
      "עדכון מבצעים יומיים"
    ];
    await prisma.dailyTask.createMany({
      data: defaultTasks.map((label) => ({
        employeeId: selectedEmployee.id,
        date: dayStart,
        label
      }))
    });
  }

  const dailyTasks = selectedEmployee
    ? await prisma.dailyTask.findMany({
        where: {
          employeeId: selectedEmployee.id,
          date: {
            gte: dayStart,
            lt: dayEnd
          }
        },
        orderBy: { id: "asc" }
      })
    : [];

  const openEntry = selectedEmployee
    ? await prisma.timeEntry.findFirst({
        where: {
          employeeId: selectedEmployee.id,
          clockOut: null
        }
      })
    : null;

  return (
    <>
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">ניהול עובדים</h1>
        <p className="text-slate-500">
          ניהול מכירות, בונוסים ומשמרות לעובדים.
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
              <form action={createEmployee} className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">שם מלא</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">מספר עובד</Label>
                  <Input id="employeeCode" name="employeeCode" required />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">שכר לשעה</Label>
                    <Input id="hourlyRate" name="hourlyRate" type="number" min="0" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesTarget">יעד מכירות</Label>
                    <Input id="salesTarget" name="salesTarget" type="number" min="0" required />
                  </div>
                </div>
                <Button type="submit">שמירת עובד</Button>
              </form>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                מכירות ומשמרות
              </h2>
              <div className="mt-4 grid gap-4">
                <form action={logSale} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    רישום מכירה (כולל אחוז בונוס)
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="saleEmployee">עובד</Label>
                    <select
                      id="saleEmployee"
                      name="employeeId"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                      required
                    >
                      <option value="">בחר</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">סכום מכירה</Label>
                      <Input id="amount" name="amount" type="number" min="1" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bonusRate">אחוז בונוס</Label>
                      <Input id="bonusRate" name="bonusRate" type="number" min="0" step="0.1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleDate">תאריך</Label>
                    <Input id="saleDate" name="date" type="date" />
                  </div>
                  <Button type="submit" variant="secondary">
                    שמור מכירה
                  </Button>
                </form>

                <form action={logShift} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600">
                    רישום משמרת
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="shiftEmployee">עובד</Label>
                    <select
                      id="shiftEmployee"
                      name="employeeId"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                      required
                    >
                      <option value="">בחר</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employeeCode})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="hours">שעות</Label>
                      <Input id="hours" name="hours" type="number" min="1" step="0.5" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shiftDate">תאריך</Label>
                      <Input id="shiftDate" name="date" type="date" />
                    </div>
                  </div>
                  <Button type="submit" variant="outline">
                    שמור משמרת
                  </Button>
                </form>
              </div>
            </Card>
            </div>

            <Card>
              <h2 className="text-lg font-semibold text-slate-900">
                יעד יומי ובונוס
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                הגדירו יעד יומי לכלל החנות ובונוס קבוע לעמידה ביעד.
              </p>
              <form action={setDailyTarget} className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="targetDate">תאריך</Label>
                  <Input
                    id="targetDate"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">יעד מכירות יומי</Label>
                  <Input id="targetAmount" name="targetAmount" type="number" min="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonusReward">בונוס קבוע</Label>
                  <Input id="bonusReward" name="bonusReward" type="number" min="0" />
                </div>
                <div className="md:col-span-3">
                  <Button type="submit">שמירת יעד יומי</Button>
                </div>
              </form>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="view">
          <Card className="mx-auto max-w-5xl">
            <h2 className="text-lg font-semibold text-slate-900">
              דשבורד עובד
            </h2>
            <form method="get" className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
              <div className="space-y-2">
                <Label htmlFor="employeeSelect">עובד</Label>
                <select
                  id="employeeSelect"
                  name="employeeId"
                  defaultValue={selectedEmployee?.id ?? ""}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                >
                  {employees.length === 0 && <option value="">אין עובדים</option>}
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit">טען דשבורד</Button>
            </form>

            {stats ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <p className="text-xs uppercase">בונוס חודשי</p>
                    <Wallet size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-emerald-600">
                    ₪{stats.monthlyBonus.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <p className="text-xs uppercase">מכירות החודש</p>
                    <TrendingUp size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-emerald-600">
                    ₪{stats.totalSales.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <p className="text-xs uppercase">סה״כ משמרות</p>
                    <Activity size={16} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {stats.totalShifts}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                אין עובדים להצגה. הוסף עובד במקטע הניהול.
              </p>
            )}

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <p className="text-xs uppercase">התקדמות ליעד היומי</p>
                <Trophy size={16} />
              </div>
              {dailyTarget ? (
                <>
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    ₪{dailySales?.toFixed(0) ?? 0} / ₪{dailyTarget.targetAmount.toFixed(0)}
                  </p>
                  <div className="mt-3 h-2.5 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-2.5 rounded-full ${
                        isDailyBonusReached ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${dailyProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {isDailyBonusReached
                      ? `זכאות לבונוס: ₪${dailyTarget.bonusReward}`
                      : "המשך מכירות ושעות עבודה כדי להגיע לבונוס"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    נדרש לפחות {minHoursForBonus} שעות כדי לקבל בונוס יומי.
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  אין יעד יומי מוגדר להיום.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">נוכחות</h3>
              <p className="mt-2 text-sm text-slate-500">
                שעות עבודה היום: {dailyHours?.toFixed(2) ?? "0.00"}
              </p>
              {selectedEmployee && (
                <div className="mt-3 flex gap-2">
                  <form action={clockIn}>
                    <input type="hidden" name="employeeId" value={selectedEmployee.id} />
                    <Button type="submit" disabled={Boolean(openEntry)}>
                      כניסה למשמרת
                    </Button>
                  </form>
                  <form action={clockOut}>
                    <input type="hidden" name="employeeId" value={selectedEmployee.id} />
                    <Button type="submit" variant="outline" disabled={!openEntry}>
                      יציאה ממשמרת
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700">משימות יומיות</h3>
              <p className="mt-2 text-sm text-slate-500">
                הרשימה מתאפסת בכל בוקר.
              </p>
              <div className="mt-4">
                {selectedEmployee ? (
                  <DailyTasks tasks={dailyTasks} employeeId={selectedEmployee.id} />
                ) : (
                  <p className="text-sm text-slate-500">בחר עובד להצגת משימות.</p>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

