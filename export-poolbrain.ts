import { getProducts, PoolBrainProduct } from './server/services/poolbrain';
import * as fs from 'fs';

async function exportAllProducts() {
  console.log('Fetching all products from Pool Brain API...');
  
  const allProducts: PoolBrainProduct[] = [];
  let offset = 0;
  const batchSize = 500;
  let hasMore = true;
  
  while (hasMore) {
    console.log(`Fetching batch at offset ${offset}...`);
    try {
      const batch = await getProducts({ offset, limit: batchSize });
      console.log(`Got ${batch.length} products in this batch`);
      
      if (batch.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...batch);
        offset += batchSize;
        
        if (batch.length < batchSize) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error fetching batch:', error);
      hasMore = false;
    }
  }
  
  console.log(`Total products fetched: ${allProducts.length}`);
  
  if (allProducts.length === 0) {
    console.log('No products found!');
    return;
  }
  
  const headers = [
    'RecordID',
    'Name',
    'Description',
    'Category',
    'Part Number',
    'Product/Service/Bundle',
    'Cost',
    'Price',
    'Markup %',
    'Status',
    'Charge Tax',
    'Duration',
    'Created Date',
    'Last Modified Date'
  ];
  
  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const calcMarkup = (cost: number, price: number): string => {
    if (!cost || cost === 0) return 'N/A';
    const markup = ((price - cost) / cost) * 100;
    return markup.toFixed(1) + '%';
  };
  
  const rows = allProducts.map(p => [
    p.RecordID,
    escapeCSV(p.Name),
    escapeCSV(p.Description),
    escapeCSV(p.Category),
    escapeCSV(p['Part#']),
    escapeCSV(p['Product/Service/Bundle']),
    p.Cost?.toFixed(2) || '0.00',
    p.Price?.toFixed(2) || '0.00',
    calcMarkup(p.Cost, p.Price),
    p.Status === 1 ? 'Active' : 'Inactive',
    p.ChargeTax === 1 ? 'Yes' : 'No',
    escapeCSV(p.Duration),
    escapeCSV(p.CreatedDate),
    escapeCSV(p.LastModifiedDate)
  ].join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  
  const filename = 'poolbrain-complete-product-catalog.csv';
  fs.writeFileSync(filename, csv);
  console.log(`\nExported ${allProducts.length} products to ${filename}`);
  
  const categories: { [key: string]: number } = {};
  allProducts.forEach(p => {
    const cat = p.Category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log('\n=== SUMMARY BY CATEGORY ===');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`${cat}: ${count} products`);
    });
  
  const types: { [key: string]: number } = {};
  allProducts.forEach(p => {
    const type = p['Product/Service/Bundle'] || 'Unknown';
    types[type] = (types[type] || 0) + 1;
  });
  
  console.log('\n=== SUMMARY BY TYPE ===');
  Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type}: ${count} items`);
    });
}

exportAllProducts().catch(console.error);
