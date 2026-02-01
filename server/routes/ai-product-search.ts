import { Router, Request, Response } from "express";
import express from "express";
import OpenAI from "openai";
import { HERITAGE_PRODUCTS } from "../../client/lib/heritageProducts";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

async function getLearnedMappings(query: string, userId?: string): Promise<string[]> {
  try {
    // Prioritize user-specific mappings, then fall back to global
    const result = await db.execute(sql`
      SELECT mapped_product_sku, success_count, total_count
      FROM ai_query_mappings
      WHERE query_term ILIKE ${'%' + query + '%'}
        AND (success_count::float / NULLIF(total_count::float, 0)) > 0.5
        AND (user_id = ${userId || null} OR user_id IS NULL)
      ORDER BY 
        CASE WHEN user_id = ${userId || null} THEN 0 ELSE 1 END,
        success_count DESC
      LIMIT 5
    `);
    return result.rows.map((r: any) => r.mapped_product_sku);
  } catch (error) {
    console.error("Error fetching learned mappings:", error);
    return [];
  }
}

async function getRelatedProducts(productSkus: string[], userId?: string, propertyType?: string): Promise<Array<{ sku: string; count: number }>> {
  try {
    if (productSkus.length === 0) return [];
    
    const skuList = productSkus.map(s => `'${s}'`).join(',');
    // Prioritize user-specific patterns
    const result = await db.execute(sql`
      SELECT related_product_sku as sku, SUM(co_occurrence_count) as count
      FROM ai_product_patterns
      WHERE primary_product_sku IN (${sql.raw(skuList)})
        AND (user_id = ${userId || null} OR user_id IS NULL)
      GROUP BY related_product_sku
      ORDER BY count DESC
      LIMIT 3
    `);
    return result.rows.map((r: any) => ({ sku: r.sku, count: Number(r.count) }));
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

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
  imageUrl?: string;
  description?: string;
  webInfo?: string;
}

router.post("/", express.json(), async (req: Request, res: Response) => {
  try {
    const { description, query, generateDescription, userId } = req.body;
    const searchText = description || query;

    if (generateDescription && searchText) {
      const descResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are writing a quote description for a commercial pool repair estimate. Your audience is HOA board members and property managers who have NO technical pool knowledge.

RULES:
1. Start with a friendly greeting: "Dear Property Manager," or "To the Board,"
2. Write in plain, simple language - avoid technical jargon
3. For EACH item in the estimate, provide:
   - What the part does in everyday terms
   - Why it needs to be replaced (safety, efficiency, code compliance)
   - What benefit they'll see after the repair
4. Keep sentences short and easy to understand
5. End with a reassuring statement about the work quality

EXAMPLE for a "Tube Bundle":
"The tube bundle is the part inside your pool heater that actually heats the water - think of it like the heating element in a water heater. When it fails, your pool can't maintain temperature. We'll install a new one so your guests can enjoy warm water again."

EXAMPLE for a "Refractory Kit":
"The refractory kit contains special heat-resistant blocks that protect the inside of your heater from the flame. Over time, these wear out and need replacing to keep the heater running safely and efficiently."

Write 3-5 paragraphs that explain the complete scope of work in terms a non-technical person would understand.` 
          },
          { role: "user", content: searchText },
        ],
        temperature: 0.7,
        max_tokens: 800,
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

    // Get user-specific learned mappings, with fallback to global mappings
    const learnedMappings = await getLearnedMappings(searchText, userId);
    const learnedContext = learnedMappings.length > 0
      ? `\n\nPREVIOUSLY SUCCESSFUL PRODUCTS for similar queries${userId ? ' by this user' : ''} (prioritize these): ${learnedMappings.join(', ')}`
      : '';

    const systemPrompt = `You are a commercial pool equipment expert assistant. Your job is to match customer descriptions of needed parts or equipment to products in our catalog.

Given a description of what the customer needs, find the most relevant products from our catalog. Consider:
- The type of equipment mentioned (pumps, filters, heaters, chemicals, etc.)
- Brand preferences if mentioned
- Specifications like horsepower, size, or model numbers
- Common pool industry terminology
- Historical data showing which products were previously selected for similar queries

Return a JSON array of matched products with confidence scores (0-100) and brief reasons why each product matches.

IMPORTANT: Only return products that genuinely match the description. If nothing matches well, return an empty array.
Prioritize products that have been successfully used for similar queries in the past.
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
          content: `Customer description: "${searchText}"${learnedContext}

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
          imageUrl: product.imageUrl,
          description: product.description,
        });
      }
    }

    // Get frequently paired products based on learned patterns (user-specific first)
    const matchedSkus = matches.map(m => m.sku);
    const relatedProducts = await getRelatedProducts(matchedSkus, userId);
    const suggestions: ProductMatch[] = [];
    
    for (const related of relatedProducts) {
      if (!matchedSkus.includes(related.sku)) {
        const product = HERITAGE_PRODUCTS.find(p => p.sku === related.sku);
        if (product) {
          suggestions.push({
            sku: product.sku,
            name: product.name,
            category: product.category,
            subcategory: product.subcategory,
            manufacturer: product.manufacturer,
            price: product.price,
            unit: product.unit,
            confidence: Math.min(90, 50 + related.count * 5),
            reason: `Frequently used together (${related.count} times)`,
            imageUrl: product.imageUrl,
            description: product.description,
          });
        }
      }
    }

    res.json({ 
      matches, 
      suggestions,
      learnedFromHistory: learnedMappings.length > 0,
    });
  } catch (error) {
    console.error("AI product search error:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

router.post("/web-info", express.json(), async (req: Request, res: Response) => {
  try {
    const { productName, manufacturer, partNumber } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "Product name is required" });
    }

    const searchQuery = `${manufacturer || ''} ${productName} ${partNumber || ''} pool equipment specifications`.trim();

    const systemPrompt = `You are a commercial pool equipment expert with deep knowledge of products from major distributors including SOS Pool (sospool.com), Heritage Pool Supply, and other industry suppliers.

Given a product query, provide helpful information including:
1. A brief description of what the product is and what it does
2. Key specifications (dimensions, BTU ratings, compatibility, etc.)
3. Common applications in commercial pool settings
4. Installation tips or compatibility notes
5. Related parts that may be needed (gaskets, O-rings, etc.)

Reference trusted sources like SOS Pool, Pentair, Hayward, Raypak, and Jandy official specs when applicable.

Keep your response concise (3-4 sentences) and professional. Focus on practical information that would help a field technician make informed decisions.

If this is a heater part (tube bundle, refractory, heat exchanger), mention any model-specific compatibility requirements.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Product: ${searchQuery}` },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const webInfo = response.choices[0]?.message?.content?.trim() || "";

    res.json({ 
      webInfo,
      searchQuery,
    });
  } catch (error) {
    console.error("Web info search error:", error);
    res.status(500).json({ error: "Failed to fetch web info" });
  }
});

export default router;
