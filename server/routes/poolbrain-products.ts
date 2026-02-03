import { Router } from 'express';
import { getProducts, getProductCategories, mapPoolBrainToHeritageFormat } from '../services/poolbrain';
import { HERITAGE_PRODUCTS } from '../data/heritageProducts';

const router = Router();

let cachedProducts: any[] = [];
let cachedCategories: any[] = [];
let lastProductFetch = 0;
let lastCategoryFetch = 0;
let poolBrainAvailable = true;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RETRY_AFTER_ERROR = 60 * 1000; // Retry Pool Brain after 1 minute on errors
let lastErrorTime = 0;

// Helper to get products with fallback to static data
function getProductsWithFallback(): { products: any[], source: string } {
  if (cachedProducts.length > 0 && poolBrainAvailable) {
    return { products: cachedProducts, source: 'poolbrain' };
  }
  // Use static HERITAGE_PRODUCTS as fallback
  return { products: HERITAGE_PRODUCTS || [], source: 'fallback' };
}

router.get('/products', async (req, res) => {
  try {
    const now = Date.now();
    
    const shouldFetch = 
      cachedProducts.length === 0 || 
      now - lastProductFetch > CACHE_TTL;
    
    const canRetryPoolBrain = 
      poolBrainAvailable || 
      now - lastErrorTime > RETRY_AFTER_ERROR;
    
    if (shouldFetch && canRetryPoolBrain) {
      try {
        console.log('[Pool Brain] Fetching fresh products from API...');
        const rawProducts = await getProducts();
        if (rawProducts.length > 0) {
          cachedProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
          lastProductFetch = now;
          poolBrainAvailable = true;
          console.log(`[Pool Brain] Fetched ${cachedProducts.length} products`);
        } else {
          console.log('[Pool Brain] API returned empty data, using fallback');
          poolBrainAvailable = false;
        }
      } catch (apiError) {
        console.error('[Pool Brain] API error, will use fallback:', apiError);
        poolBrainAvailable = false;
        lastErrorTime = now;
      }
    }
    
    const { category, subcategory, search } = req.query;
    
    // Get products with fallback to static data
    const { products, source } = getProductsWithFallback();
    let filtered = [...products];
    
    if (category && typeof category === 'string') {
      filtered = filtered.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (subcategory && typeof subcategory === 'string') {
      filtered = filtered.filter(p => 
        p.subcategory.toLowerCase() === subcategory.toLowerCase()
      );
    }
    
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        (p.heritageNumber || '').toLowerCase().includes(searchLower) ||
        (p.description || '').toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: filtered,
      totalCount: filtered.length,
      source,
      cachedAt: lastProductFetch > 0 ? new Date(lastProductFetch).toISOString() : null,
    });
  } catch (error) {
    console.error('[Pool Brain] Error fetching products:', error);
    // Even on error, return fallback data
    res.json({
      success: true,
      data: HERITAGE_PRODUCTS,
      totalCount: HERITAGE_PRODUCTS.length,
      source: 'fallback',
      message: 'Using local catalog',
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const now = Date.now();
    
    if (cachedCategories.length === 0 || now - lastCategoryFetch > CACHE_TTL) {
      console.log('[Pool Brain] Fetching fresh categories from API...');
      cachedCategories = await getProductCategories();
      lastCategoryFetch = now;
      console.log(`[Pool Brain] Fetched ${cachedCategories.length} categories`);
    }
    
    res.json({
      success: true,
      data: cachedCategories,
      cachedAt: new Date(lastCategoryFetch).toISOString(),
    });
  } catch (error) {
    console.error('[Pool Brain] Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories from Pool Brain',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/refresh', async (req, res) => {
  try {
    console.log('[Pool Brain] Force refreshing products and categories...');
    
    const rawProducts = await getProducts();
    cachedProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
    lastProductFetch = Date.now();
    
    cachedCategories = await getProductCategories();
    lastCategoryFetch = Date.now();
    
    res.json({
      success: true,
      productsCount: cachedProducts.length,
      categoriesCount: cachedCategories.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Pool Brain] Error refreshing data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh Pool Brain data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
