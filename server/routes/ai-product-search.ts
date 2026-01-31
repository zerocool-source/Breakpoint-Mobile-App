import { Router, Request, Response } from "express";
import express from "express";
import OpenAI from "openai";
import { HERITAGE_PRODUCTS } from "../../client/lib/heritageProducts";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface ProductMatch {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  price: number;
  unit: string;
  confidence: number;
  reason: string;
}

router.post("/", express.json(), async (req: Request, res: Response) => {
  try {
    const { description, query, generateDescription } = req.body;
    const searchText = description || query;

    if (generateDescription && searchText) {
      const descResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "You are a professional commercial pool service technician. Write clear, professional quote descriptions for repair estimates. Keep descriptions concise (2-3 sentences) and focus on the work being performed." 
          },
          { role: "user", content: searchText },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });
      const generatedDescription = descResponse.choices[0]?.message?.content?.trim() || "";
      return res.json({ description: generatedDescription });
    }

    if (!searchText || typeof searchText !== "string") {
      return res.status(400).json({ error: "Description is required" });
    }

    const productList = HERITAGE_PRODUCTS.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      manufacturer: p.manufacturer,
      price: p.price,
      unit: p.unit,
    }));

    const systemPrompt = `You are a commercial pool equipment expert assistant. Your job is to match customer descriptions of needed parts or equipment to products in our catalog.

Given a description of what the customer needs, find the most relevant products from our catalog. Consider:
- The type of equipment mentioned (pumps, filters, heaters, chemicals, etc.)
- Brand preferences if mentioned
- Specifications like horsepower, size, or model numbers
- Common pool industry terminology

Return a JSON array of matched products with confidence scores (0-100) and brief reasons why each product matches.

IMPORTANT: Only return products that genuinely match the description. If nothing matches well, return an empty array.
Return at most 5 products, ordered by relevance.

Response format:
{
  "matches": [
    {
      "sku": "product SKU",
      "confidence": 85,
      "reason": "Brief explanation of why this matches"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Customer description: "${searchText}"

Product catalog (${productList.length} products):
${JSON.stringify(productList, null, 2)}` 
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.json({ matches: [] });
    }

    const parsed = JSON.parse(content);
    const matches: ProductMatch[] = [];

    for (const match of parsed.matches || []) {
      const product = HERITAGE_PRODUCTS.find(p => p.sku === match.sku);
      if (product) {
        matches.push({
          sku: product.sku,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          manufacturer: product.manufacturer,
          price: product.price,
          unit: product.unit,
          confidence: match.confidence,
          reason: match.reason,
        });
      }
    }

    res.json({ matches });
  } catch (error) {
    console.error("AI product search error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

export default router;
