import { Router } from 'express';
import { getProducts, getProductCategories, mapPoolBrainToHeritageFormat } from '../services/poolbrain';

const router = Router();

let cachedProducts: any[] = [];
let cachedCategories: any[] = [];
let lastProductFetch = 0;
let lastCategoryFetch = 0;
let poolBrainAvailable = false;
let lastApiError = '';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RETRY_AFTER_ERROR = 30 * 1000; // Retry Pool Brain after 30 seconds on errors
let lastErrorTime = 0;

router.get('/products', async (req, res) => {
  try {
    const now = Date.now();
    
    const shouldFetch = 
      cachedProducts.length === 0 || 
      now - lastProductFetch > CACHE_TTL;
    
    const canRetryPoolBrain = 
      !lastErrorTime || 
      now - lastErrorTime > RETRY_AFTER_ERROR;
    
    if (shouldFetch && canRetryPoolBrain) {
      try {
        console.log('[Pool Brain] Fetching fresh products from API...');
        const rawProducts = await getProducts();
        if (rawProducts.length > 0) {
          cachedProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
          lastProductFetch = now;
          poolBrainAvailable = true;
          lastApiError = '';
          console.log(`[Pool Brain] Fetched ${cachedProducts.length} products from Pool Brain API`);
        } else {
          console.log('[Pool Brain] API returned empty data');
          poolBrainAvailable = false;
          lastApiError = 'Pool Brain API returned no products';
          lastErrorTime = now;
        }
      } catch (apiError: any) {
        console.error('[Pool Brain] API error:', apiError?.message || apiError);
        poolBrainAvailable = false;
        lastApiError = apiError?.message || 'Pool Brain API connection failed';
        lastErrorTime = now;
      }
    }
    
    // If no cached products and Pool Brain is unavailable, return service unavailable
    if (cachedProducts.length === 0) {
      return res.status(503).json({
        success: false,
        serviceAvailable: false,
        data: [],
        totalCount: 0,
        message: 'Product catalog service temporarily unavailable. Please try again later.',
        error: lastApiError || 'Unable to connect to product database',
        retryAfter: Math.max(0, RETRY_AFTER_ERROR - (now - lastErrorTime)) / 1000,
      });
    }
    
    const { category, subcategory, search } = req.query;
    
    let filtered = [...cachedProducts];
    
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
      serviceAvailable: true,
      data: filtered,
      totalCount: filtered.length,
      source: 'poolbrain',
      cachedAt: lastProductFetch > 0 ? new Date(lastProductFetch).toISOString() : null,
    });
  } catch (error: any) {
    console.error('[Pool Brain] Error fetching products:', error);
    res.status(503).json({
      success: false,
      serviceAvailable: false,
      data: [],
      totalCount: 0,
      message: 'Product catalog service temporarily unavailable',
      error: error?.message || 'Unknown error',
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const now = Date.now();
    
    if (cachedCategories.length === 0 || now - lastCategoryFetch > CACHE_TTL) {
      console.log('[Pool Brain] Fetching fresh categories from API...');
      const categories = await getProductCategories();
      if (categories.length > 0) {
        cachedCategories = categories;
        lastCategoryFetch = now;
        console.log(`[Pool Brain] Fetched ${cachedCategories.length} categories`);
      }
    }
    
    if (cachedCategories.length === 0) {
      return res.status(503).json({
        success: false,
        serviceAvailable: false,
        data: [],
        message: 'Category service temporarily unavailable',
      });
    }
    
    res.json({
      success: true,
      serviceAvailable: true,
      data: cachedCategories,
      cachedAt: new Date(lastCategoryFetch).toISOString(),
    });
  } catch (error: any) {
    console.error('[Pool Brain] Error fetching categories:', error);
    res.status(503).json({
      success: false,
      serviceAvailable: false,
      data: [],
      message: 'Category service temporarily unavailable',
      error: error?.message || 'Unknown error',
    });
  }
});

router.get('/status', async (req, res) => {
  res.json({
    poolBrainAvailable,
    cachedProductsCount: cachedProducts.length,
    cachedCategoriesCount: cachedCategories.length,
    lastProductFetch: lastProductFetch > 0 ? new Date(lastProductFetch).toISOString() : null,
    lastCategoryFetch: lastCategoryFetch > 0 ? new Date(lastCategoryFetch).toISOString() : null,
    lastApiError: lastApiError || null,
    lastErrorTime: lastErrorTime > 0 ? new Date(lastErrorTime).toISOString() : null,
  });
});

router.post('/refresh', async (req, res) => {
  try {
    console.log('[Pool Brain] Force refreshing products and categories...');
    
    const rawProducts = await getProducts();
    if (rawProducts.length > 0) {
      cachedProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
      lastProductFetch = Date.now();
      poolBrainAvailable = true;
      lastApiError = '';
    } else {
      throw new Error('Pool Brain API returned no products');
    }
    
    const categories = await getProductCategories();
    if (categories.length > 0) {
      cachedCategories = categories;
      lastCategoryFetch = Date.now();
    }
    
    res.json({
      success: true,
      serviceAvailable: true,
      productsCount: cachedProducts.length,
      categoriesCount: cachedCategories.length,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Pool Brain] Error refreshing data:', error);
    poolBrainAvailable = false;
    lastApiError = error?.message || 'Refresh failed';
    lastErrorTime = Date.now();
    
    res.status(503).json({
      success: false,
      serviceAvailable: false,
      message: 'Unable to refresh product data from Pool Brain',
      error: error?.message || 'Unknown error',
    });
  }
});

export default router;
