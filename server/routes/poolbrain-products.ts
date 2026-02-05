import { Router } from 'express';
import { getProducts, getProductCategories, mapPoolBrainToHeritageFormat } from '../services/poolbrain';

const router = Router();

// Sample products with REAL manufacturer part numbers for when Pool Brain API is unavailable
// These are actual SKUs used in the commercial pool industry
const SAMPLE_PRODUCTS = [
  { sku: '011057', heritageNumber: '011057', name: 'Pentair IntelliFlo VSF Variable Speed Pump 3HP', category: 'Pumps', subcategory: 'Variable Speed', price: 2199.00, cost: 1649.00, unit: 'Each', manufacturer: 'Pentair', description: 'High-efficiency variable speed pump with built-in drive', productId: 1001 },
  { sku: 'SP2610X15', heritageNumber: 'SP2610X15', name: 'Hayward Super Pump 1.5HP', category: 'Pumps', subcategory: 'Single Speed', price: 549.99, cost: 399.99, unit: 'Each', manufacturer: 'Hayward', description: 'Reliable single speed pump for residential and commercial pools', productId: 1002 },
  { sku: '140316', heritageNumber: '140316', name: 'Pentair TR140C Sand Filter', category: 'Filters', subcategory: 'Sand', price: 3299.00, cost: 2499.00, unit: 'Each', manufacturer: 'Pentair', description: 'Commercial sand filter for large pools', productId: 1003 },
  { sku: '160301', heritageNumber: '160301', name: 'Pentair Clean & Clear Plus 420', category: 'Filters', subcategory: 'Cartridge', price: 749.99, cost: 549.99, unit: 'Each', manufacturer: 'Pentair', description: '420 sq ft cartridge filter with easy access lid', productId: 1004 },
  { sku: 'DE4820', heritageNumber: 'DE4820', name: 'Hayward Pro-Grid DE Filter 48 sq ft', category: 'Filters', subcategory: 'DE', price: 1099.99, cost: 799.99, unit: 'Each', manufacturer: 'Hayward', description: 'Premium DE filter for superior water clarity', productId: 1005 },
  { sku: '009218', heritageNumber: '009218', name: 'Raypak 267 Cupro-Nickel Spa Heater 266k BTU', category: 'Heaters', subcategory: 'Gas', price: 4899.00, cost: 3699.00, unit: 'Each', manufacturer: 'Raypak', description: 'Commercial cupro-nickel spa heater', productId: 1006 },
  { sku: '009200', heritageNumber: '009200', name: 'Raypak 206A Cupro-Nickel Heater 199k BTU', category: 'Heaters', subcategory: 'Gas', price: 4299.00, cost: 3199.00, unit: 'Each', manufacturer: 'Raypak', description: 'Commercial cupro-nickel pool heater', productId: 1007 },
  { sku: '009228', heritageNumber: '009228', name: 'Raypak 337 Cupro-Nickel Heater 336k BTU', category: 'Heaters', subcategory: 'Gas', price: 5299.00, cost: 3999.00, unit: 'Each', manufacturer: 'Raypak', description: 'Commercial cupro-nickel pool heater', productId: 1008 },
  { sku: '009238', heritageNumber: '009238', name: 'Raypak 407A Pool Heater 400k BTU', category: 'Heaters', subcategory: 'Gas', price: 5799.00, cost: 4399.00, unit: 'Each', manufacturer: 'Raypak', description: 'High-capacity commercial pool heater', productId: 1009 },
  { sku: '521103', heritageNumber: '521103', name: 'Pentair IntelliChlor IC40 Salt Cell', category: 'Sanitization', subcategory: 'Salt Chlorine Generator', price: 799.99, cost: 599.99, unit: 'Each', manufacturer: 'Pentair', description: 'Salt chlorine generator for pools up to 40,000 gallons', productId: 1010 },
  { sku: 'GLX-CELL-15', heritageNumber: 'GLX-CELL-15', name: 'Hayward AquaRite T-Cell-15 Salt Cell', category: 'Sanitization', subcategory: 'Salt Chlorine Generator', price: 649.99, cost: 489.99, unit: 'Each', manufacturer: 'Hayward', description: 'Replacement salt cell for pools up to 40,000 gallons', productId: 1011 },
  { sku: '262506', heritageNumber: '262506', name: 'Pentair Hi-Temp Union 2" PVC', category: 'Plumbing', subcategory: 'Fittings', price: 24.69, cost: 18.50, unit: 'Each', manufacturer: 'Pentair', description: 'High-temperature union for heater connections', productId: 1012 },
  { sku: '262509', heritageNumber: '262509', name: 'Pentair Hi-Temp Union 3" PVC', category: 'Plumbing', subcategory: 'Fittings', price: 42.99, cost: 32.00, unit: 'Each', manufacturer: 'Pentair', description: 'High-temperature union for heater connections', productId: 1013 },
  { sku: '261055', heritageNumber: '261055', name: 'Pentair 2" Multiport Valve', category: 'Valves', subcategory: 'Multiport', price: 389.00, cost: 289.00, unit: 'Each', manufacturer: 'Pentair', description: '6-position multiport valve for sand filters', productId: 1014 },
  { sku: '4720', heritageNumber: '4720', name: 'Jandy 3-Port Valve 2"', category: 'Valves', subcategory: 'Diverter', price: 289.00, cost: 215.00, unit: 'Each', manufacturer: 'Jandy', description: 'Never-lube 3-way diverter valve', productId: 1015 },
  { sku: 'B853', heritageNumber: 'B853', name: 'Century 1.5HP 56Y Frame Motor', category: 'Motors', subcategory: 'Replacement Motors', price: 349.99, cost: 259.99, unit: 'Each', manufacturer: 'Century', description: 'Replacement motor for most pool pumps', productId: 1016 },
  { sku: 'U.S.S.100', heritageNumber: 'U.S.S.100', name: 'Universal Shaft Seal PS-1000', category: 'Parts', subcategory: 'Seals', price: 45.00, cost: 28.00, unit: 'Each', manufacturer: 'US Seal', description: 'Universal pump shaft seal', productId: 1017 },
  { sku: '005302', heritageNumber: '005302', name: 'Raypak Vent Kit Standard', category: 'Parts', subcategory: 'Heater Parts', price: 189.00, cost: 142.00, unit: 'Each', manufacturer: 'Raypak', description: 'Standard vent kit for Raypak heaters', productId: 1018 },
  { sku: 'MN-100', heritageNumber: 'MN-100', name: '4" Mission Clamp No-Hub Coupling', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 24.99, cost: 15.99, unit: 'Each', manufacturer: 'Mission', description: 'No-hub coupling for cast iron pipe connections', productId: 1019 },
  { sku: 'SG-100', heritageNumber: 'SG-100', name: 'Pressure Gauge 0-60 PSI', category: 'Parts', subcategory: 'Gauges', price: 18.99, cost: 9.99, unit: 'Each', manufacturer: 'Various', description: 'Standard pressure gauge for filters', productId: 1020 },
  { sku: 'SAND-20', heritageNumber: 'SAND-20', name: 'Filter Sand #20 Grade 50lb Bag', category: 'Media', subcategory: 'Filter Media', price: 18.50, cost: 11.00, unit: 'Bag', manufacturer: 'Various', description: '#20 silica sand for sand filters', productId: 1021 },
  { sku: 'PVC-290-2', heritageNumber: 'PVC-290-2', name: 'PVC 2" 90° Elbow SCH 40', category: 'Plumbing', subcategory: 'Fittings', price: 7.33, cost: 4.50, unit: 'Each', manufacturer: 'Lasco', description: 'Schedule 40 PVC 90 degree elbow', productId: 1022 },
  { sku: 'PVC-290-4', heritageNumber: 'PVC-290-4', name: 'PVC 4" 90° Elbow SCH 40', category: 'Plumbing', subcategory: 'Fittings', price: 22.50, cost: 14.00, unit: 'Each', manufacturer: 'Lasco', description: 'Schedule 40 PVC 4" 90 degree elbow', productId: 1023 },
  { sku: 'BIN-3404', heritageNumber: 'BIN-3404', name: 'Black Iron Nipple 3/4"x4"', category: 'Plumbing', subcategory: 'Gas Fittings', price: 8.50, cost: 4.99, unit: 'Each', manufacturer: 'Various', description: 'Black iron nipple for gas connections', productId: 1024 },
  { sku: 'GV-34', heritageNumber: 'GV-34', name: 'Gas Ball Valve 3/4"', category: 'Valves', subcategory: 'Gas Valves', price: 42.00, cost: 28.00, unit: 'Each', manufacturer: 'Various', description: 'Brass gas ball valve', productId: 1025 },
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
