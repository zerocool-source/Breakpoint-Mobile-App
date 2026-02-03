// Using global fetch (Node 18+)

const POOLBRAIN_API_BASE = 'https://prodapi.poolbrain.com';
const POOLBRAIN_API_KEY = process.env.POOLBRAIN_API_KEY;

export interface PoolBrainProduct {
  id?: number;
  productID?: number;
  ProductID?: number;
  productName?: string;
  ProductName?: string;
  name?: string;
  description?: string;
  productDescription?: string;
  ProductDescription?: string;
  cost?: number;
  productCost?: number;
  ProductCost?: number;
  price?: number;
  productPrice?: number;
  ProductPrice?: number;
  markup?: number;
  productMarkup?: number;
  ProductMarkup?: number;
  categoryId?: number;
  productCategoryID?: number;
  ProductCategoryID?: number;
  categoryName?: string;
  productCategoryName?: string;
  ProductCategoryName?: string;
  subCategoryId?: number;
  productSubCategoryID?: number;
  ProductSubCategoryID?: number;
  subCategoryName?: string;
  productSubCategoryName?: string;
  ProductSubCategoryName?: string;
  unit?: string;
  productUnit?: string;
  ProductUnit?: string;
  sku?: string;
  productSKU?: string;
  ProductSKU?: string;
  heritageNumber?: string;
  HeritageNumber?: string;
  isActive?: boolean;
  IsActive?: boolean;
  createdDate?: string;
  CreatedDate?: string;
  modifiedDate?: string;
  ModifiedDate?: string;
}

export interface PoolBrainCategory {
  CategoryID?: number;
  categoryId?: number;
  CategoryName?: string;
  categoryName?: string;
  name?: string;
  SubCategories?: {
    SubCategoryID?: number;
    subCategoryId?: number;
    SubCategoryName?: string;
    subCategoryName?: string;
  }[];
}

export interface PoolBrainApiResponse<T> {
  success?: boolean;
  status?: string;
  data?: T;
  products?: T;
  items?: T;
  results?: T;
  totalCount?: number;
  message?: string;
}

async function makePoolBrainRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!POOLBRAIN_API_KEY) {
    throw new Error('POOLBRAIN_API_KEY is not configured');
  }

  const url = `${POOLBRAIN_API_BASE}${endpoint}`;
  
  console.log(`[Pool Brain] Making request to: ${url}`);
  console.log(`[Pool Brain] Using API key: ${POOLBRAIN_API_KEY.substring(0, 8)}...`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
    const response = await makePoolBrainRequest<PoolBrainApiResponse<PoolBrainProduct[]>>('/v2/product_list');
    
    console.log('[Pool Brain] Product response:', JSON.stringify(response).substring(0, 500));
    
    const products = response.data || response.products || response.items || response.results;
    if (products && Array.isArray(products)) {
      return products.filter(p => p.IsActive !== false && p.isActive !== false);
    }
    
    if (Array.isArray(response)) {
      return (response as PoolBrainProduct[]).filter(p => p.IsActive !== false && p.isActive !== false);
    }
    
    console.error('Pool Brain API returned unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('Error fetching products from Pool Brain:', error);
    throw error;
  }
}

export async function getProductCategories(): Promise<PoolBrainCategory[]> {
  try {
    const response = await makePoolBrainRequest<PoolBrainApiResponse<PoolBrainCategory[]>>('/v2/product_service_category_list');
    
    const categories = response.data || response.products || response.items || response.results;
    if (categories && Array.isArray(categories)) {
      return categories;
    }
    
    if (Array.isArray(response)) {
      return response as PoolBrainCategory[];
    }
    
    console.error('Pool Brain API returned unexpected response format:', response);
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
  const productId = product.ProductID || product.productID || product.id || 0;
  const sku = product.ProductSKU || product.productSKU || product.sku || `PB-${productId}`;
  const name = product.ProductName || product.productName || product.name || 'Unknown Product';
  const category = product.ProductCategoryName || product.productCategoryName || product.categoryName || 'Uncategorized';
  const subcategory = product.ProductSubCategoryName || product.productSubCategoryName || product.subCategoryName || '';
  const price = product.ProductPrice || product.productPrice || product.price || 0;
  const cost = product.ProductCost || product.productCost || product.cost || 0;
  const unit = product.ProductUnit || product.productUnit || product.unit || 'EA';
  const description = product.ProductDescription || product.productDescription || product.description || '';
  const heritageNumber = product.HeritageNumber || product.heritageNumber || '';
  
  return {
    sku,
    heritageNumber,
    name,
    category,
    subcategory,
    price,
    cost,
    unit,
    manufacturer: '',
    description,
    productId,
  };
}
