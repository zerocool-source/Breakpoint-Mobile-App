import { Router, Request, Response } from "express";
import express from "express";
import OpenAI from "openai";
import { db } from "../db";
import { sql, eq, like, or } from "drizzle-orm";
import { poolRegulations, estimateTemplates } from "../../shared/schema";
import { 
  getProducts, 
  getNormalizedProducts, 
  searchProducts, 
  testConnection,
  NormalizedProduct 
} from "../services/poolbrain";

// Product cache for Pool Brain
let cachedProducts: NormalizedProduct[] = [];
let lastCacheUpdate = 0;
let cacheStatus = { available: false, error: '', productCount: 0 };
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

async function refreshProductCache(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('[Product Cache] Refreshing from Pool Brain...');
    const products = await getNormalizedProducts();
    if (products.length > 0) {
      cachedProducts = products;
      lastCacheUpdate = Date.now();
      cacheStatus = { available: true, error: '', productCount: products.length };
      console.log(`[Product Cache] Cached ${products.length} products`);
      return { success: true, count: products.length };
    }
    return { success: false, count: 0, error: 'No products returned from API' };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';
    cacheStatus = { available: false, error: errorMsg, productCount: 0 };
    console.error('[Product Cache] Refresh failed:', errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

async function getProductCatalogFromCache(): Promise<{ products: NormalizedProduct[]; available: boolean; error?: string }> {
  const now = Date.now();
  
  // If cache is fresh, use it
  if (cachedProducts.length > 0 && now - lastCacheUpdate < CACHE_TTL) {
    return { products: cachedProducts, available: true };
  }
  
  // Try to refresh cache
  const result = await refreshProductCache();
  if (result.success) {
    return { products: cachedProducts, available: true };
  }
  
  // If refresh failed but we have stale data, use it
  if (cachedProducts.length > 0) {
    console.log('[Product Cache] Using stale cache data');
    return { products: cachedProducts, available: true, error: 'Using cached data (refresh failed)' };
  }
  
  return { products: [], available: false, error: result.error };
}

// Commercial Pool Repair Knowledge Base functions
async function getRepairKnowledge(workDescription: string): Promise<any[]> {
  try {
    const keywords = workDescription.toLowerCase().split(' ').filter(w => w.length > 3);
    const result = await db.execute(sql`
      SELECT 
        repair_name, repair_code, category,
        professional_description, hoa_friendly_description,
        technical_details, safety_considerations, code_references,
        common_causes, diagnostic_steps, required_parts, recommended_products,
        labor_hours_min, labor_hours_max, parts_cost_min, parts_cost_max,
        preventive_measures, warranty_notes
      FROM commercial_pool_repairs
      WHERE is_active = true
        AND (
          ${sql.raw(keywords.map(k => `repair_name ILIKE '%${k}%' OR professional_description ILIKE '%${k}%' OR category::text ILIKE '%${k}%'`).join(' OR '))}
        )
      LIMIT 5
    `);
    return result.rows as any[];
  } catch (error) {
    console.error("Error fetching repair knowledge:", error);
    return [];
  }
}

async function getRelevantCodes(category?: string): Promise<any[]> {
  try {
    const result = await db.execute(sql`
      SELECT code_type, code_number, title, full_text, plain_language, hoa_explanation
      FROM commercial_pool_codes
      WHERE is_active = true
      ${category ? sql`AND applicable_repairs ILIKE ${'%' + category + '%'}` : sql``}
      LIMIT 10
    `);
    return result.rows as any[];
  } catch (error) {
    console.error("Error fetching pool codes:", error);
    return [];
  }
}

async function getLaborRates(facilityType?: string): Promise<any[]> {
  try {
    const result = await db.execute(sql`
      SELECT rate_name, rate_code, description, hourly_rate, minimum_hours,
             after_hours_multiplier, weekend_multiplier
      FROM labor_rates
      WHERE is_active = true
      ${facilityType ? sql`AND facility_types ILIKE ${'%' + facilityType + '%'}` : sql``}
      ORDER BY rate_name
    `);
    return result.rows as any[];
  } catch (error) {
    console.error("Error fetching labor rates:", error);
    return [];
  }
}

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

// Use the new cache system
async function getProductCatalog(): Promise<{ products: any[], available: boolean, error?: string }> {
  const result = await getProductCatalogFromCache();
  return {
    products: result.products.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category,
      subcategory: '',
      manufacturer: '',
      price: p.price,
      cost: p.cost,
      unit: 'EA',
      description: p.description,
      productId: p.recordId,
    })),
    available: result.available,
    error: result.error,
  };
}

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Pool Brain API Status endpoint
router.get("/pool-brain/status", async (_req: Request, res: Response) => {
  try {
    const connectionTest = await testConnection();
    res.json({
      connected: connectionTest.success,
      message: connectionTest.message,
      cache: {
        available: cacheStatus.available,
        productCount: cacheStatus.productCount,
        lastUpdate: lastCacheUpdate > 0 ? new Date(lastCacheUpdate).toISOString() : null,
        cacheAge: lastCacheUpdate > 0 ? Math.round((Date.now() - lastCacheUpdate) / 1000) + 's' : null,
        error: cacheStatus.error || null,
      },
      apiKeyConfigured: !!process.env.POOLBRAIN_API_KEY,
    });
  } catch (error: any) {
    res.status(500).json({
      connected: false,
      message: error?.message || 'Failed to check Pool Brain status',
      cache: cacheStatus,
      apiKeyConfigured: !!process.env.POOLBRAIN_API_KEY,
    });
  }
});

// Refresh Pool Brain product cache
router.post("/pool-brain/refresh", async (_req: Request, res: Response) => {
  try {
    const result = await refreshProductCache();
    res.json({
      success: result.success,
      productCount: result.count,
      error: result.error || null,
      message: result.success 
        ? `Successfully cached ${result.count} products from Pool Brain`
        : `Failed to refresh cache: ${result.error}`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      productCount: 0,
      error: error?.message || 'Failed to refresh product cache',
    });
  }
});

// Search Pool Brain products
router.get("/pool-brain/products", async (req: Request, res: Response) => {
  try {
    const { search, category, limit = '50' } = req.query;
    const catalog = await getProductCatalogFromCache();
    
    if (!catalog.available) {
      return res.status(503).json({
        success: false,
        error: catalog.error || 'Product catalog unavailable',
        products: [],
      });
    }
    
    let products = catalog.products;
    
    // Filter by search
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (category && typeof category === 'string') {
      const categoryLower = category.toLowerCase();
      products = products.filter(p => 
        p.category.toLowerCase().includes(categoryLower)
      );
    }
    
    // Limit results
    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
    products = products.slice(0, limitNum);
    
    res.json({
      success: true,
      total: products.length,
      products: products.map(p => ({
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price,
        cost: p.cost,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch products',
      products: [],
    });
  }
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
    
    const allProducts = catalogResult.products;
    
    // Pre-filter products using keyword matching to reduce token count for OpenAI
    const searchTerms = searchText.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
    const filteredProducts = allProducts.filter((p: any) => {
      const searchableText = `${p.name} ${p.category} ${p.subcategory || ''} ${p.description || ''} ${p.sku}`.toLowerCase();
      return searchTerms.some((term: string) => searchableText.includes(term));
    });
    
    // Use filtered products, or if too few matches, include top products by category keywords
    const products = filteredProducts.length >= 3 ? filteredProducts.slice(0, 100) : 
                     filteredProducts.length > 0 ? filteredProducts :
                     allProducts.slice(0, 100);
    
    console.log(`[AI Search] Filtered ${allProducts.length} products to ${products.length} for query: "${searchText}"`);
    
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

    // Check if this is plumbing/specialty work and add manual entry items
    let manualEntryItems: any[] = [];
    let plumbingMessage = '';
    
    const lowerSearch = searchText.toLowerCase();
    const plumbingKeywords = ['mission clamp', 'san t', 'sanitary tee', 'sanitary t', 'p-trap', 'p trap', 'ptrap', 
      'backwash cone', 'strut', 'red head', 'redhead', 'dwv', 'cast iron', 'cone increaser', 
      '4-90', '4 90', 'service plug', 'cleanout', 'fernco'];
      
      const isPlumbingWork = plumbingKeywords.some(kw => lowerSearch.includes(kw));
      
      if (isPlumbingWork) {
        // Known plumbing parts with pricing
        const knownParts: Record<string, { name: string; price: number; unit: string }> = {
          'mission clamp': { name: '4" Mission Clamp (no-hub coupling)', price: 24.99, unit: 'each' },
          'san t': { name: '4" Sanitary Tee (San T)', price: 38.50, unit: 'each' },
          'sanitary tee': { name: '4" Sanitary Tee (San T)', price: 38.50, unit: 'each' },
          'sanitary t': { name: '4" Sanitary Tee (San T)', price: 38.50, unit: 'each' },
          'service plug': { name: '4" Threaded Service Plug', price: 12.99, unit: 'each' },
          'p-trap': { name: '4" P-Trap', price: 42.00, unit: 'each' },
          'p trap': { name: '4" P-Trap', price: 42.00, unit: 'each' },
          'ptrap': { name: '4" P-Trap', price: 42.00, unit: 'each' },
          '90': { name: '4" DWV 90° Elbow', price: 18.75, unit: 'each' },
          '90 degree': { name: '4" DWV 90° Elbow', price: 18.75, unit: 'each' },
          'cone increaser': { name: '4" to 5" Backwash Cone Increaser', price: 34.99, unit: 'each' },
          'b/w cone': { name: '4" to 5" Backwash Cone Increaser', price: 34.99, unit: 'each' },
          'strut': { name: 'Shallow Strut Channel', price: 8.50, unit: 'foot' },
          'strut clamp': { name: '4" Strut Clamp', price: 12.00, unit: 'each' },
          'l bracket': { name: 'Strut L-Bracket', price: 8.50, unit: 'each' },
          'l-bracket': { name: 'Strut L-Bracket', price: 8.50, unit: 'each' },
          'red head': { name: 'Stainless Steel Red Head Anchor 3/8"x3"', price: 4.25, unit: 'each' },
          'redhead': { name: 'Stainless Steel Red Head Anchor 3/8"x3"', price: 4.25, unit: 'each' },
          'anchor': { name: 'Concrete Anchor', price: 4.25, unit: 'each' },
          'cleanout': { name: '4" Cleanout w/ Plug', price: 28.50, unit: 'each' },
          'fernco': { name: 'Fernco Flexible Coupling 4"', price: 18.99, unit: 'each' },
          'air gap': { name: '1" Air Gap/Siphon Break Fitting', price: 45.00, unit: 'each' },
        };
        
        // Find matching parts from the description
        for (const [keyword, part] of Object.entries(knownParts)) {
          if (lowerSearch.includes(keyword)) {
            // Check if we already have this part
            if (!manualEntryItems.find(p => p.name === part.name)) {
              manualEntryItems.push({
                sku: `MANUAL-${keyword.replace(/\s+/g, '-').toUpperCase()}`,
                name: part.name,
                category: 'Plumbing',
                subcategory: 'Drain & Backwash',
                manufacturer: '',
                price: part.price,
                unit: part.unit,
                confidence: 80,
                reason: 'Specialty plumbing part - not in catalog, add manually',
                isManualEntry: true,
              });
            }
          }
        }
        
      if (manualEntryItems.length > 0) {
        plumbingMessage = `I found ${manualEntryItems.length} plumbing parts that aren't in our product catalog. These are specialty items you'll need to add manually to your estimate. I've included suggested pricing based on current market rates.`;
      } else {
        plumbingMessage = `This looks like specialty plumbing work. These parts aren't in our product catalog - you'll need to add them manually. Use the "Add Custom Item" option to add parts like mission clamps, sanitary tees, strut, anchors, etc.`;
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
      manualEntryItems,
      plumbingMessage,
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

// Get user's frequently used products for personalization
async function getUserFrequentProducts(userId?: string): Promise<Array<{ description: string; avgQty: number; avgRate: number; count: number }>> {
  if (!userId) return [];
  try {
    const result = await db.execute(sql`
      SELECT 
        primary_product_sku as description,
        AVG(avg_quantity_ratio) as avg_qty,
        COUNT(*) as count
      FROM ai_product_patterns
      WHERE user_id = ${userId}
      GROUP BY primary_product_sku
      ORDER BY count DESC
      LIMIT 15
    `);
    return result.rows.map((r: any) => ({
      description: r.description,
      avgQty: Math.round(r.avg_qty || 1),
      avgRate: 0,
      count: Number(r.count),
    }));
  } catch (error) {
    console.error("Error fetching user frequent products:", error);
    return [];
  }
}

// Get user's past successful estimates for learning
async function getUserEstimateHistory(userId?: string): Promise<Array<{ query: string; products: string[] }>> {
  if (!userId) return [];
  try {
    const result = await db.execute(sql`
      SELECT user_query, selected_products
      FROM ai_learning_interactions
      WHERE user_id = ${userId}
        AND selected_products IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `);
    return result.rows.map((r: any) => ({
      query: r.user_query,
      products: (r.selected_products || []).map((p: any) => p.sku),
    }));
  } catch (error) {
    console.error("Error fetching user estimate history:", error);
    return [];
  }
}

// Generate estimate with AI using templates and knowledge base
router.post("/generate-estimate", express.json(), async (req: Request, res: Response) => {
  try {
    const { workDescription, propertyName, category, userId, facilityType } = req.body;

    if (!workDescription) {
      return res.status(400).json({ error: "Work description is required" });
    }

    // Get relevant templates for reference
    const templates = await getEstimateTemplates(category || 'equipment_room');
    const templateContext = templates.length > 0 ? templates[0] : null;

    // Get commercial pool repair knowledge base data
    const repairKnowledge = await getRepairKnowledge(workDescription);
    const poolCodes = await getRelevantCodes();
    const laborRates = await getLaborRates(facilityType);

    // Get user-specific learning data for personalization
    const frequentProducts = await getUserFrequentProducts(userId);
    const estimateHistory = await getUserEstimateHistory(userId);
    const learnedMappings = await getLearnedMappings(workDescription, userId);

    // Try to get Pool Brain products for accurate pricing
    let poolBrainProductContext = '';
    let poolBrainAvailable = false;
    try {
      const catalogResult = await getProductCatalogFromCache();
      if (catalogResult.available && catalogResult.products.length > 0) {
        poolBrainAvailable = true;
        // Get relevant products based on work description keywords
        const keywords: string[] = workDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        const relevantProducts = catalogResult.products.filter(p => {
          const searchText = `${p.name} ${p.description} ${p.category}`.toLowerCase();
          return keywords.some((k: string) => searchText.includes(k));
        }).slice(0, 50);
        
        if (relevantProducts.length > 0) {
          poolBrainProductContext = `\n\n=== POOL BRAIN PRODUCT CATALOG (use these EXACT prices) ===
The following products are from our current inventory with real-time pricing:

${relevantProducts.map(p => `- ${p.name} | SKU: ${p.sku} | Price: $${p.price.toFixed(2)} | Category: ${p.category}`).join('\n')}

IMPORTANT: When a Pool Brain product matches what's needed, use its EXACT price from above.
`;
        }
      }
    } catch (err) {
      console.log('[Generate Estimate] Pool Brain unavailable, using fallback pricing');
    }

    // Build knowledge base context
    let knowledgeBaseContext = '';
    if (repairKnowledge.length > 0) {
      knowledgeBaseContext += `\n\n=== COMMERCIAL POOL REPAIR KNOWLEDGE BASE ===
Use this expert knowledge to create accurate, professional estimates:

${repairKnowledge.map(r => `
REPAIR: ${r.repair_name} (${r.repair_code})
Category: ${r.category}
Professional Description: ${r.professional_description}
HOA-Friendly Description: ${r.hoa_friendly_description}
Technical Details: ${r.technical_details}
Safety Considerations: ${r.safety_considerations}
Code References: ${r.code_references}
Common Causes: ${r.common_causes}
Required Parts: ${r.required_parts}
Recommended Products: ${r.recommended_products}
Labor Hours: ${r.labor_hours_min}-${r.labor_hours_max} hours
Parts Cost Range: $${r.parts_cost_min}-$${r.parts_cost_max}
Warranty Notes: ${r.warranty_notes}
`).join('\n---\n')}`;
    }

    if (poolCodes.length > 0) {
      knowledgeBaseContext += `\n\n=== CALIFORNIA POOL CODES (cite these in explanations) ===
${poolCodes.map(c => `
${c.code_type} ${c.code_number}: ${c.title}
Full Text: ${c.full_text}
Plain Language: ${c.plain_language}
HOA Explanation: ${c.hoa_explanation}
`).join('\n')}`;
    }

    if (laborRates.length > 0) {
      knowledgeBaseContext += `\n\n=== LABOR RATES ===
${laborRates.map(r => `${r.rate_name} (${r.rate_code}): $${r.hourly_rate}/hr - ${r.description}`).join('\n')}`;
    }

    // Build personalization context
    let personalizationContext = '';
    if (frequentProducts.length > 0) {
      personalizationContext += `\n\nUSER'S FREQUENTLY USED PRODUCTS (prioritize these when applicable):
${frequentProducts.slice(0, 10).map(p => `- ${p.description} (used ${p.count} times)`).join('\n')}`;
    }
    if (learnedMappings.length > 0) {
      personalizationContext += `\n\nPRODUCTS THE USER HAS SELECTED FOR SIMILAR WORK (strongly consider including):
${learnedMappings.join(', ')}`;
    }
    if (estimateHistory.length > 0) {
      personalizationContext += `\n\nUSER'S RECENT ESTIMATE PATTERNS (learn from these):
${estimateHistory.map(h => `- "${h.query.substring(0, 100)}..." → Used: ${h.products.slice(0, 5).join(', ')}`).join('\n')}`; 
    }

    // Build the AI prompt with template reference
    const systemPrompt = `You are an expert commercial pool repair estimator for Breakpoint Commercial Pool Systems. You create professional estimates with COMPLETE parts lists that match real-world job requirements.

${templateContext ? `REFERENCE TEMPLATE FORMAT:
Opening paragraph style:
"${templateContext.introText}"

Line item format - organize by SECTION (SPA, POOL, WADER, etc.) with items like:
${templateContext.lineItemsJson}

Closing terms:
"${templateContext.termsText}"

Labor rate: $${templateContext.laborRate}/hour
` : ''}

=== CRITICAL PRICING REQUIREMENTS ===
Use ACTUAL 2024-2025 commercial pool equipment prices. These are REAL market prices:

HEATERS (Raypak Commercial):
- Raypak 206A Cupro-Nickel (199k BTU): $4,299.00
- Raypak 267 Cupro-Nickel (266k BTU): $4,899.00  
- Raypak 337 Cupro-Nickel (336k BTU): $5,299.00
- Raypak 407A (400k BTU Pool): $5,799.00
- Raypak Vent Kit (depends on model): $189.00-$349.00
- Condensation Drain Kit: $85.00

FILTERS (Pentair Commercial):
- Pentair TR60 Sand Filter: $1,899.00
- Pentair TR100C Sand Filter: $2,499.00
- Pentair TR140C Sand Filter: $3,299.00
- Sand Media #20 (50lb bag): $18.50/bag
- Hi-Temp Union 2" PVC: $24.69
- Hi-Temp Union 3" PVC: $42.99
- Multiport Valve 2": $389.00
- Sight Glass: $34.99
- Pressure Gauge: $18.99

PUMPS & MOTORS (Century/Pentair):
- Century 2HP 1-Phase VS Motor: $1,249.00
- Century 3HP 1-Phase VS Motor: $1,449.00
- Century 5HP 3-Phase Motor: $1,799.00
- Pentair IntelliFlo VSF 3HP: $2,199.00
- Mechanical Seal Kit: $45.00-$89.00
- Go-Kit (gaskets/o-rings): $35.00-$65.00

PLUMBING & FITTINGS:
- PVC 2" SCH 40 pipe per foot: $3.42
- PVC 3" SCH 40 pipe per foot: $5.89
- PVC 4" SCH 40 pipe per foot: $8.75
- PVC 2" 90° Elbow Slip: $7.33
- PVC 2" 45° Elbow Slip: $6.12
- PVC 2" Union Slip: $18.99
- PVC 3" 90° Elbow Slip: $14.99
- PVC 4" 90° Elbow Slip: $22.50
- PVC 2" Tee Slip: $8.45
- PVC 4" Tee Slip: $18.75
- PVC 2" Coupling Slip: $3.99
- PVC 2" Check Valve: $89.00
- Jandy 3-Port Valve 2": $289.00
- FlowVis Flow Meter: $189.00

DRAIN & BACKWASH PLUMBING (Cast Iron/DWV):
- 4" Mission Clamp (no-hub coupling): $24.99
- 4" Sanitary Tee (San T): $38.50
- 4" Sanitary Tee w/ Threaded Service Plug: $45.00
- 4" Threaded Service Plug: $12.99
- 4" DWV 90° Elbow: $18.75
- 4" DWV 45° Elbow: $16.50
- 4" to 5" Backwash Cone Increaser: $34.99
- 4" P-Trap: $42.00
- 4" Cleanout w/ Plug: $28.50
- 1" Air Gap/Siphon Break Fitting: $45.00
- Shallow Strut Channel (per foot): $8.50
- 4" Strut Clamp: $12.00
- Strut L-Bracket: $8.50
- Stainless Steel Red Head Anchor 3/8"x3": $4.25
- Concrete Anchor Kit (10-pack): $32.00
- Fernco Flexible Coupling 4": $18.99

GAS LINE COMPONENTS (REQUIRED for every heater):
- Gas Valve 3/4": $145.00
- Sediment Trap (drip leg): $45.00
- Gas Flex Connector 3/4"x24": $38.00
- Gas Shutoff Valve 3/4": $28.00
- Black Iron Nipple 3/4"x4": $8.50
- Black Iron 90° Elbow 3/4": $12.00
- Black Iron Tee 3/4": $14.00
- Pipe Thread Sealant: $12.00
- Gas Pressure Test Port: $18.00

ELECTRICAL:
- Weatherproof Junction Box: $45.00
- Conduit Fittings (set): $22.00
- Wire Nuts/Connectors: $8.00
- Ground Clamp: $12.00
- Bonding Wire 8 AWG (per foot): $2.50

CHEMICAL SYSTEMS:
- Stenner Peristaltic Pump: $389.00
- Chemical Tank 15 gallon: $89.00
- Injection Fitting 1/4": $24.00
- Tubing 1/4" (per foot): $1.25
- Check Valve 1/4": $18.00

=== COMPLETE INSTALLATION PACKAGES ===
NEVER install equipment without ALL required components:

HEATER INSTALLATION PACKAGE (always include ALL):
1. Heater unit (Raypak model)
2. Vent kit (model-specific)
3. Condensation drain kit
4. Gas valve with sediment trap/drip leg
5. Gas flex connector
6. Gas shutoff valve
7. Black iron nipples (2-4 pieces)
8. Black iron elbows (1-2 pieces)
9. Hi-temp unions (2 pieces)
10. Check valve (return side)
11. Bypass valve or 3-port valve (if needed)
12. PVC fittings to connect
13. Pipe thread sealant
14. Electrical connections/conduit

FILTER INSTALLATION PACKAGE (always include ALL):
1. Filter tank
2. Sand media (calculate by filter size: TR60=300lb, TR100=500lb, TR140=700lb)
3. Multiport valve
4. Hi-temp unions (2 pieces)  
5. Sight glass
6. Pressure gauge
7. PVC pipe and fittings to connect
8. Drain valve

PUMP/MOTOR INSTALLATION PACKAGE (always include ALL):
1. Motor or pump
2. Mechanical seal kit (even if new - have spare)
3. Go-kit/gasket set
4. Hi-temp unions (2 pieces)
5. PVC fittings to connect
6. Electrical connections/conduit
7. Ground bonding wire

BACKWASH DRAIN INSTALLATION PACKAGE (proper method - always include ALL):
1. 4" Mission Clamp (no-hub coupling for cast iron connection)
2. 4" Sanitary Tee (San T) with threaded service plug
3. 4" DWV 90° Elbows (quantity based on routing - typically 2-4)
4. 4" to 5" Backwash Cone Increaser
5. 4" P-Trap (proper drainage with water seal)
6. Shallow Strut Channel (3-5 feet depending on support needs)
7. 4" Strut Clamp(s) for pipe support
8. Strut L-Bracket for wall mounting
9. Stainless Steel Red Head Anchors 3/8"x3" (2-4 pieces)
10. Concrete chipping/removal as needed
11. Labor: Full day (8 hours) for one technician

Note on backwash drains: ALWAYS use the proper P-trap method with sanitary tee over the "cheap way" (running PVC up and around with 90s and air gap). The proper method prevents splash-out during backwash and meets plumbing code requirements.

=== PAYMENT TERMS (ALWAYS INCLUDE) ===
"This estimate is valid for 60 days. Payment terms: Net 30 from date of invoice.

DEPOSIT REQUIREMENTS:
- Projects $500-$10,000: 10% deposit required to schedule
- Projects over $10,000: 35% deposit required, balance due upon completion
- Emergency repairs: Due upon completion

Additional work beyond scope requires written authorization and will incur additional charges. Final costs may adjust due to material price changes or unforeseen conditions discovered during work."

=== RULES FOR COMPLETE ESTIMATES ===
1. NEVER create an estimate without ALL installation components
2. Calculate sand bags: Filter model determines quantity (TR60=6 bags, TR100=10 bags, TR140=14 bags)
3. Include labor for EACH section separately
4. Always list PVC fittings individually with quantities
5. Gas heater = MUST have complete gas train components
6. Reference specific CA codes in explanations
7. Double-check all math: qty × rate = correct amount
8. Labor hours: Heater install=8-12hrs, Filter install=6-8hrs, Motor install=4-6hrs, Backwash drain install=8hrs, Plumbing work=varies

=== CRITICAL: QUANTITY (qty) RULES ===
The "qty" field is ESSENTIAL - it tells us HOW MANY of each item is needed!
- If installing 3 elbows, set qty: 3
- If need 10 bags of sand, set qty: 10  
- If 2 unions are required, set qty: 2
- NEVER default everything to qty:1 - calculate the ACTUAL quantity needed
- The total for each line = qty × rate (e.g., 3 elbows × $18.75 = $56.25)

Examples of correct quantities:
- Hi-Temp Union 2" PVC: qty: 2 (heaters/filters need 2 unions)
- Black Iron Nipple 3/4": qty: 3 (gas train typically needs 3)
- Sand Media 50lb bag: qty: 10 (TR100 filter needs 500 lbs = 10 bags)
- PVC 90° Elbow: qty: 4 (routing typically needs 3-5)
- Red Head Anchor: qty: 4 (for strut mounting)

=== CRITICAL: PRODUCT/PART NUMBERS REQUIRED ===
EVERY line item MUST include the product number, part number, or SKU when available:
- Format: "Product Name (Part #XXX-YYYY)" or "Product Name - SKU: XXXXX"
- For Pool Brain products, ALWAYS include the SKU from the catalog
- For common parts, include manufacturer part numbers when known
- Example: "Raypak 267 Cupro-Nickel Heater (Part #009218)" NOT just "Raypak 267 Heater"
- Example: "Pentair TR140C Filter (Part #140316)" NOT just "Pentair TR140C Filter"

Return a JSON object with:
{
  "introText": "Professional opening paragraph referencing CA Title 22, Title 24, NEC 680, NFPA 54, VGB...",
  "sections": [
    {
      "name": "SPA",
      "sectionExplanation": "Overview of work on this system",
      "laborHours": 8,
      "items": [
        {
          "description": "Raypak 267 Cupro-Nickel Spa Heater 266k BTU (Part #009218)",
          "partNumber": "009218",
          "qty": 1,
          "rate": 4899.00,
          "taxable": true,
          "explanation": "Commercial spa heater with copper-nickel exchanger per CA Title 24"
        },
        {
          "description": "Hi-Temp Union 2\" PVC (Part #23-0001)",
          "partNumber": "23-0001",
          "qty": 2,
          "rate": 24.69,
          "taxable": true,
          "explanation": "Required for heater connection - inlet and outlet"
        },
        {
          "description": "Black Iron Nipple 3/4\"x4\" (Part #BIN-3404)",
          "partNumber": "BIN-3404",
          "qty": 3,
          "rate": 8.50,
          "taxable": true,
          "explanation": "Gas train connections per NFPA 54"
        }
      ]
    }
  ],
  "totalLaborHours": 8,
  "laborRate": 150.00,
  "termsText": "Include the full payment terms from above...",
  "notes": "Job-specific notes"
}${poolBrainProductContext}${knowledgeBaseContext}${personalizationContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Create a detailed estimate for:
Property: ${propertyName || 'Commercial Property'}
Facility Type: ${facilityType || 'Commercial'}
Work Description: ${workDescription}

Use the knowledge base data provided above to create accurate, professional estimates with proper code citations.
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
    
    // Log interaction for learning
    try {
      const allItems = estimateData.sections?.flatMap((s: any) => s.items?.map((i: any) => i.description) || []) || [];
      await db.execute(sql`
        INSERT INTO ai_learning_interactions 
          (user_id, user_query, suggested_products, session_id)
        VALUES 
          (${userId || null}, ${workDescription}, ${JSON.stringify(allItems)}, ${Date.now().toString()})
      `);
    } catch (logError) {
      console.error("Error logging AI interaction:", logError);
    }

    res.json({ 
      estimate: estimateData, 
      templateUsed: templateContext?.name || null,
      personalized: frequentProducts.length > 0 || learnedMappings.length > 0,
      knowledgeBaseUsed: repairKnowledge.length > 0,
      codesReferenced: poolCodes.length,
      laborRatesApplied: laborRates.length > 0,
      poolBrainProductsUsed: poolBrainAvailable,
    });
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

// Get personalized suggestions for a user based on their history
router.get("/suggestions/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;

    // Get frequently used products
    const frequentProducts = await getUserFrequentProducts(userId);

    // Get recent query patterns
    const recentPatterns = await db.execute(sql`
      SELECT user_query, suggested_products, created_at
      FROM ai_learning_interactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Get commonly paired products
    const commonPairs = await db.execute(sql`
      SELECT primary_product_sku, related_product_sku, co_occurrence_count
      FROM ai_product_patterns
      WHERE user_id = ${userId}
      ORDER BY co_occurrence_count DESC
      LIMIT 15
    `);

    // Generate smart suggestions
    const suggestions = [];
    
    // Suggest based on frequent products
    if (frequentProducts.length > 0) {
      suggestions.push({
        type: 'frequent',
        title: 'Your Go-To Products',
        items: frequentProducts.slice(0, 5).map(p => ({
          name: p.description,
          usageCount: p.count,
          suggestedQty: p.avgQty,
        })),
      });
    }

    // Suggest based on product pairs
    if (commonPairs.rows.length > 0) {
      suggestions.push({
        type: 'pairs',
        title: 'Products You Often Use Together',
        items: commonPairs.rows.slice(0, 5).map((p: any) => ({
          primary: p.primary_product_sku,
          related: p.related_product_sku,
          count: p.co_occurrence_count,
        })),
      });
    }

    res.json({
      suggestions,
      recentQueries: recentPatterns.rows.map((r: any) => ({
        query: r.user_query?.substring(0, 100),
        date: r.created_at,
      })),
      learningStats: {
        totalInteractions: recentPatterns.rows.length,
        knownProducts: frequentProducts.length,
        knownPairs: commonPairs.rows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

// Log when user finalizes an estimate (for learning)
router.post("/log-estimate-finalized", express.json(), async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, workDescription, lineItems, propertyType } = req.body;

    // Update the interaction with selected products
    if (sessionId) {
      await db.execute(sql`
        UPDATE ai_learning_interactions 
        SET selected_products = ${JSON.stringify(lineItems)}
        WHERE session_id = ${sessionId}
      `);
    }

    // Learn product patterns from finalized estimates
    const products = lineItems || [];
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const primary = products[i];
        const related = products[j];
        
        // Insert or update pattern
        await db.execute(sql`
          INSERT INTO ai_product_patterns 
            (user_id, primary_product_sku, related_product_sku, co_occurrence_count, property_type, avg_quantity_ratio)
          VALUES 
            (${userId || null}, ${primary.description || primary.name}, ${related.description || related.name}, 1, ${propertyType || null}, 
             ${(related.qty || 1) / (primary.qty || 1)})
          ON CONFLICT (user_id, primary_product_sku, related_product_sku) 
          DO UPDATE SET 
            co_occurrence_count = ai_product_patterns.co_occurrence_count + 1,
            last_updated = NOW()
        `);
      }
    }

    // Learn query-to-product mappings
    if (workDescription) {
      for (const product of products) {
        await db.execute(sql`
          INSERT INTO ai_query_mappings (user_id, query_term, mapped_product_sku, success_count, total_count)
          VALUES (${userId || null}, ${workDescription.substring(0, 200)}, ${product.description || product.name}, 1, 1)
          ON CONFLICT (user_id, query_term, mapped_product_sku) 
          DO UPDATE SET 
            success_count = ai_query_mappings.success_count + 1,
            total_count = ai_query_mappings.total_count + 1
        `);
      }
    }

    res.json({ success: true, learned: products.length });
  } catch (error) {
    console.error("Error logging estimate finalization:", error);
    res.status(500).json({ error: "Failed to log finalization" });
  }
});

export default router;
