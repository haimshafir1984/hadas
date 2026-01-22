"use server";

import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export type ExcelItem = {
  name: string;
  sku: string;
  quantity: number;
  price?: number | null;
  maxStock?: number | null;
  department?: string | null;
  model?: string | null;
  size?: string | null;
  barcode?: string | null;
};

type ExcelResult = {
  items: ExcelItem[];
  error?: string;
};

const headerMap: Record<string, keyof ExcelItem> = {
  name: "name",
  "שם": "name",
  "שם מוצר": "name",
  "דגם": "name",
  sku: "sku",
  "מק״ט": "sku",
  "מק\"ט": "sku",
  quantity: "quantity",
  "כמות": "quantity",
  price: "price",
  "מחיר": "price",
  "מחיר יחידה": "price",
  maxstock: "maxStock",
  "מלאי מקסימלי": "maxStock",
  department: "department",
  "מחלקה": "department",
  model: "model",
  "דגם": "model",
  size: "size",
  "מידה": "size",
  barcode: "barcode",
  "ברקוד": "barcode"
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return NaN;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

export async function extractExcelItems(formData: FormData): Promise<ExcelResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { items: [], error: "לא נבחר קובץ." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { items: [], error: "לא נמצאה טבלה בקובץ." };
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: ""
    });

    const items = rows
      .map((row) => {
        const normalized: Partial<Record<keyof ExcelItem, string>> = {};
        Object.entries(row).forEach(([key, value]) => {
          const mapped = headerMap[normalizeHeader(key)];
          if (!mapped) return;
          normalized[mapped] = String(value).trim();
        });

        const quantity = toNumber(normalized.quantity);
        const maxStock = toNumber(normalized.maxStock);
        const price = toNumber(normalized.price);

        return {
          name: String(normalized.name || "").trim(),
          sku: String(normalized.sku || "").trim(),
          quantity: Number.isFinite(quantity) ? Number(quantity) : 0,
          price: Number.isFinite(price) ? Number(price) : null,
          maxStock: Number.isFinite(maxStock) ? Number(maxStock) : null,
          department: normalized.department ? String(normalized.department).trim() : null,
          model: normalized.model ? String(normalized.model).trim() : null,
          size: normalized.size ? String(normalized.size).trim() : null,
          barcode: normalized.barcode ? String(normalized.barcode).trim() : null
        };
      })
      .filter((item) => (item.name || item.sku) && item.quantity > 0);

    return { items };
  } catch {
    return { items: [], error: "שגיאה בקריאת קובץ האקסל." };
  }
}

export async function applyExcelItems(formData: FormData) {
  const raw = String(formData.get("items") || "[]");
  const parsed = JSON.parse(raw) as ExcelItem[];
  const items = parsed.filter((item) => (item.name || item.sku) && item.quantity > 0);
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const quantity = Math.floor(item.quantity);
      if (quantity <= 0) continue;

      let product = null;
      if (item.sku) {
        product = await tx.product.findUnique({ where: { sku: item.sku } });
      }
      if (!product && item.name) {
        product = await tx.product.findFirst({ where: { name: item.name } });
      }

      if (!product) {
        const sku = item.sku || `EXCEL-${Date.now()}-${index}`;
        const maxStock = item.maxStock && item.maxStock > 0 ? item.maxStock : Math.max(quantity * 5, 10);
        product = await tx.product.create({
          data: {
            name: item.name || sku,
            sku,
            department: item.department || "לא משויך",
            model: item.model || "לא משויך",
            size: item.size || "כללי",
            barcode: item.barcode || null,
            maxStock,
            currentStock: quantity
          }
        });
      } else {
        await tx.product.update({
          where: { id: product.id },
          data: {
            currentStock: {
              increment: quantity
            },
            maxStock: item.maxStock && item.maxStock > 0 ? item.maxStock : product.maxStock,
            department: item.department || product.department,
            model: item.model || product.model,
            size: item.size || product.size,
            barcode: item.barcode || product.barcode
          }
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          productId: product.id,
          quantity,
          type: "IN"
        }
      });
    }
  });

  revalidatePath("/inventory");
}

