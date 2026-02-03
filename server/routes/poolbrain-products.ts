import { Router } from 'express';
import { getProducts, getProductCategories, mapPoolBrainToHeritageFormat } from '../services/poolbrain';

const router = Router();

let cachedProducts: any[] = [];
let cachedCategories: any[] = [];
let lastProductFetch = 0;
let lastCategoryFetch = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/products', async (req, res) => {
  try {
    const now = Date.now();
    
    if (cachedProducts.length === 0 || now - lastProductFetch > CACHE_TTL) {
      console.log('[Pool Brain] Fetching fresh products from API...');
      const rawProducts = await getProducts();
      cachedProducts = rawProducts.map(mapPoolBrainToHeritageFormat);
      lastProductFetch = now;
      console.log(`[Pool Brain] Fetched ${cachedProducts.length} products`);
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
        p.heritageNumber.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }
    
    res.json({
      success: true,
      data: filtered,
      totalCount: filtered.length,
      cachedAt: new Date(lastProductFetch).toISOString(),
    });
  } catch (error) {
    console.error('[Pool Brain] Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products from Pool Brain',
      message: error instanceof Error ? error.message : 'Unknown error',
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
