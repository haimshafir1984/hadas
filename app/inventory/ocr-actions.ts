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

// ✅ מודל עדכני (הישן retired ב-2025-10-28)
const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-5-20250929";

// מגבלת גודל נפוצה לתמונות (בעיקר בפלטפורמות צד ג׳ זה 5MB)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ocrPrompt = `
חלץ מהחשבונית רשימת מוצרים בפורמט JSON בלבד.
החזר מערך של אובייקטים במבנה:
[{ "name": "שם מוצר", "quantity": 1, "price": 9.9 }]
אם אין מידע, החזר מערך ריק.
`;

// מנסה “לחתוך” את מערך ה-JSON מתוך טקסט לא נקי
function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return "[]";
  return text.slice(start, end + 1);
}

export async function extractInvoiceItems(formData: FormData): Promise<OcrResult> {
  try {
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { items: [], error: "לא נבחר קובץ." };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { items: [], error: "מפתח Claude חסר בשרת (ANTHROPIC_API_KEY)." };
    }

    // תומך בתמונה בלבד (הקומפוננטה של ההעלאה שולחת קובץ יחיד)
    const supportedMediaTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp"
    ] as const;

    if (!file.type?.startsWith("image/")) {
      return {
        items: [],
        error:
          "פורמט קובץ לא נתמך. העלה תמונה של חשבונית (JPG/PNG/WebP/GIF)."
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return {
        items: [],
        error:
          "התמונה גדולה מדי. נסה לצלם/לשמור באיכות נמוכה יותר (עד ~5MB) או להעלות JPG."
      };
    }

    const mediaType = supportedMediaTypes.includes(
      file.type as (typeof supportedMediaTypes)[number]
    )
      ? (file.type as (typeof supportedMediaTypes)[number])
      : "image/png";

    const base64 = buffer.toString("base64");

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      // מחזק “JSON בלבד”
      system:
        "Return ONLY a valid JSON array. No markdown, no explanations, no extra text.",
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

    // לוקחים את בלוק הטקסט הראשון (אם יש כמה)
    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock?.type === "text" ? textBlock.text : "[]";

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
  } catch (err: any) {
    // הופך קריסת שרת לשגיאה ידידותית ב-UI
    const msg = String(err?.message || err || "");

    if (msg.toLowerCase().includes("model")) {
      return {
        items: [],
        error:
          "נראה שהמודל של Claude לא זמין/לא מורשה. ודא שהמודל מוגדר נכון ושיש הרשאות."
      };
    }

    return {
      items: [],
      error: "שגיאה בקריאה ל-Claude. בדוק מפתח API/מגבלות/רשת ונסה שוב."
    };
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
