"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const birthDateInput = String(formData.get("birthDate") || "").trim();
  const totalSpendInput = String(formData.get("totalSpend") || "").trim();
  const lastVisitInput = String(formData.get("lastVisit") || "").trim();

  if (!name || !phone || !email) {
    throw new Error("Invalid customer input");
  }

  const birthDate = birthDateInput ? new Date(birthDateInput) : null;
  const normalizedBirthDate =
    birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null;
  const totalSpend = Number(totalSpendInput);
  const normalizedTotalSpend = Number.isFinite(totalSpend) ? totalSpend : 0;
  const lastVisit = lastVisitInput ? new Date(lastVisitInput) : null;
  const normalizedLastVisit =
    lastVisit && !Number.isNaN(lastVisit.getTime()) ? lastVisit : null;

  await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      totalSpend: normalizedTotalSpend,
      lastVisit: normalizedLastVisit,
      birthDate: normalizedBirthDate
    }
  });

  revalidatePath("/customers");
}

