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
  products: SupplierOption[];
  action: (formData: FormData) => void | Promise<void>;
};

type InvoiceItem = {
  productId?: number | null;
  productName: string;
  quantity: number;
  unitCost: number;
};

export function SupplierInvoiceModal({ suppliers, products, action }: SupplierInvoiceModalProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { productId: null, productName: "", quantity: 1, unitCost: 0 }
  ]);

  const updateItem = (index: number, patch: Partial<InvoiceItem>) => {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { productId: null, productName: "", quantity: 1, unitCost: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, i) => i !== index));
  };

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
              className="mt-4 space-y-4"
              onSubmit={() => setOpen(false)}
            >
              <input type="hidden" name="items" value={JSON.stringify(items)} />
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

              <div className="grid gap-3 md:grid-cols-2">
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
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">
                    פריטי חשבונית
                  </h4>
                  <Button type="button" variant="outline" onClick={addItem}>
                    הוספה חדשה
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {items.map((item, index) => (
                    <div key={`item-${index}`} className="grid gap-3 md:grid-cols-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          מוצר
                        </label>
                        <div className="flex gap-2">
                          <select
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm"
                            value={item.productId ?? ""}
                            onChange={(event) => {
                              const value = event.target.value;
                              const selected = products.find(
                                (product) => product.id === Number(value)
                              );
                              updateItem(index, {
                                productId: value ? Number(value) : null,
                                productName: selected?.name ?? item.productName
                              });
                            }}
                          >
                            <option value="">בחר מוצר</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm"
                            placeholder="שם מוצר"
                            value={item.productName}
                            onChange={(event) =>
                              updateItem(index, { productName: event.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          כמות
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm"
                          value={item.quantity}
                          onChange={(event) =>
                            updateItem(index, { quantity: Number(event.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          עלות יחידה
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm"
                            value={item.unitCost}
                            onChange={(event) =>
                              updateItem(index, { unitCost: Number(event.target.value) })
                            }
                          />
                          {items.length > 1 && (
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-100"
                              onClick={() => removeItem(index)}
                            >
                              הסר
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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

