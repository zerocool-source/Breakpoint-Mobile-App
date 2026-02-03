import { Router } from 'express';
import { getProducts, getProductCategories, mapPoolBrainToHeritageFormat } from '../services/poolbrain';

const router = Router();

// Sample products for testing when Pool Brain API is unavailable
const SAMPLE_PRODUCTS = [
  { sku: 'PB-001', heritageNumber: 'H-12345', name: 'Pentair IntelliFlo VSF Variable Speed Pump', category: 'Pumps', subcategory: 'Variable Speed', price: 1599.99, cost: 1199.99, unit: 'Each', manufacturer: 'Pentair', description: 'High-efficiency variable speed pump with built-in drive', productId: 1001 },
  { sku: 'PB-002', heritageNumber: 'H-12346', name: 'Hayward Super Pump 1.5HP', category: 'Pumps', subcategory: 'Single Speed', price: 549.99, cost: 399.99, unit: 'Each', manufacturer: 'Hayward', description: 'Reliable single speed pump for residential and commercial pools', productId: 1002 },
  { sku: 'PB-003', heritageNumber: 'H-12347', name: 'Jandy CV460 Cartridge Filter', category: 'Filters', subcategory: 'Cartridge', price: 899.99, cost: 649.99, unit: 'Each', manufacturer: 'Jandy', description: '460 sq ft cartridge filter for crystal clear water', productId: 1003 },
  { sku: 'PB-004', heritageNumber: 'H-12348', name: 'Pentair Clean & Clear Plus 420', category: 'Filters', subcategory: 'Cartridge', price: 749.99, cost: 549.99, unit: 'Each', manufacturer: 'Pentair', description: '420 sq ft cartridge filter with easy access lid', productId: 1004 },
  { sku: 'PB-005', heritageNumber: 'H-12349', name: 'Hayward Pro-Grid DE Filter 48 sq ft', category: 'Filters', subcategory: 'DE', price: 1099.99, cost: 799.99, unit: 'Each', manufacturer: 'Hayward', description: 'Premium DE filter for superior water clarity', productId: 1005 },
  { sku: 'PB-006', heritageNumber: 'H-12350', name: 'Pentair MasterTemp 400K BTU Heater', category: 'Heaters', subcategory: 'Gas', price: 2899.99, cost: 2199.99, unit: 'Each', manufacturer: 'Pentair', description: 'High-performance 400,000 BTU natural gas heater', productId: 1006 },
  { sku: 'PB-007', heritageNumber: 'H-12351', name: 'Hayward H400FDN Universal H-Series', category: 'Heaters', subcategory: 'Gas', price: 2499.99, cost: 1899.99, unit: 'Each', manufacturer: 'Hayward', description: '400,000 BTU low NOx gas heater', productId: 1007 },
  { sku: 'PB-008', heritageNumber: 'H-12352', name: 'Pentair IntelliChlor IC40 Salt Cell', category: 'Sanitization', subcategory: 'Salt Chlorine Generator', price: 799.99, cost: 599.99, unit: 'Each', manufacturer: 'Pentair', description: 'Salt chlorine generator for pools up to 40,000 gallons', productId: 1008 },
  { sku: 'PB-009', heritageNumber: 'H-12353', name: 'Hayward AquaRite T-Cell-15 Salt Cell', category: 'Sanitization', subcategory: 'Salt Chlorine Generator', price: 649.99, cost: 489.99, unit: 'Each', manufacturer: 'Hayward', description: 'Replacement salt cell for pools up to 40,000 gallons', productId: 1009 },
  { sku: 'PB-010', heritageNumber: 'H-12354', name: 'Jandy Pro Series JXi 400K BTU Heater', category: 'Heaters', subcategory: 'Gas', price: 3199.99, cost: 2399.99, unit: 'Each', manufacturer: 'Jandy', description: 'Compact high-efficiency heater with digital controls', productId: 1010 },
  { sku: 'PB-011', heritageNumber: 'H-12355', name: 'Pentair EasyTouch 8 Control System', category: 'Automation', subcategory: 'Control Systems', price: 2199.99, cost: 1699.99, unit: 'Each', manufacturer: 'Pentair', description: 'Complete pool and spa automation control system', productId: 1011 },
  { sku: 'PB-012', heritageNumber: 'H-12356', name: 'Hayward OmniLogic Pool Control', category: 'Automation', subcategory: 'Control Systems', price: 1899.99, cost: 1449.99, unit: 'Each', manufacturer: 'Hayward', description: 'Smart pool and backyard automation system', productId: 1012 },
  { sku: 'PB-013', heritageNumber: 'H-12357', name: 'Zodiac Polaris 3900 Sport Cleaner', category: 'Cleaners', subcategory: 'Pressure Side', price: 899.99, cost: 699.99, unit: 'Each', manufacturer: 'Zodiac', description: 'Pressure-side automatic pool cleaner with sweep hose', productId: 1013 },
  { sku: 'PB-014', heritageNumber: 'H-12358', name: 'Hayward PoolVac XL Suction Cleaner', category: 'Cleaners', subcategory: 'Suction Side', price: 449.99, cost: 349.99, unit: 'Each', manufacturer: 'Hayward', description: 'Suction-side cleaner for all pool surfaces', productId: 1014 },
  { sku: 'PB-015', heritageNumber: 'H-12359', name: 'Pool Chlorine Tablets 50lb Bucket', category: 'Chemicals', subcategory: 'Chlorine', price: 189.99, cost: 129.99, unit: 'Bucket', manufacturer: 'Various', description: '3-inch stabilized chlorine tablets for pools', productId: 1015 },
  { sku: 'PB-016', heritageNumber: 'H-12360', name: 'Muriatic Acid 2-Pack Gallons', category: 'Chemicals', subcategory: 'pH Control', price: 24.99, cost: 14.99, unit: '2-Pack', manufacturer: 'Various', description: 'Pool-grade muriatic acid for pH adjustment', productId: 1016 },
  { sku: 'PB-017', heritageNumber: 'H-12361', name: 'Calcium Hypochlorite Shock 25lb', category: 'Chemicals', subcategory: 'Shock', price: 129.99, cost: 89.99, unit: 'Bag', manufacturer: 'Various', description: 'Cal-hypo shock treatment for weekly maintenance', productId: 1017 },
  { sku: 'PB-018', heritageNumber: 'H-12362', name: 'Pentair 2-inch Multiport Valve', category: 'Valves', subcategory: 'Multiport', price: 299.99, cost: 219.99, unit: 'Each', manufacturer: 'Pentair', description: '6-position multiport valve for sand and DE filters', productId: 1018 },
  { sku: 'PB-019', heritageNumber: 'H-12363', name: 'Jandy 3-Way Valve 2 inch', category: 'Valves', subcategory: 'Diverter', price: 89.99, cost: 64.99, unit: 'Each', manufacturer: 'Jandy', description: 'Never-lube 3-way diverter valve', productId: 1019 },
  { sku: 'PB-020', heritageNumber: 'H-12364', name: 'Pool Motor 1.5HP 56Y Frame', category: 'Motors', subcategory: 'Replacement Motors', price: 349.99, cost: 259.99, unit: 'Each', manufacturer: 'Century', description: 'Replacement motor for most pool pumps', productId: 1020 },
];

const SAMPLE_CATEGORIES = [
  { CategoryID: 1, CategoryName: 'Pumps', SubCategories: [{ SubCategoryID: 101, SubCategoryName: 'Variable Speed' }, { SubCategoryID: 102, SubCategoryName: 'Single Speed' }] },
  { CategoryID: 2, CategoryName: 'Filters', SubCategories: [{ SubCategoryID: 201, SubCategoryName: 'Cartridge' }, { SubCategoryID: 202, SubCategoryName: 'DE' }, { SubCategoryID: 203, SubCategoryName: 'Sand' }] },
  { CategoryID: 3, CategoryName: 'Heaters', SubCategories: [{ SubCategoryID: 301, SubCategoryName: 'Gas' }, { SubCategoryID: 302, SubCategoryName: 'Heat Pump' }] },
  { CategoryID: 4, CategoryName: 'Sanitization', SubCategories: [{ SubCategoryID: 401, SubCategoryName: 'Salt Chlorine Generator' }, { SubCategoryID: 402, SubCategoryName: 'UV/Ozone' }] },
  { CategoryID: 5, CategoryName: 'Automation', SubCategories: [{ SubCategoryID: 501, SubCategoryName: 'Control Systems' }, { SubCategoryID: 502, SubCategoryName: 'Actuators' }] },
  { CategoryID: 6, CategoryName: 'Cleaners', SubCategories: [{ SubCategoryID: 601, SubCategoryName: 'Pressure Side' }, { SubCategoryID: 602, SubCategoryName: 'Suction Side' }, { SubCategoryID: 603, SubCategoryName: 'Robotic' }] },
  { CategoryID: 7, CategoryName: 'Chemicals', SubCategories: [{ SubCategoryID: 701, SubCategoryName: 'Chlorine' }, { SubCategoryID: 702, SubCategoryName: 'pH Control' }, { SubCategoryID: 703, SubCategoryName: 'Shock' }] },
  { CategoryID: 8, CategoryName: 'Valves', SubCategories: [{ SubCategoryID: 801, SubCategoryName: 'Multiport' }, { SubCategoryID: 802, SubCategoryName: 'Diverter' }] },
  { CategoryID: 9, CategoryName: 'Motors', SubCategories: [{ SubCategoryID: 901, SubCategoryName: 'Replacement Motors' }] },
];

let cachedProducts: any[] = [];
let cachedCategories: any[] = [];
let lastProductFetch = 0;
let lastCategoryFetch = 0;
let poolBrainAvailable = false;
let lastApiError = '';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RETRY_AFTER_ERROR = 30 * 1000; // Retry Pool Brain after 30 seconds on errors
let lastErrorTime = 0;
const USE_SAMPLE_DATA_ON_API_FAILURE = true; // Enable sample data fallback

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
    
    // If no cached products and Pool Brain is unavailable, use sample data for testing
    if (cachedProducts.length === 0) {
      if (USE_SAMPLE_DATA_ON_API_FAILURE) {
        console.log('[Pool Brain] API unavailable, using sample products for testing');
        cachedProducts = SAMPLE_PRODUCTS;
        poolBrainAvailable = false;
      } else {
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
    
    const shouldFetch = cachedCategories.length === 0 || now - lastCategoryFetch > CACHE_TTL;
    const canRetryPoolBrain = !lastErrorTime || now - lastErrorTime > RETRY_AFTER_ERROR;
    
    if (shouldFetch && canRetryPoolBrain) {
      try {
        console.log('[Pool Brain] Fetching fresh categories from API...');
        const categories = await getProductCategories();
        if (categories.length > 0) {
          cachedCategories = categories;
          lastCategoryFetch = now;
          console.log(`[Pool Brain] Fetched ${cachedCategories.length} categories`);
        }
      } catch (apiError: any) {
        console.error('[Pool Brain] Category API error:', apiError?.message || apiError);
        lastErrorTime = now;
      }
    }
    
    if (cachedCategories.length === 0) {
      if (USE_SAMPLE_DATA_ON_API_FAILURE) {
        console.log('[Pool Brain] API unavailable, using sample categories for testing');
        cachedCategories = SAMPLE_CATEGORIES;
      } else {
        return res.status(503).json({
          success: false,
          serviceAvailable: false,
          data: [],
          message: 'Category service temporarily unavailable',
        });
      }
    }
    
    res.json({
      success: true,
      serviceAvailable: true,
      data: cachedCategories,
      cachedAt: lastCategoryFetch > 0 ? new Date(lastCategoryFetch).toISOString() : null,
      source: cachedCategories === SAMPLE_CATEGORIES ? 'sample' : 'poolbrain',
    });
  } catch (error: any) {
    console.error('[Pool Brain] Error fetching categories:', error);
    
    if (USE_SAMPLE_DATA_ON_API_FAILURE) {
      cachedCategories = SAMPLE_CATEGORIES;
      return res.json({
        success: true,
        serviceAvailable: true,
        data: cachedCategories,
        source: 'sample',
      });
    }
    
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
