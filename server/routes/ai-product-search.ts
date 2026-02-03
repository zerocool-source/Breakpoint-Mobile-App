import { Router, Request, Response } from "express";
import express from "express";
import OpenAI from "openai";
import { db } from "../db";
import { sql, eq } from "drizzle-orm";
import { poolRegulations, estimateTemplates } from "../../shared/schema";
import { getProducts, mapPoolBrainToHeritageFormat } from "../services/poolbrain";

// Get estimate templates for AI reference
async function getEstimateTemplates(category?: string): Promise<any[]> {
  try {
    if (category) {
      return await db.query.estimateTemplates.findMany({
        where: eq(estimateTemplates.category, category),
      });
    }
    return await db.query.estimateTemplates.findMany({
      where: eq(estimateTemplates.isActive, true),
    });
  } catch (error) {
    console.error("Error fetching estimate templates:", error);
    return [];
  }
}

let cachedPoolBrainProducts: any[] = [];
let lastPoolBrainFetch = 0;
let poolBrainAvailable = false;
let lastApiError = '';
const POOL_BRAIN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function getProductCatalog(): Promise<{ products: any[], available: boolean, error?: string }> {
  try {
    const now = Date.now();
    if (cachedPoolBrainProducts.length === 0 || now - lastPoolBrainFetch > POOL_BRAIN_CACHE_TTL) {
      console.log('[AI Search] Fetching fresh products from Pool Brain...');
      const rawProducts = await getProducts();
      if (rawProducts.length > 0) {
        cachedPoolBrainProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
        lastPoolBrainFetch = now;
        poolBrainAvailable = true;
        lastApiError = '';
        console.log(`[AI Search] Using ${cachedPoolBrainProducts.length} Pool Brain products`);
        return { products: cachedPoolBrainProducts, available: true };
      } else {
        poolBrainAvailable = false;
        lastApiError = 'Pool Brain API returned no products';
        return { products: [], available: false, error: lastApiError };
      }
    } else if (cachedPoolBrainProducts.length > 0) {
      return { products: cachedPoolBrainProducts, available: true };
    }
  } catch (error: any) {
    console.error('[AI Search] Pool Brain fetch failed:', error?.message || error);
    poolBrainAvailable = false;
    lastApiError = error?.message || 'Pool Brain API connection failed';
  }
  return { products: [], available: false, error: lastApiError };
}

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
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

interface PoolRegulation {
  id: string | number;
  codeSection: string;
  title: string;
  category: string;
  summary: string;
  fullText: string | null;
  hoaFriendlyExplanation: string | null;
  relatedProducts: string | string[] | null;
  sourceDocument: string | null;
}

async function getRelevantPoolRegulations(productCategories: string[]): Promise<PoolRegulation[]> {
  try {
    if (productCategories.length === 0) return [];
    
    // Map product categories to regulation categories
    const categoryMappings: Record<string, string[]> = {
      'Pumps': ['pumps', 'anti-entrapment', 'maintenance'],
      'Filters': ['filters', 'water-quality', 'maintenance'],
      'Heaters': ['maintenance', 'safety'],
      'Automation': ['maintenance', 'safety'],
      'Valves': ['plumbing', 'safety'],
      'Chemicals': ['disinfection', 'water-quality'],
      'Cleaners': ['maintenance', 'water-quality'],
      'Lighting': ['lighting', 'electrical-safety'],
      'Safety': ['safety', 'anti-entrapment', 'enclosure', 'signage'],
      'Plumbing': ['plumbing', 'turnover', 'pumps'],
      'Motors': ['pumps', 'electrical-safety'],
      'Parts': ['maintenance'],
    };
    
    const regulationCategories = new Set<string>();
    for (const category of productCategories) {
      const mappedCategories = categoryMappings[category] || ['maintenance'];
      mappedCategories.forEach(c => regulationCategories.add(c));
    }
    
    const result = await db.query.poolRegulations.findMany({
      where: sql`category = ANY(${Array.from(regulationCategories)})`,
      limit: 5,
    });
    
    return result as PoolRegulation[];
  } catch (error) {
    console.error("Error fetching pool regulations:", error);
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
    const { description, query, generateDescription, userId, languageStyle, productCategories } = req.body;
    const searchText = description || query;

    if (generateDescription && searchText) {
      // Fetch relevant pool regulations for HOA-friendly descriptions
      let poolCodeContext = '';
      if (languageStyle === 'hoa-friendly' && productCategories && productCategories.length > 0) {
        const regulations = await getRelevantPoolRegulations(productCategories);
        if (regulations.length > 0) {
          poolCodeContext = `\n\nCALIFORNIA POOL CODE REFERENCES (use these to explain WHY repairs are legally required):\n${regulations.map(r => 
            `- ${r.codeSection}: ${r.title}\n  Summary: ${r.summary}\n  HOA Explanation: ${r.hoaFriendlyExplanation || 'Maintains pool safety and compliance.'}`
          ).join('\n\n')}`;
        }
      }

      const isHoaFriendly = languageStyle !== 'professional';
      
      const systemPrompt = isHoaFriendly 
        ? `You are writing a quote description for a commercial pool repair estimate. Your audience is HOA board members and property managers who have NO technical pool knowledge.

RULES:
1. Start with a friendly greeting: "Dear Property Manager," or "To the Board,"
2. Write in plain, simple language - avoid technical jargon
3. For EACH item in the estimate, provide:
   - What the part does in everyday terms
   - Why it needs to be replaced (safety, efficiency, code compliance)
   - What benefit they'll see after the repair
4. When applicable, REFERENCE California pool codes to explain legal requirements
   - Cite specific code sections (e.g., "California Health & Safety Code Section 116064.2")
   - Explain what the law requires and potential consequences of non-compliance
   - Help them understand this isn't just a recommendation, but a legal requirement
5. Keep sentences short and easy to understand
6. End with a reassuring statement about the work quality and compliance
${poolCodeContext}

EXAMPLE for a pump replacement:
"The circulation pump is the heart of your pool system - it moves water through the filtration system to keep the pool clean and safe. California Health & Safety Code Section 65525 requires commercial pools to maintain proper water circulation at all times. When the pump fails, water quality degrades quickly, which can lead to pool closure orders from the health department. This replacement ensures your pool stays in compliance and your guests stay safe."

EXAMPLE for an anti-entrapment drain cover:
"Per California Health & Safety Code Section 116064.2 (Virginia Graeme Baker Pool and Spa Safety Act), all commercial pools must have compliant drain covers to prevent entrapment hazards. The current cover no longer meets code requirements and must be replaced to avoid potential liability and mandatory pool closure."

Write 3-5 paragraphs that explain the complete scope of work in terms a non-technical person would understand, with California pool code references where applicable.`
        : `You are writing a professional quote description for a commercial pool repair estimate. Your audience is facility managers and pool service professionals.

RULES:
1. Use industry-standard terminology
2. Include relevant technical specifications
3. Reference applicable codes and standards
4. Maintain a formal, business tone
5. Be concise and precise

Write 2-4 paragraphs that clearly communicate the scope of work with technical accuracy.`;

      const descResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: searchText },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      const generatedDescription = descResponse.choices[0]?.message?.content?.trim() || "";
      return res.json({ description: generatedDescription });
    }

    if (!searchText || typeof searchText !== "string") {
      return res.status(400).json({ error: "Description is required" });
    }

    const catalogResult = await getProductCatalog();
    
    // If product catalog is unavailable, return service unavailable
    if (!catalogResult.available || catalogResult.products.length === 0) {
      return res.status(503).json({ 
        error: "Product catalog service temporarily unavailable",
        message: catalogResult.error || "Unable to connect to product database. Please try again later.",
        serviceAvailable: false,
        matches: [],
      });
    }
    
    const products = catalogResult.products;
    const productList = products.map((p: any) => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      manufacturer: p.manufacturer || '',
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
      const product = products.find((p: any) => p.sku === match.sku);
      if (product) {
        matches.push({
          sku: product.sku,
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          manufacturer: product.manufacturer || '',
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
        const product = products.find((p: any) => p.sku === related.sku);
        if (product) {
          suggestions.push({
            sku: product.sku,
            name: product.name,
            category: product.category,
            subcategory: product.subcategory,
            manufacturer: product.manufacturer || '',
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

// Get estimate templates for AI to learn from
router.get("/templates", async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const templates = await getEstimateTemplates(category as string);
    res.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Generate estimate with AI using templates as reference
router.post("/generate-estimate", express.json(), async (req: Request, res: Response) => {
  try {
    const { workDescription, propertyName, category } = req.body;

    if (!workDescription) {
      return res.status(400).json({ error: "Work description is required" });
    }

    // Get relevant templates for reference
    const templates = await getEstimateTemplates(category || 'equipment_room');
    const templateContext = templates.length > 0 ? templates[0] : null;

    // Build the AI prompt with template reference
    const systemPrompt = `You are an expert commercial pool repair estimator for Breakpoint Commercial Pool Systems. You create professional estimates that follow exact company standards.

${templateContext ? `REFERENCE TEMPLATE FORMAT:
Opening paragraph style:
"${templateContext.introText}"

Line item format - organize by SECTION (SPA, POOL, WADER, etc.) with items like:
${templateContext.lineItemsJson}

Closing terms:
"${templateContext.termsText}"

Labor rate: $${templateContext.laborRate}/hour
` : ''}

RULES:
1. ONLY use real products from known manufacturers: Pentair, Hayward, Jandy, Raypak, Century, Zodiac
2. Include accurate part descriptions with size/specs (e.g., "PVC 2\" 90 Slip SCH 40", "Motor 2 hp 1 ph VS Century")
3. Use realistic current market prices - research actual costs
4. Group items by system/area (SPA, POOL, WADER, etc.)
5. Include all necessary fittings, pipes, gaskets, and accessories
6. Reference California codes: CA Title 22, Title 24, NEC Article 680, VGB standards
7. For heaters: include vent kit, gas fittings, sediment trap
8. For filters: include sand bags, multiport valve, unions
9. For motors: include seal kit/go kit, hi-temp unions
10. Calculate realistic labor hours based on scope

Return a JSON object with:
{
  "introText": "Professional opening paragraph...",
  "sections": [
    {
      "name": "SPA",
      "laborHours": 40,
      "items": [
        {"description": "Part name with specs", "qty": 1, "rate": 123.99, "taxable": true}
      ]
    }
  ],
  "totalLaborHours": 168,
  "laborRate": 150.00,
  "termsText": "Closing terms...",
  "notes": "Any additional notes"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a detailed estimate for:
Property: ${propertyName || 'Commercial Property'}
Work Description: ${workDescription}

Provide accurate real-world pricing and complete parts lists.` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "No response from AI" });
    }

    const estimateData = JSON.parse(content);
    res.json({ estimate: estimateData, templateUsed: templateContext?.name || null });
  } catch (error) {
    console.error("Estimate generation error:", error);
    res.status(500).json({ error: "Failed to generate estimate" });
  }
});

// Web search for real product information
router.post("/web-search", express.json(), async (req: Request, res: Response) => {
  try {
    const { query, searchType } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Use GPT-4 with web browsing capability for real data
    const searchPrompt = searchType === 'pricing' 
      ? `Search for current 2024-2025 pricing on commercial pool equipment: ${query}. Include manufacturer, model, and typical distributor pricing. Only provide verified real prices from actual suppliers like SOS Pool, Pool Corp, Heritage Pool Supply, or manufacturer websites.`
      : `Search for technical specifications and installation requirements for: ${query}. Include model numbers, dimensions, compatibility requirements, and installation notes from manufacturer documentation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are a commercial pool equipment specialist with access to current market data. Provide accurate, real-world information only. Do not make up prices or specifications. If you don't know something specific, say so rather than guessing. Reference known suppliers: SOS Pool (sospool.com), Heritage Pool Supply, Pool Corp (poolcorp.com), Pentair, Hayward, Raypak, Jandy.` 
        },
        { role: "user", content: searchPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    const result = response.choices[0]?.message?.content?.trim() || "";
    res.json({ result, query });
  } catch (error) {
    console.error("Web search error:", error);
    res.status(500).json({ error: "Failed to perform web search" });
  }
});

export default router;
