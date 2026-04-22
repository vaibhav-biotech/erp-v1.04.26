/**
 * Excel/CSV Parser Utility
 * Converts Excel and CSV files to Product objects
 */

import * as XLSX from 'xlsx';

interface ParsedProduct {
  name: string;
  category: string;
  subcategory: string;
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  stock?: number;
  rating: number;
  reviews: number;
  images: string[];
  description?: string;
  benefits?: string;
  care?: string;
  sizeVariants: Array<{ id: number; name: string; price: number; originalPrice?: number; tag?: string }>;
  potVariants: Array<{ id: number; name: string; price: number; tag?: string }>;
  status: 'active' | 'inactive' | 'draft';
}

interface ParseResult {
  success: boolean;
  data?: ParsedProduct[];
  errors?: string[];
}

/**
 * Parse Excel file buffer to Product objects
 */
export const parseExcelFile = (buffer: ArrayBuffer): ParseResult => {
  try {
    console.log('📊 Parsing Excel buffer, size:', buffer.byteLength, 'bytes');
    
    const workbook = XLSX.read(buffer, { type: 'array' });
    console.log('📖 Workbook sheets:', workbook.SheetNames);
    
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, errors: ['No sheets found in Excel file'] };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    console.log('✅ Parsed rows:', rawData.length);

    if (rawData.length === 0) {
      return {
        success: false,
        errors: ['Excel file is empty or contains no data']
      };
    }

    return transformData(rawData);
  } catch (error: any) {
    console.error('❌ Excel parse error:', error);
    return {
      success: false,
      errors: [`Failed to parse Excel file: ${error.message}`]
    };
  }
};

/**
 * Parse CSV text to Product objects
 */
export const parseCSVFile = (csvText: string): ParseResult => {
  try {
    // Split by newline and filter empty lines
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        errors: ['CSV file is empty or has no data rows']
      };
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());

    // Parse data rows
    const rawData = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      return row;
    });

    return transformData(rawData);
  } catch (error: any) {
    return {
      success: false,
      errors: [`Failed to parse CSV file: ${error.message}`]
    };
  }
};

/**
 * Transform raw data to Product objects
 */
const transformData = (rawData: any[]): ParseResult => {
  const products: ParsedProduct[] = [];
  const errors: string[] = [];

  // Helper to get column value with multiple fallbacks (case-insensitive)
  const getColumnValue = (row: any, ...columnNames: (string | number)[]): any => {
    for (const name of columnNames) {
      if (typeof name === 'string') {
        // Try exact match first
        if (row[name] !== undefined) return row[name];
        
        // Try case-insensitive match
        const key = Object.keys(row).find(k => k.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, ''));
        if (key && row[key] !== undefined) return row[key];
      }
    }
    return undefined;
  };

  rawData.forEach((row, index) => {
    try {
      // Required fields - use helper to get values
      const name = String(getColumnValue(row, 'Names', 'name') || '').trim();
      const category = String(getColumnValue(row, 'Category', 'category') || '').trim();
      const subcategoriesRaw = String(getColumnValue(row, 'Subcategory', 'subcategory') || '').trim();
      const discountRaw = getColumnValue(row, 'Discount', 'discount');
      const discount = parseFloat(String(discountRaw)) || 0;
      const ratingRaw = getColumnValue(row, 'Rating', 'rating');
      const rating = parseFloat(String(ratingRaw)) || 4.5;
      const reviewsRaw = getColumnValue(row, 'Reviews', 'reviews');
      const reviews = parseInt(String(reviewsRaw)) || 0;
      const stockRaw = getColumnValue(row, 'Stock', 'stock');
      const stock = parseInt(String(stockRaw)) || 0;

      // Validate required fields
      if (!name) {
        errors.push(`Row ${index + 2}: Product name is required`);
        return;
      }
      if (!category) {
        errors.push(`Row ${index + 2}: Category is required`);
        return;
      }
      if (!subcategoriesRaw) {
        errors.push(`Row ${index + 2}: Subcategory is required`);
        return;
      }

      // Parse multiple subcategories (comma-separated)
      const subcategoriesList = subcategoriesRaw
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (subcategoriesList.length === 0) {
        errors.push(`Row ${index + 2}: Subcategory is required`);
        return;
      }

      // Parse images - accepts multiple column name variations
      const imageUrlsRaw = 
        row['Images Link'] || 
        row['Image URLs'] || 
        row['Image Link'] ||
        row.imageUrls || 
        row['images'] || 
        row.Images ||
        '';
      const images = String(imageUrlsRaw)
        .split(',')
        .map((url: string) => url.trim())
        .filter((url: string) => url.length > 0);

      if (images.length === 0) {
        errors.push(`Row ${index + 2}: At least one image URL is required`);
        return;
      }

      // Parse size variants FIRST - use helper for column names
      const sizeVariantsRaw = getColumnValue(row, 'Size Variants', 'sizeVariants', 'size variants', 'Size', 'size') || '';
      const sizeOriginalPricesRaw = getColumnValue(row, 'Size Original Prices', 'sizeOriginalPrices', 'size original prices', 'Original Price', 'original price') || '';
      const sizeVariants = parseSizeVariants(sizeVariantsRaw, sizeOriginalPricesRaw, index, discount);

      // OPTION C: Make Original Price optional
      // If not provided, use first size price as original price
      let originalPrice: number;
      const originalPriceRaw = getColumnValue(row, 'Original Price', 'originalPrice', 'original price');
      
      if (originalPriceRaw && !isNaN(parseFloat(String(originalPriceRaw)))) {
        // Use provided original price
        originalPrice = parseFloat(String(originalPriceRaw));
      } else if (sizeVariants.length > 0) {
        // Fall back to first size price
        originalPrice = sizeVariants[0].price;
        console.log(`  ℹ️  Row ${index + 2}: Using first size price (${originalPrice}) as Original Price`);
      } else {
        // No original price and no size variants
        errors.push(`Row ${index + 2}: Either Original Price or Size Prices is required`);
        return;
      }

      if (isNaN(originalPrice) || originalPrice <= 0) {
        errors.push(`Row ${index + 2}: Original Price must be a valid number > 0`);
        return;
      }

      // Calculate final price
      const finalPrice = Math.round(originalPrice - (originalPrice * discount) / 100);

      // Parse pot variants - DISABLED FOR NOW (focus on size variants only)
      const potVariants: Array<{ id: number; name: string; price: number; tag?: string }> = [];

      // Parse description, benefits, care as SEPARATE fields (not combined)
      const description = String(row.Description || row.description || '').trim();
      const benefits = String(row.Benefits || row.benefits || '').trim();
      const care = String(row.Care || row.care || '').trim();

      // Status
      const status = (row.Status || row.status || 'active').toLowerCase();
      if (!['active', 'inactive', 'draft'].includes(status)) {
        errors.push(`Row ${index + 2}: Status must be active, inactive, or draft`);
        return;
      }

      // Create a product entry for EACH subcategory
      subcategoriesList.forEach(subcategory => {
        const product: ParsedProduct = {
          name,
          category,
          subcategory, // One subcategory per product entry
          originalPrice,
          finalPrice,
          discount: discount > 0 ? discount : undefined,
          stock: stock > 0 ? stock : undefined,
          rating: isNaN(rating) || rating < 0 || rating > 5 ? 4.5 : rating,
          reviews: isNaN(reviews) || reviews < 0 ? 0 : reviews,
          images,
          description: description || undefined,
          benefits: benefits || undefined,
          care: care || undefined,
          sizeVariants,
          potVariants,
          status: status as any
        };

        products.push(product);
      });
    } catch (error: any) {
      errors.push(`Row ${index + 2}: ${error.message}`);
    }
  });

  if (products.length === 0 && errors.length === 0) {
    errors.push('No valid products found in file');
  }

  return {
    success: products.length > 0,
    data: products.length > 0 ? products : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
};

/**
 * Parse size variants from comma-separated strings
 * Format: names="S,M,L" and originalPrices="100,150,200"
 * Applies discount to each price and stores both original and final price
 */
const parseSizeVariants = (
  names: string,
  originalPrices: string,
  rowIndex: number,
  discount: number = 0
): Array<{ id: number; name: string; price: number; originalPrice?: number; tag?: string }> => {
  if (!names || !originalPrices) return [];

  try {
    const nameArray = String(names).split(',').map(n => n.trim());
    const priceArray = String(originalPrices).split(',').map(p => p.trim());

    return nameArray
      .map((name, idx) => {
        const originalPrice = parseFloat(priceArray[idx]) || 0;
        const finalPrice = discount > 0 
          ? Math.round(originalPrice * (1 - discount / 100))
          : originalPrice;
        
        return {
          id: idx + 1,
          name,
          price: finalPrice,
          originalPrice: originalPrice > 0 ? originalPrice : undefined,
          tag: undefined
        };
      })
      .filter(v => v.originalPrice && v.originalPrice > 0);
  } catch (error) {
    console.warn(`Warning: Failed to parse size variants for row ${rowIndex + 2}`);
    return [];
  }
};

/**
 * Parse pot variants from comma-separated strings
 * Format: "5L,10L,15L" and "500,750,1000"
 */
const parsePotVariants = (
  names: string,
  prices: string,
  rowIndex: number
): Array<{ id: number; name: string; price: number; tag?: string }> => {
  if (!names || !prices) return [];

  try {
    const nameArray = String(names).split(',').map(n => n.trim());
    const priceArray = String(prices).split(',').map(p => p.trim());

    return nameArray
      .map((name, idx) => ({
        id: idx + 1,
        name,
        price: parseFloat(priceArray[idx]) || 0,
        tag: undefined
      }))
      .filter(v => v.price > 0);
  } catch (error) {
    console.warn(`Warning: Failed to parse pot variants for row ${rowIndex + 2}`);
    return [];
  }
};

/**
 * Detect file type from file extension
 */
export const getFileType = (fileName: string): 'excel' | 'csv' | 'unknown' => {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx' || extension === 'xls') return 'excel';

  return 'unknown';
};

/**
 * Read file as ArrayBuffer (for Excel) or text (for CSV)
 */
export const readFile = (file: File): Promise<ArrayBuffer | string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        console.log('✅ File read successfully:', file.name, 'Size:', file.size, 'Type:', result?.constructor.name);
        
        if (result instanceof ArrayBuffer || typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error(`Invalid result type: ${typeof result}`));
        }
      } catch (error: any) {
        console.error('❌ Error in onload:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      console.error('❌ FileReader error:', error, reader.error);
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
    };

    reader.onabort = () => {
      reject(new Error('File reading was aborted'));
    };

    try {
      const fileType = getFileType(file.name);
      console.log('📄 File type detected:', fileType);
      
      if (fileType === 'excel') {
        reader.readAsArrayBuffer(file);
      } else if (fileType === 'csv') {
        reader.readAsText(file);
      } else {
        reject(new Error(`Unsupported file format: ${file.name}. Please upload .xlsx, .xls, or .csv`));
      }
    } catch (error: any) {
      console.error('❌ Error reading file:', error);
      reject(error);
    }
  });
};
