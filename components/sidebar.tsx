"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Users,
  PackageSearch,
  LayoutDashboard,
  Truck,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/employees", label: "ניהול עובדים", icon: Users },
  { href: "/inventory", label: "ניהול מלאי", icon: PackageSearch },
  { href: "/suppliers", label: "ספקים", icon: Truck },
  { href: "/finance", label: "תזרים מזומנים", icon: BarChart3 },
  { href: "/customers", label: "מועדון לקוחות", icon: Box }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-72 flex-col border-l border-slate-200 bg-white/70 p-6 text-slate-700 shadow-sm backdrop-blur">
      <div className="mb-8 text-lg font-semibold text-slate-900">
        מערכת ניהול קמעונאית
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm transition",
                isActive
                  ? "border-r-[3px] border-indigo-600 bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>{item.label}</span>
              <Icon size={18} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <div className="text-xs text-slate-500">פרופיל משתמש</div>
          <div className="mt-1 font-medium text-slate-900">מנהל החנות</div>
        </div>
        <div className="space-y-2">
          <Link
            href="/settings"
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm transition",
              pathname.startsWith("/settings")
                ? "border-r-[3px] border-indigo-600 bg-slate-100 text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            <span>הגדרות</span>
            <Settings size={18} />
          </Link>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>התנתקות</span>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

