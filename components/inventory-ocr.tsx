"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">
            אימות פריטים לפני הוספה
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex justify-between">
                <span>{item.name}</span>
                <span>
                  {item.quantity} יח׳{item.price ? ` · ₪${item.price}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button type="button" onClick={handleConfirm} disabled={isPending}>
              אשר והוסף למלאי
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

