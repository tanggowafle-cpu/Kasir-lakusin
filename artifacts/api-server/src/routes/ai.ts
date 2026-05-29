import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

router.post("/ai/suggest-images", async (req, res) => {
  const { productName } = req.body as { productName?: string };
  if (!productName || typeof productName !== "string" || productName.trim().length === 0) {
    res.status(400).json({ error: "productName is required" });
    return;
  }

  try {
    const searchQuery = productName.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a product image search assistant for an Indonesian warung POS app. 
Given a product name, return 6 relevant image search queries in English that would find good product photos.
The queries should be specific, clean product photography style.
Return ONLY a JSON array of strings, nothing else. Example: ["indomie goreng noodles packet", "instant noodles goreng close up"]`,
        },
        {
          role: "user",
          content: `Product name: "${searchQuery}"`,
        },
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    let queries: string[] = [];
    try {
      queries = JSON.parse(raw);
    } catch {
      queries = [searchQuery];
    }

    const imageUrls = queries.slice(0, 6).map((q) => {
      const encoded = encodeURIComponent(q);
      return `https://source.unsplash.com/320x320/?${encoded}`;
    });

    res.json({ queries, imageUrls });
  } catch (err: unknown) {
    req.log.error({ err }, "AI suggest-images error");
    res.status(500).json({ error: "Gagal mendapatkan saran gambar" });
  }
});

export default router;
