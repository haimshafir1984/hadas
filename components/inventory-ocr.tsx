"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { extractInvoiceItems, applyInvoiceItems, InvoiceItem } from "@/app/inventory/ocr-actions";

export function InventoryOcrUpload() {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await extractInvoiceItems(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.items.length === 0) {
        toast.error("לא נמצאו פריטים בחשבונית.");
        return;
      }
      setItems(result.items);
    });
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("items", JSON.stringify(items));
      await applyInvoiceItems(formData);
      toast.success("הפריטים נוספו למלאי.");
      setItems([]);
    });
  };

  const handleCancel = () => {
    setItems([]);
  };

  const updateQuantity = (index: number, value: string) => {
    const qty = Math.max(1, Number(value || 0));
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="file"
            name="file"
            accept="image/*"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            required
          />
          <Button type="submit" disabled={isPending}>
            <Camera size={16} className="mr-2" />
            העלאת חשבונית
          </Button>
        </div>
      </form>

      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700">
            אימות פריטים לפני הוספה
          </h3>
          <div className="mt-3 overflow-x-auto">
            <Table>
              <thead className="border-b border-slate-200 text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4">מוצר</th>
                  <th className="py-2 pr-4">כמות</th>
                  <th className="py-2 pr-4">מחיר</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.name}-${index}`} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-4 font-medium text-slate-900">{item.name}</td>
                    <td className="py-2 pr-4">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(event) => updateQuantity(index, event.target.value)}
                        className="h-9 w-24 px-3"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      {item.price ? `₪${item.price}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              אשר והוסף למלאי
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              ביטול
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

