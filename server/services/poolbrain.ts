// Pool Brain API Integration
// Using official OpenAPI endpoints from https://prodapi.poolbrain.com/OpenAPI/docs/

const POOLBRAIN_API_BASE = 'https://prodapi.poolbrain.com';
const POOLBRAIN_API_KEY = process.env.POOLBRAIN_API_KEY;

export interface PoolBrainProduct {
  RecordID: number;
  Name: string;
  Description: string;
  Category: string;
  Cost: number;
  Price: number;
  'Part#': string;
  'Product/Service/Bundle': string;
  Status: number;
  ChargeTax: number;
  Duration: string;
  CreatedDate: string;
  LastModifiedDate: string;
}

export interface NormalizedProduct {
  sku: string;
  name: string;
  description: string;
  category: string;
  cost: number;
  price: number;
  partNumber: string;
  productType: string;
  recordId: number;
  isActive: boolean;
  chargeTax: boolean;
}

export interface PoolBrainApiResponse {
  status?: string;
  message?: string;
  data?: PoolBrainProduct[];
}

async function makePoolBrainRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!POOLBRAIN_API_KEY) {
    throw new Error('POOLBRAIN_API_KEY is not configured');
  }

  const url = `${POOLBRAIN_API_BASE}${endpoint}`;
  
  console.log(`[Pool Brain] Making request to: ${url}`);
  console.log(`[Pool Brain] Using API key: ${POOLBRAIN_API_KEY.substring(0, 8)}...`);
  
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'ACCESS-KEY': POOLBRAIN_API_KEY,
      ...options.headers,
    },
    body: options.body,
  });

  const responseText = await response.text();
  
  if (!response.ok) {
    console.error(`[Pool Brain] API error: ${response.status} - ${responseText}`);
    throw new Error(`Pool Brain API error: ${response.status} - ${responseText}`);
  }

  try {
    return JSON.parse(responseText) as T;
  } catch (e) {
    console.error(`[Pool Brain] Failed to parse response: ${responseText.substring(0, 200)}`);
    throw new Error('Failed to parse Pool Brain API response');
  }
}

export async function getProducts(options?: {
  fromDate?: string;
  toDate?: string;
  offset?: number;
  limit?: number;
}): Promise<PoolBrainProduct[]> {
  try {
    const params = new URLSearchParams();
    if (options?.fromDate) params.append('fromDate', options.fromDate);
    if (options?.toDate) params.append('toDate', options.toDate);
    if (options?.offset !== undefined) params.append('offset', options.offset.toString());
    if (options?.limit !== undefined) params.append('limit', options.limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/product_list${queryString ? `?${queryString}` : ''}`;
    
    const response = await makePoolBrainRequest<PoolBrainProduct[] | PoolBrainApiResponse>(endpoint);
    
    console.log('[Pool Brain] Product response type:', typeof response, Array.isArray(response));
    
    // Handle array response directly
    if (Array.isArray(response)) {
      console.log(`[Pool Brain] Fetched ${response.length} products`);
      return response.filter(p => p.Status !== 0);
    }
    
    // Handle wrapped response
    if (response.data && Array.isArray(response.data)) {
      console.log(`[Pool Brain] Fetched ${response.data.length} products from wrapped response`);
      return response.data.filter(p => p.Status !== 0);
    }
    
    console.error('[Pool Brain] Unexpected response format:', JSON.stringify(response).substring(0, 500));
    return [];
  } catch (error) {
    console.error('[Pool Brain] Error fetching products:', error);
    throw error;
  }
}

export function normalizeProduct(product: PoolBrainProduct): NormalizedProduct {
  return {
    recordId: product.RecordID,
    sku: product['Part#'] || `PB-${product.RecordID}`,
    name: product.Name || 'Unknown Product',
    description: product.Description || '',
    category: product.Category || 'Uncategorized',
    cost: product.Cost || 0,
    price: product.Price || 0,
    partNumber: product['Part#'] || '',
    productType: product['Product/Service/Bundle'] || 'Product',
    isActive: product.Status !== 0,
    chargeTax: product.ChargeTax === 1,
  };
}

export async function getNormalizedProducts(options?: {
  fromDate?: string;
  toDate?: string;
  offset?: number;
  limit?: number;
}): Promise<NormalizedProduct[]> {
  // If specific limit/offset provided, use those
  if (options?.limit !== undefined || options?.offset !== undefined) {
    const rawProducts = await getProducts(options);
    return rawProducts.map(normalizeProduct);
  }
  
  // Otherwise, paginate to get ALL products
  const allProducts: PoolBrainProduct[] = [];
  let offset = 0;
  const batchSize = 500;
  let hasMore = true;
  
  while (hasMore) {
    const batch = await getProducts({
      ...options,
      offset,
      limit: batchSize,
    });
    
    if (batch.length > 0) {
      allProducts.push(...batch);
      offset += batch.length;
      console.log(`[Pool Brain] Fetched ${allProducts.length} products so far...`);
    }
    
    // Stop if we got fewer than requested (no more data)
    if (batch.length < batchSize) {
      hasMore = false;
    }
  }
  
  console.log(`[Pool Brain] Total products fetched: ${allProducts.length}`);
  return allProducts.map(normalizeProduct);
}

export async function searchProducts(query: string): Promise<NormalizedProduct[]> {
  const allProducts = await getNormalizedProducts();
  const searchLower = query.toLowerCase();
  
  return allProducts.filter(p => 
    p.name.toLowerCase().includes(searchLower) ||
    p.description.toLowerCase().includes(searchLower) ||
    p.category.toLowerCase().includes(searchLower) ||
    p.partNumber.toLowerCase().includes(searchLower)
  );
}

export async function getProductsByCategory(category: string): Promise<NormalizedProduct[]> {
  const allProducts = await getNormalizedProducts();
  const categoryLower = category.toLowerCase();
  
  return allProducts.filter(p => 
    p.category.toLowerCase().includes(categoryLower)
  );
}

// Test connection to Pool Brain API
export async function testConnection(): Promise<{ success: boolean; message: string; productCount?: number }> {
  try {
    const products = await getProducts({ limit: 1 });
    return {
      success: true,
      message: 'Successfully connected to Pool Brain API',
      productCount: products.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to connect to Pool Brain API',
    };
  }
}

// Legacy function name for backward compatibility
export function mapPoolBrainToHeritageFormat(product: PoolBrainProduct): {
  sku: string;
  heritageNumber: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  cost: number;
  unit: string;
  manufacturer: string;
  description: string;
  productId: number;
} {
  return {
    productId: product.RecordID,
    sku: product['Part#'] || `PB-${product.RecordID}`,
    heritageNumber: product['Part#'] || '',
    name: product.Name || 'Unknown Product',
    category: product.Category || 'Uncategorized',
    subcategory: '',
    price: product.Price || 0,
    cost: product.Cost || 0,
    unit: 'EA',
    manufacturer: '',
    description: product.Description || '',
  };
}
