/**
 * Excel/CSV Parser Utility
 * Converts Excel and CSV files to Product objects
 */

import * as XLSX from 'xlsx';

export interface ParsedProduct {
  name: string;
  category: string;
  subcategory: string;
  tags?: string[];
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
    const rawData = sheetToRows(worksheet);

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
 * Parse CSV via XLSX (handles quoted fields, commas in URLs/descriptions, UTF-8 BOM).
 */
export const parseCSVFile = (csvText: string): ParseResult => {
  try {
    const workbook = XLSX.read(csvText, {
      type: 'string',
      raw: false,
      codepage: 65001,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, errors: ['CSV file is empty'] };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = sheetToRows(worksheet);

    if (rawData.length === 0) {
      return {
        success: false,
        errors: ['CSV file is empty or contains no data rows'],
      };
    }

    console.log('✅ CSV columns:', Object.keys(rawData[0] || {}));
    console.log('✅ CSV parsed rows:', rawData.length);

    return transformData(rawData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      errors: [`Failed to parse CSV file: ${message}`],
    };
  }
};

/** Convert sheet to row objects with clean headers (BOM-safe). */
function sheetToRows(worksheet: XLSX.WorkSheet): Record<string, unknown>[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    raw: false,
  });

  return rows.map((row) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const header = String(key).replace(/^\uFEFF/, '').trim();
      cleaned[header] = value;
    }
    return cleaned;
  });
}

/**
 * Transform raw data to Product objects
 */
const transformData = (rawData: any[]): ParseResult => {
  const products: ParsedProduct[] = [];
  const errors: string[] = [];
  const toSlug = (value: string) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

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
      const subcategoryRaw = String(getColumnValue(row, 'Subcategory', 'subcategory') || '').trim();
      const tagsRaw = String(getColumnValue(row, 'Tags', 'tags') || '').trim();
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
      if (!subcategoryRaw) {
        errors.push(`Row ${index + 2}: Subcategory is required`);
        return;
      }

      const subcategoryParts = subcategoryRaw
        .split(',')
        .map((s) => toSlug(s.trim()))
        .filter(Boolean);

      const subcategory = subcategoryParts[0] || '';
      if (!subcategory) {
        errors.push(`Row ${index + 2}: Subcategory is required`);
        return;
      }

      const parsedTags = tagsRaw
        ? tagsRaw
          .split(',')
          .map((tag) => toSlug(tag))
          .filter(Boolean)
        : [];

      const tags = Array.from(
        new Set([subcategory, ...subcategoryParts.slice(1), ...parsedTags])
      );

      const imageUrlsRaw =
        getColumnValue(
          row,
          'Images Link',
          'Image URLs',
          'Image Link',
          'imageUrls',
          'images',
          'Images'
        ) || '';
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
        // Fall back to highest variant price (e.g. large = 999)
        const variantPrices = sizeVariants.map(
          (v) => v.originalPrice ?? v.price
        );
        originalPrice = Math.max(...variantPrices);
        console.log(`  ℹ️  Row ${index + 2}: Using max variant price (${originalPrice}) as Original Price`);
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
      const description = String(
        getColumnValue(row, 'Description', 'description') || ''
      ).trim();
      const benefits = String(getColumnValue(row, 'Benefits', 'benefits') || '').trim();
      const care = String(getColumnValue(row, 'Care', 'care') || '').trim();

      const status = String(
        getColumnValue(row, 'Status', 'status') || 'active'
      ).toLowerCase();
      if (!['active', 'inactive', 'draft'].includes(status)) {
        errors.push(`Row ${index + 2}: Status must be active, inactive, or draft`);
        return;
      }

      const product: ParsedProduct = {
        name,
        category,
        subcategory,
        tags,
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
 * Parse size variants — supports:
 * 1) Colon format (single column): "small:599,medium:799,large:999"
 * 2) Two-column: names="small, medium, large" + prices="599, 799, 999"
 */
const parseSizeVariants = (
  names: string,
  originalPrices: string,
  rowIndex: number,
  discount: number = 0
): Array<{ id: number; name: string; price: number; originalPrice?: number; tag?: string }> => {
  const namesStr = String(names || '').trim();
  if (!namesStr) return [];

  const applyDiscount = (originalPrice: number) =>
    discount > 0
      ? Math.round(originalPrice * (1 - discount / 100))
      : originalPrice;

  try {
    if (namesStr.includes(':')) {
      return namesStr
        .split(',')
        .map((part, idx) => {
          const [rawName, rawPrice] = part.trim().split(':');
          const originalPrice = parseFloat(String(rawPrice || '').trim()) || 0;
          const name = String(rawName || '').trim();
          if (!name || originalPrice <= 0) return null;
          return {
            id: idx + 1,
            name,
            price: applyDiscount(originalPrice),
            originalPrice,
            tag: undefined,
          };
        })
        .filter((v): v is NonNullable<typeof v> => v !== null);
    }

    const pricesStr = String(originalPrices || '').trim();
    if (!pricesStr) return [];

    const nameArray = namesStr.split(',').map((n) => n.trim());
    const priceArray = pricesStr.split(',').map((p) => p.trim());

    return nameArray
      .map((name, idx) => {
        const originalPrice = parseFloat(priceArray[idx]) || 0;
        if (!name || originalPrice <= 0) return null;
        return {
          id: idx + 1,
          name,
          price: applyDiscount(originalPrice),
          originalPrice,
          tag: undefined,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  } catch {
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
        reader.readAsText(file, 'UTF-8');
      } else {
        reject(new Error(`Unsupported file format: ${file.name}. Please upload .xlsx, .xls, or .csv`));
      }
    } catch (error: any) {
      console.error('❌ Error reading file:', error);
      reject(error);
    }
  });
};
