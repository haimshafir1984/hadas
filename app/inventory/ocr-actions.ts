"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export type InvoiceItem = {
  name: string;
  quantity: number;
  price?: number | null;
};

type OcrResult = {
  items: InvoiceItem[];
  error?: string;
};

const ocrPrompt = `
חלץ מהחשבונית רשימת מוצרים בפורמט JSON בלבד.
החזר מערך של אובייקטים במבנה:
[{ "name": "שם מוצר", "quantity": 1, "price": 9.9 }]
אם אין מידע, החזר מערך ריק.
`;

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return "[]";
  return text.slice(start, end + 1);
}

export async function extractInvoiceItems(formData: FormData): Promise<OcrResult> {
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { items: [], error: "לא נבחר קובץ." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { items: [], error: "מפתח Claude חסר בשרת." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const anthropic = new Anthropic({ apiKey });
  const supportedMediaTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
  ] as const;
  const mediaType = supportedMediaTypes.includes(file.type as (typeof supportedMediaTypes)[number])
    ? (file.type as (typeof supportedMediaTypes)[number])
    : "image/png";

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64
            }
          },
          {
            type: "text",
            text: ocrPrompt
          }
        ]
      }
    ]
  });

  const contentBlock = response.content[0];
  const content = contentBlock?.type === "text" ? contentBlock.text : "[]";
  const json = extractJsonArray(content);

  try {
    const items = JSON.parse(json) as InvoiceItem[];
    return {
      items: items
        .filter((item) => item?.name && Number(item.quantity) > 0)
        .map((item) => ({
          name: String(item.name).trim(),
          quantity: Number(item.quantity),
          price: item.price ? Number(item.price) : null
        }))
    };
  } catch {
    return { items: [], error: "לא הצלחתי לקרוא את הנתונים מהחשבונית." };
  }
}

export async function applyInvoiceItems(formData: FormData) {
  const raw = String(formData.get("items") || "[]");
  const parsed = JSON.parse(raw) as InvoiceItem[];

  const items = parsed.filter((item) => item.name && Number(item.quantity) > 0);
  if (items.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const name = item.name.trim();
      const quantity = Math.floor(Number(item.quantity));
      if (!name || quantity <= 0) continue;

      let product = await tx.product.findFirst({ where: { name } });
      if (!product) {
        const sku = `OCR-${Date.now()}-${index}`;
        const maxStock = Math.max(quantity * 5, 10);
        product = await tx.product.create({
          data: {
            name,
            sku,
            department: "לא משויך",
            model: "לא משויך",
            size: "כללי",
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
            }
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

