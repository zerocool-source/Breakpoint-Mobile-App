// Using global fetch (Node 18+)

const POOLBRAIN_API_BASE = 'https://prodapi.poolbrain.com';
const POOLBRAIN_API_KEY = process.env.POOLBRAIN_API_KEY;

export interface PoolBrainProduct {
  ProductID: number;
  ProductName: string;
  ProductDescription: string;
  ProductCost: number;
  ProductPrice: number;
  ProductMarkup: number;
  ProductCategoryID: number;
  ProductCategoryName: string;
  ProductSubCategoryID?: number;
  ProductSubCategoryName?: string;
  ProductUnit: string;
  ProductSKU?: string;
  HeritageNumber?: string;
  IsActive: boolean;
  CreatedDate?: string;
  ModifiedDate?: string;
}

export interface PoolBrainCategory {
  CategoryID: number;
  CategoryName: string;
  SubCategories?: {
    SubCategoryID: number;
    SubCategoryName: string;
  }[];
}

export interface PoolBrainProductListResponse {
  success: boolean;
  data: PoolBrainProduct[];
  totalCount?: number;
  message?: string;
}

export interface PoolBrainCategoryListResponse {
  success: boolean;
  data: PoolBrainCategory[];
  message?: string;
}

async function makePoolBrainRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!POOLBRAIN_API_KEY) {
    throw new Error('POOLBRAIN_API_KEY is not configured');
  }

  const url = `${POOLBRAIN_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${POOLBRAIN_API_KEY}`,
      'X-API-Key': POOLBRAIN_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Pool Brain API error: ${response.status} - ${errorText}`);
    throw new Error(`Pool Brain API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<PoolBrainProduct[]> {
  try {
    const response = await makePoolBrainRequest<PoolBrainProductListResponse>('/v2/product_list');
    
    if (response.success && response.data) {
      return response.data.filter(p => p.IsActive !== false);
    }
    
    console.error('Pool Brain API returned unsuccessful response:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching products from Pool Brain:', error);
    throw error;
  }
}

export async function getProductCategories(): Promise<PoolBrainCategory[]> {
  try {
    const response = await makePoolBrainRequest<PoolBrainCategoryListResponse>('/v2/product_service_category_list');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    console.error('Pool Brain API returned unsuccessful response:', response.message);
    return [];
  } catch (error) {
    console.error('Error fetching categories from Pool Brain:', error);
    throw error;
  }
}

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
    sku: product.ProductSKU || `PB-${product.ProductID}`,
    heritageNumber: product.HeritageNumber || '',
    name: product.ProductName,
    category: product.ProductCategoryName || 'Uncategorized',
    subcategory: product.ProductSubCategoryName || '',
    price: product.ProductPrice || 0,
    cost: product.ProductCost || 0,
    unit: product.ProductUnit || 'EA',
    manufacturer: '',
    description: product.ProductDescription || '',
    productId: product.ProductID,
  };
}
