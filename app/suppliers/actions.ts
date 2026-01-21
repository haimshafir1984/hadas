"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function toNumber(value: FormDataEntryValue | null) {
  if (value === null) return NaN;
  return Number(value);
}

function toDate(value: FormDataEntryValue | null) {
  if (!value) return new Date();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function addMonths(date: Date, months: number) {
  const base = new Date(date);
  const day = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + months);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(day, lastDay));
  return base;
}

export async function createSupplier(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const contactPerson = String(formData.get("contactPerson") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!name || !contactPerson || !phone) {
    throw new Error("Invalid supplier input");
  }

  await prisma.supplier.create({
    data: {
      name,
      contactPerson,
      phone
    }
  });

  revalidatePath("/suppliers");
  revalidatePath("/inventory");
}

export async function logSupplierInvoice(formData: FormData) {
  const supplierId = toNumber(formData.get("supplierId"));
  const invoiceDate = toDate(formData.get("invoiceDate"));
  const totalAmount = toNumber(formData.get("totalAmount"));
  const numberOfPayments = Math.floor(toNumber(formData.get("numberOfPayments")));

  if (!Number.isFinite(supplierId) || supplierId <= 0) {
    throw new Error("Invalid supplier");
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Invalid amount");
  }
  if (!Number.isFinite(numberOfPayments) || numberOfPayments <= 0) {
    throw new Error("Invalid payments");
  }

  const paymentDates = Array.from({ length: numberOfPayments }, (_, index) =>
    addMonths(invoiceDate, index + 1).toISOString()
  );

  const file = formData.get("invoiceImage");
  let invoiceImage: string | null = null;
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    invoiceImage = `data:${file.type};base64,${base64}`;
  }

  await prisma.supplierInvoice.create({
    data: {
      supplierId,
      invoiceDate,
      totalAmount,
      numberOfPayments,
      paymentDates: JSON.stringify(paymentDates),
      invoiceImage
    }
  });

  revalidatePath("/suppliers");
}

