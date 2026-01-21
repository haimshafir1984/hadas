"use client";

import { Cake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type BirthdayGreetingButtonProps = {
  names: string[];
  storeName?: string;
};

export function BirthdayGreetingButton({
  names,
  storeName = "החנות שלנו"
}: BirthdayGreetingButtonProps) {
  const handleSend = () => {
    if (names.length === 0) {
      toast.error("אין היום ימי הולדת לשליחה.");
      return;
    }

    const message = `מזל טוב מ-${storeName}! מחכה לך הטבה מיוחדת בחנות`;
    console.log("ברכת יום הולדת:", { names, message });
    toast.success("הברכות נשלחו (סימולציה).");
  };

  return (
    <Button type="button" onClick={handleSend} disabled={names.length === 0}>
      <Cake size={16} className="mr-2" />
      שלח ברכת יום הולדת
    </Button>
  );
}

