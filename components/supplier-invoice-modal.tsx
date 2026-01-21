"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type SupplierOption = {
  id: number;
  name: string;
};

type SupplierInvoiceModalProps = {
  suppliers: SupplierOption[];
  action: (formData: FormData) => void | Promise<void>;
};

export function SupplierInvoiceModal({ suppliers, action }: SupplierInvoiceModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        רישום חשבונית
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                רישום חשבונית ספק
              </h3>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={action}
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={() => setOpen(false)}
            >
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="supplierId">
                  בחר ספק
                </label>
                <select
                  id="supplierId"
                  name="supplierId"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                  required
                >
                  <option value="">בחר ספק</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="invoiceDate">
                  תאריך חשבונית
                </label>
                <input
                  id="invoiceDate"
                  name="invoiceDate"
                  type="date"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="totalAmount">
                  סכום כולל
                </label>
                <input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="1"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="numberOfPayments">
                  תשלומים
                </label>
                <input
                  id="numberOfPayments"
                  name="numberOfPayments"
                  type="number"
                  min="1"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="invoiceImage">
                  העלאת חשבונית
                </label>
                <input
                  id="invoiceImage"
                  name="invoiceImage"
                  type="file"
                  accept="image/*"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  ביטול
                </Button>
                <Button type="submit">שמירת חשבונית</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

