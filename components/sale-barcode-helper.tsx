"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SaleBarcodeHelperProps = {
  products: Array<{ id: number; name: string; barcode: string | null }>;
  productSelectId: string;
  quantityInputId: string;
  barcodeInputId: string;
};

export function SaleBarcodeHelper({
  products,
  productSelectId,
  quantityInputId,
  barcodeInputId
}: SaleBarcodeHelperProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");

  const applyBarcode = (barcode: string) => {
    if (!barcode) return;
    const matched = products.find((product) => product.barcode === barcode);
    if (!matched) {
      toast.error("ברקוד לא נמצא במערכת.");
      return;
    }

    const select = document.getElementById(productSelectId) as HTMLSelectElement | null;
    const qtyInput = document.getElementById(quantityInputId) as HTMLInputElement | null;
    if (select) {
      select.value = String(matched.id);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (qtyInput && !qtyInput.value) {
      qtyInput.value = "1";
      qtyInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    toast.success(`נבחר מוצר: ${matched.name}`);
  };

  const handleManualApply = () => {
    const current = inputRef.current?.value?.trim() ?? value.trim();
    applyBarcode(current);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          id={barcodeInputId}
          ref={inputRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="סרוק או הזן ברקוד"
        />
        <Button type="button" variant="outline" onClick={handleManualApply}>
          מצא מוצר
        </Button>
      </div>
      <BarcodeScanner onDetected={applyBarcode} />
    </div>
  );
}

