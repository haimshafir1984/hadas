"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const birthDateInput = String(formData.get("birthDate") || "").trim();

  if (!name || !phone || !email) {
    throw new Error("Invalid customer input");
  }

  const birthDate = birthDateInput ? new Date(birthDateInput) : null;
  const normalizedBirthDate =
    birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null;

  await prisma.customer.create({
    data: {
      name,
      phone,
      email,
      birthDate: normalizedBirthDate
    }
  });

  revalidatePath("/customers");
}

